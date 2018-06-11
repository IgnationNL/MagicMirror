/* Magic Mirror
* Node Helper: QRCodeScanner
*
* By Ignation https://ignation.io
* All rights reserved
*/

var fs    				= require("fs");
const AWS        = require('aws-sdk');
const rekognition = new AWS.Rekognition({ "accessKeyId": "AKIAJ2MBWRIJ4SFMJPRA", "secretAccessKey": "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", "region": "us-west-2" });

const RaspiCam 	= require("raspicam");
const Raspistill = require('node-raspistill').Raspistill;

const faceCollection = 'photos';
const s3bucket = 'ignationbucket';

const camera = new Raspistill({
  outputDir: __dirname,
  fileName: 'image',
  encoding: 'jpg',
  verticalFlip: true,
  noPreview: true,
  width: 500,
  height: 680
});

module.exports = NodeHelper.create({
  // Override start method.
  start: function() {
    console.log("Starting node helper for: " + this.name);
  },

  // Override socketNotificationReceived method.
  socketNotificationReceived: function(notification, payload) {

    // Take photo notification
    if (notification === "KEYPRESS") {

      if (payload.KeyName !== "Enter") { // Only respond to Enter key
        return;
      }

      // AWS SDK configure
      AWS.config.loadFromPath(__dirname + '/AWS.config.json');
      var s3 = new AWS.S3();
      var message, msgcontent;
      // eof: AWS SDK configure


      // taking photo
      camera.takePhoto().then((photo) => {

        console.log('picture: ', photo);



        // AWS SDK
        var fileStream = fs.createReadStream('/Users/wesley/Desktop/parel.jpg'); //Face_photo.jpg
        var now = new Date();
        var key = 'P' + now.toISOString().slice(2, 19).replace(/-|T|:/g, "") + '.jpg'; // Change to PYYMMDDHHMMSS
        var params = {Bucket: s3bucket, Key: key, Body: fileStream};
        //console.log("filestream", fileStream);

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
              console.log("we got error");
              console.log(err, err.stack);
            }
            else { // Result
              if(resp.FaceMatches.length > 0) { // Matches
                console.log("matches");

                var face = resp.FaceMatches[0].Face;
                var faceId = face.ExternalImageId;
                console.log("face match: " + faceId);
                self.sendSocketNotification("AWS_REKOGNITION_RESULT", {"result": {"faceId": faceId}, "error": null});
              }
              else { // No matches
                console.log("no matches");
                self.sendSocketNotification("AWS_REKOGNITION_RESULT", {"result": {"faceId": null}, "error": null});
              }


            }
          });
        }).catch((err) => {
          console.log('error photo ', err);
          self.sendSocketNotification("AWS_REKOGNITION_RESULT", {"result": null, "error": err});
        });
        // eof: AWS SDK




      }).catch((err) => {
        console.log('error photo ', err);
      });
      // eof: taking photo


    }
    // eof: Take photo notification
  },
});
