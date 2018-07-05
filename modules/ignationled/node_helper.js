/* Magic Mirror
* Node Helper: IgnationLed
*
* By Ignation https://ignation.io
* All rights reserved
*/

// Vars and constants
const request = require('request');

const NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR  = "NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR";
const NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR    = "NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR";
const NOTIFICATION_IG_LED_START_FOCUS_ANIMATION     = "NOTIFICATION_IG_LED_START_FOCUS_ANIMATION";
const NOTIFICATION_IG_LED_END_FOCUS_ANIMATION       = "NOTIFICATION_IG_LED_END_FOCUS_ANIMATION";
const NOTIFICATION_IG_LED_CONFIRMED               	= "NOTIFICATION_IG_LED_CONFIRMED";
const NOTIFICATION_IG_LED_ERROR               			= "NOTIFICATION_IG_LED_ERROR";
const NOTIFICATION_IG_LED_INPUT_REQUIRED            = "NOTIFICATION_IG_LED_INPUT_REQUIRED";
const NOTIFICATION_IG_LED_END_INPUT_REQUIRED        = "NOTIFICATION_IG_LED_END_INPUT_REQUIRED";

const IG_LED_SERVER_PATH_START_ACTIVITY_INDICATOR   = "startActivityIndicator";
const IG_LED_SERVER_PATH_END_ACTIVITY_INDICATOR     = "endActivityIndicator";
const IG_LED_SERVER_PATH_START_FOCUS_ANIMATION      = "startFocusAnimation";
const IG_LED_SERVER_PATH_END_FOCUS_ANIMATION        = "stopFocusAnimation";
const IG_LED_SERVER_PATH_CONFIRMED               	  = "confirmed";
const IG_LED_SERVER_PATH_ERROR               			  = "error";
const IG_LED_SERVER_PATH_INPUT_REQUIRED             = "inputRequired";
const IG_LED_SERVER_PATH_END_INPUT_REQUIRED         = "endInputRequired";

const IG_LED_PYTHON_SERVER_URL                      = "http://localhost:8001";
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
    if (notification === NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR) {            // NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR
      this.makeGETRequest(IG_LED_SERVER_PATH_START_ACTIVITY_INDICATOR);
		} else if (notification === NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR) {       // NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR
      this.makeGETRequest(IG_LED_SERVER_PATH_END_ACTIVITY_INDICATOR);
		} else if (notification === NOTIFICATION_IG_LED_START_FOCUS_ANIMATION) {        // NOTIFICATION_IG_LED_START_FOCUS_ANIMATION
      this.makeGETRequest(IG_LED_SERVER_PATH_START_FOCUS_ANIMATION);
		} else if (notification === NOTIFICATION_IG_LED_END_FOCUS_ANIMATION) {          // NOTIFICATION_IG_LED_END_FOCUS_ANIMATION
      this.makeGETRequest(IG_LED_SERVER_PATH_END_FOCUS_ANIMATION);
		} else if (notification === NOTIFICATION_IG_LED_CONFIRMED) {                    // NOTIFICATION_IG_LED_CONFIRMED
      this.makeGETRequest(IG_LED_SERVER_PATH_CONFIRMED);
		} else if (notification === NOTIFICATION_IG_LED_ERROR) {                        // NOTIFICATION_IG_LED_ERROR
      this.makeGETRequest(IG_LED_SERVER_PATH_ERROR);
		} else if (notification === NOTIFICATION_IG_LED_INPUT_REQUIRED) {               // NOTIFICATION_IG_LED_INPUT_REQUIRED
      this.makeGETRequest(IG_LED_SERVER_PATH_INPUT_REQUIRED);
		} else if (notification === NOTIFICATION_IG_LED_END_INPUT_REQUIRED) {           // IG_LED_SERVER_PATH_END_INPUT_REQUIRED
      this.makeGETRequest(IG_LED_SERVER_PATH_END_INPUT_REQUIRED);
    }
  }, // eof: socketNotificationReceived

  /*** makeGETRequest() ***
  *
  *   Makes a GET request to the Python LED server. Pleae note this function will not notify/return anything about the GET result.
  *   @param functionPath the function to be called on the Python server
  *
  */
  makeGETRequest: function(functionPath) {
    request(IG_LED_PYTHON_SERVER_URL + "/" + functionPath, { }, (err, res, body) => {
      if (err) {
        console.log(err);
      }
    });
  },
});
