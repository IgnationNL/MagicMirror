/* Magic Mirror
* Node Helper: IgnationFaceRec
*
* By Ignation https://ignation.io
* All rights reserved
*/

var NodeHelper = require("node_helper");

// Vars and constants
var fs    				                            = require("fs");
const AWS                                     = require('aws-sdk');
const AWS_ACCESS_KEY_ID                       = "AKIAJ2MBWRIJ4SFMJPRA";
const AWS_SECRET_ACCESS_KEY                   = "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"
const rekognition                             = new AWS.Rekognition({ "accessKeyId": AWS_ACCESS_KEY_ID, "secretAccessKey": AWS_SECRET_ACCESS_KEY, "region": "us-west-2" });

const RaspiCam 	                              = require("raspicam");
const Raspistill                              = require('node-raspistill').Raspistill;

const faceCollection                          = 'photos';
const s3bucket                                = 'ignationbucket';

const camera                                  = new Raspistill({
                                                outputDir: __dirname,
                                                fileName: 'image',
                                                encoding: 'jpg',
                                                verticalFlip: true,
                                                noPreview: true,
                                                width: 500,
                                                height: 680
                                              });

const NOTIFICATION_SIGN_IN_USER                 = "IG_SIGN_IN_USER";
const NOTIFICATION_SIGN_IN_USER_RESULT          = "IG_SIGN_IN_USER_RESULT";
const NOTIFICATION_REGISTER_USER                = "IG_REGISTER_USER";
const NOTIFICATION_REGISTER_USER_RESULT         = "IG_REGISTER_USER_RESULT";

const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_FAILED            = 0;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_TAKING_PICTURE    = 1;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_ANALYSING_PICTURE = 2;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE              = 3;

// eof: Vars and constants

module.exports = NodeHelper.create({
  // Override start method.
  start: function() {
    console.log("Starting node helper for: " + this.name);
  },
 
  // callback(err, resp);
  awsUploadFile: function(callback) {
      console.log("In awsUploadFile");
      var fileStream = fs.createReadStream(__dirname + '/image.jpg');
      var now = new Date();
      var key = 'P' + now.toISOString().slice(2, 19).replace(/-|T|:/g, "") + '.jpg'; // Change to PYYMMDDHHMMSS
      var params = {
        Bucket: s3bucket,
        Key: key,
        Body: fileStream
      };

      var uploadPromise = s3.upload(params).promise();

      var self = this;
      uploadPromise.then((response) => {
        callback(null, response);
        return;

      }). catch((err) => {
        callback(err, null);
        return;
      });
  },

  awsRekognitionSearchFacesByImage: function(key, callback) {
      console.log("in awsRekognitionSearchFacesByImage with key : " + key);
      let params = {
        CollectionId: faceCollection,
        Image: {
          S3Object: {
            Bucket: s3bucket,
            Name: key
          }
        },
        FaceMatchThreshold: 80,
        MaxFaces: 1
      };

      rekognition.searchFacesByImage(params, function(err, resp) {
          callback(err, resp);
          return;
      });
  },

  awsDeleteBucketObject: function(key, callback) {
      console.log("In awsDeleteBucketObject with key : " + key);
      let params = {
          Image: {
            S3Object: {
              Bucket: s3bucket,
              Name: key
            }
          }
      }

      s3.deleteObject(params.Image, function(err, resp) {
          callback(err, resp);
          return;
      });
  },

  awsIndexFace: function (key, callback) {
      console.log("in awsIndexFace with key : " + key);
      var name = payload.name; 
      var key = payload.key; // Unique identifier

      console.log("key before encode " + key);
      var nameEncoded = btoa(name);
      console.log("Name : " + name + " and encoded : " + nameEncoded);
      console.log("Name decoded again : " + atob(nameEncoded));

      const params = {
        CollectionId: faceCollection,
        ExternalImageId: key + nameEncoded,
        DetectionAttributes: [],
        Image: {
          S3Object: {
            Bucket: s3bucket,
            Name: key
          }
        }
      };

      rekognition.indexFaces(params, function(err, resp) {
          callback(err, resp);
          return;
      });
  },


  /*** socketNotificationReceived ***
   *
   *   A notification from the client was received.
   *
   */
  socketNotificationReceived: function(notification, payload) {
    // Take photo notification
    if (notification === NOTIFICATION_SIGN_IN_USER) { // Sign in user
      
      // AWS SDK configure
      AWS.config.loadFromPath(__dirname + '/AWS.config.json');
      var s3 = new AWS.S3();
      var message, msgcontent;
      // eof: AWS SDK configure

      // Send status update
      this.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
        "result": {
          "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_TAKING_PICTURE
        },
        "error": null
      });

      // taking photo
      camera.takePhoto().then((photo) => {
        // Send status update
        this.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
          "result": {
            "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_ANALYSING_PICTURE
          },
          "error": null
        });

        // AWS SDK
        this.awsUploadFile(function(errUpload, respUpload) {
          if (errUpload) {
            self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
              "result": null,
              "error": errUpload
            });
            return;
          }

          // Upload succesful, do search faces
          this.awsRekognitionSearchFacesByImage(respUpload.Key, function(errSearchFace, respSearchFace) {
            if (errSearchFace) {
              self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                  "result": null,
                  "error": errSearchFace
                });
                return;
            }

            //If face was recognized then delete the image from the bucket
            this.awsDeleteBucketObject(respUpload.Key, function(errDeleteImage, respDeleteImage) {
              if (errDeleteImage) {
                console.log(errDeleteImage);
                return;
              }
            }); //eof: deleteImage 

            //If match was found, send socket notification with the name of the person 
            if (respSearchFace.FaceMatches.length > 0) { // Matches
                var face = resp.FaceMatches[0].Face;
                var faceId = face.ExternalImageId; 
                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                  "result": {
                    "faceId": faceId,
                    "key": respUpload.Key,
                    "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE
                  },
                  "error": null
                });
                return;
            } else { // No matches
                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                  "result": {
                    "faceId": null,
                    "key": respUpload.Key,
                    "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE
                  },
                  "error": null
                });
                return;
              }
          }); //eof: searchFaces
        }); //eof: uploadFile
      }).catch((err) => {
        self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
          "result": null,
          "error": err
        });
        return;
      }); // eof: taking photo //eof: takePhoto
    } // eof: Sign in user
    else if (notification === NOTIFICATION_REGISTER_USER) { // Register user
      this.awsIndexFace(payload.key, function (errIndexFace, respIndexFace) {

        if (errIndexFace) {
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
            "result": null,
            "error": err
          });
          return;
        } else {

          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
            "result": {
              "externalImageId": externalImageId
            },
            "error": null
          });
          return;
        }
      });
    } // Eof: Register user

  }, // eof: socketNotificationReceived
});
