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
const s3bucketTempPhotos                      = 'ignationbuckettempphotos'

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

// AWS SDK configure
AWS.config.loadFromPath(__dirname + '/AWS.config.json');
var s3 = new AWS.S3();
var message, msgcontent;
// eof: AWS SDK configure

// eof: Vars and constants


// Creates a key consisting of a unique identifier, and if a name specified it will be included.
function createKey(name) {

  var now = new Date();
  var id = 'P' + now.toISOString().slice(2, 19).replace(/-|T|:/g, ""); // Change to PYYMMDDHHMMSS
  var key = id;

  if (name) {
    var nameEncoded = Buffer.from(name).toString('base64').replace(/=/), "";
    nameEncoded = nameEncoded.replace("=", "");
    var key = id + nameEncoded;
  } 

  return key;
}

module.exports = NodeHelper.create({
  // Override start method.
  start: function() {
    console.log("Starting node helper for: " + this.name);
  },

  // callback(err, resp);
  awsUploadFile: function(key, bucket, callback) {
    var fileStream = fs.createReadStream(__dirname + '/image.jpg');

    var params = {
      Bucket: bucket,
      Key: key,
      Body: fileStream
    };
    var uploadPromise = s3.upload(params).promise();
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
          Bucket: s3bucketTempPhotos,
          Name: key
        }
      },
      FaceMatchThreshold: 80,
      MaxFaces: 1
    };

    rekognition.searchFacesByImage(params, function(err, resp) {
     if (err) {
      console.log("searchface error : " + err);
    }
    callback(err, resp);
    return;
  });
  },

  awsDeleteBucketObject: function (key, callback) {
    console.log("In awsDeleteBucketObject with key : " + key);
    let params = {
      Bucket: s3bucket,
      Key: key    
    }

    s3.deleteObject(params, function(err, resp) {
      callback(err, resp);
      return;
    });
  },

  awsIndexFace: function (key, callback) {
    const params = {
      CollectionId: faceCollection,
      ExternalImageId: key,
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
    });
  },


  /*** socketNotificationReceived ***
   *
   *   A notification from the client was received.
   *
   */
   socketNotificationReceived: function(notification, payload) {
    // Take photo notification
    var self = this;
    if (notification === NOTIFICATION_SIGN_IN_USER) { // Sign in user

      // Send status update
      self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
        "result": {
          "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_TAKING_PICTURE
        },
        "error": null
      });

      // taking photo
      camera.takePhoto().then((photo) => {
        // Send status update
        self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
          "result": {
            "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_ANALYSING_PICTURE
          },
          "error": null
        });

        // AWS SDK
        self.awsUploadFile(createKey(), s3bucketTempPhotos, function(errUpload, respUpload) {
          if (errUpload) {
            self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
              "result": null,
              "error": errUpload
            });
            return;
          }

          // Upload succesful, do search faces
          self.awsRekognitionSearchFacesByImage(respUpload.Key, function(errSearchFace, respSearchFace) { // search face

            self.awsDeleteBucketObject(respUpload.Key, function(errDeleteImage, respDeleteImage) { // delete file
              //Ignore error delete image because 
              if (errDeleteImage) {
                console.log(errDeleteImage);
              }

              if (errSearchFace) {
                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                  "result": null,
                  "error": errSearchFace
                });      

                return;
              }

              //If match was found, send socket notification with the name of the person 
              if (respSearchFace.FaceMatches.length > 0) { // Matches
                var face = respSearchFace.FaceMatches[0].Face;
                var faceId = face.ExternalImageId; 

                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                  "result": {
                    "faceId": Buffer.from(faceId.substring(17), 'base64').toString(),
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
            }); //eof: deleteImage

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

      var key = createKey(payload.name);

      self.awsUploadFile(key, s3bucket, function(errUpload, respUpload) {
        if (errUpload) {
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
            "result": null,
            "error": errUpload
          });
          return;
        }

        // Step 2: index face
        self.awsIndexFace(key, function (errIndexFace, respIndexFace) {
          console.log("in register user with payload : " + JSON.stringify(payload));

          if (errIndexFace) {
            self.awsDeleteBucketObject(key, function(errDeleteImage, respDeleteImage) { // delete file because we couldnt index it.

              self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
                "result": null,
                "error": errIndexFace
              });
              return;
            });
          } else {

            self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
              "result": {
                "externalImageId": key // We will send back the key to the user. The key consits of a unique identifier + encoded name. 
              },
              "error": null
            });
            return;
          }
        }); // eof index face
      }); // eof: upload file.

    } // eof: register user














    } // Eof: Register user

  }, // eof: socketNotificationReceived
});
