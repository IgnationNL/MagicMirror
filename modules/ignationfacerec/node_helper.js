/* Magic Mirror
* Node Helper: IgnationFaceRec
*
* By Ignation https://ignation.io
* All rights reserved
*/

var NodeHelper = require("node_helper");

// Vars and constants
var fs    				                            = require("fs");
const RaspiCam 	                              = require("raspicam");
const Raspistill                              = require('node-raspistill').Raspistill;
const request                                 = require('request');

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

const M3_API_LOG_IN_ENDPOINT                      = "https://magicmirrormanagement.eu-gb.mybluemix.net/mirror/login";
const M3_API_REGISTER_ENDPOINT                    = "https://magicmirrormanagement.eu-gb.mybluemix.net/mirror/register";
const M3_API_TOKEN										            = "dsf*(U*#3><msdaE@#?.,sdfosj)";

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
     console.log("socket notification recieved: ");
    // Take photo notification
    var self = this;
    if (notification === NOTIFICATION_SIGN_IN_USER) { // Sign in user
      console.log("is sign in");
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

        console.log("uploading to m3 login");
        // Upload the file to M3 API
        var req = request.post(M3_API_LOG_IN_ENDPOINT, function (errR, respR, body) {
          if (errR) { // Error from requests.
            self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
              "result": null,
              "error": "Something went wrong communicating with the server."
            });
            return;
          } else { // Successfull
            var resp = JSON.parse(respR.body).resp;
            var err = JSON.parse(respR.body).err;

            if (err) { // Error from M3
              self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
                "result": null,
                "error": err
              });
              return;
            }

            self.sendSocketNotification(NOTIFICATION_SIGN_IN_USER_RESULT, {
              "result": {
                "result": resp,
                "status": NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE
              },
              "error": null
            });
          }
        });
        var form = req.form();
        form.append('faceImage', fs.createReadStream(__dirname + '/image.jpg'));
        form.append('api_token', M3_API_TOKEN);

       });
    } // eof: Sign in user
    else if (notification === NOTIFICATION_REGISTER_USER) { // Register user
      var req = request.post(M3_API_REGISTER_ENDPOINT, function (errR, respR, body) {
        if (errR) { // Error from requests.
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
            "result": null,
            "error": "Something went wrong communicating with the server."
          });
          return;
        } else { // Successfull
          var resp = JSON.parse(respR.body).resp;
          var err = JSON.parse(respR.body).err;

          if (err) { // Error from M3
            self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
              "result": null,
              "error": err
            });
            return;
          }

          // Successfull response
          self.sendSocketNotification(NOTIFICATION_REGISTER_USER_RESULT, {
            "result": {
              "success": true
            },
            "error": null
          });
          return;
        }
      });

      var form = req.form();
      form.append('faceImage', fs.createReadStream(__dirname + '/image.jpg'));
      form.append('name', payload.name);
      form.append('api_token', M3_API_TOKEN);

    } // eof: register user


  }, // eof: socketNotificationReceived
});
