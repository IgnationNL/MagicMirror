/* Magic Mirror
* Node Helper: IgnationFaceRec
*
* By Ignation https://ignation.io
* All rights reserved
*/

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

const NOTIFICATION_SIGN_IN_USER               = "SIGN_IN_USER";
const NOTIFICATION_SIGN_IN_USER_RESULT        = "SIGN_IN_USER_RESULT";
const NOTIFICATION_REGISTER_USER              = "REGISTER_USER";
const NOTIFICATION_REGISTER_USER_RESULT       = "REGISTER_USER_RESULT";
// eof: Vars and constants

module.exports = NodeHelper.create({
  // Override start method.
  start: function() {
    console.log("Starting node helper for: " + this.name);
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

      // taking photo
      camera.takePhoto().then((photo) => {
        // AWS SDK
        var fileStream = fs.createReadStream('/Users/wesley/Desktop/parel.jpg'); //Face_photo.jpg
        var now = new Date();
        var key = 'P' + now.toISOString().slice(2, 19).replace(/-|T|:/g, "") + '.jpg'; // Change to PYYMMDDHHMMSS
        var params = {Bucket: s3bucket, Key: key, Body: fileStream};

        var uploadPromise = s3.upload(params).promise();

        var self = this;
        uploadPromise.then((response) => {
          // Search faces
          let params = {CollectionId:faceCollection, Image:{S3Object:{Bucket: s3bucket, Name:key}},
          FaceMatchThreshold:80, MaxFaces:1};
          rekognition.searchFacesByImage(params, function(err, resp)
          {

            let body = '{}';
            if(err) { // Error
              self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {"result": null, "error": err});
              return;
            }
            else { // Result
              if(resp.FaceMatches.length > 0) { // Matches
                var face = resp.FaceMatches[0].Face;
                var faceId = face.ExternalImageId;
                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {"result": {"faceId": faceId, "key": key}, "error": null});
                return;
              }
              else { // No matches
                self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {"result": {"faceId": null, "key": key}, "error": null});
                return;
              }
            }
          });
        }).catch((err) => {
          self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {"result": null, "error": err});
          return;
        });
        // eof: AWS SDK
      }).catch((err) => {
        self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {"result": null, "error": err});
        return;
      });
      // eof: taking photo

    } // eof: Sign in user
    else if (notification === NOTIFICATION_REGISTER_USER) { // Register user
      var externalImageId = payload.name; // Username
      var key = payload.key; // Unique identifier

      const params = {CollectionId:faceCollection, ExternalImageId: externalImageId, DetectionAttributes:[], Image:{S3Object:{Bucket:s3bucket, Name:key}}};
      var self = this;
      rekognition.indexFaces(params, function(err, resp) {

        if (err) {
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {"result": null, "error": err});
          return;
        } else {
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {"result": {"externalImageId": externalImageId}, "error": null});
          return;
        }

      });

    } // Eof: Register user

  }, // eof: socketNotificationReceived
});
