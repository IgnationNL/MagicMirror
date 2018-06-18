/* Magic Mirror
* Module: IgnationLed
*
* By Ignation https://ignation.io
* All rights reserved
*/

const NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR  = "NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR";
const NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR    = "NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR";
const NOTIFICATION_IG_LED_START_FOCUS_ANIMATION     = "NOTIFICATION_IG_LED_START_FOCUS_ANIMATION";
const NOTIFICATION_IG_LED_END_FOCUS_ANIMATION       = "NOTIFICATION_IG_LED_END_FOCUS_ANIMATION";
const NOTIFICATION_IG_LED_CONFIRMED               	= "NOTIFICATION_IG_LED_CONFIRMED";
const NOTIFICATION_IG_LED_ERROR               			= "NOTIFICATION_IG_LED_ERROR";
const NOTIFICATION_IG_LED_INPUT_REQUIRED            = "NOTIFICATION_IG_LED_INPUT_REQUIRED";
const NOTIFICATION_IG_LED_END_INPUT_REQUIRED        = "NOTIFICATION_IG_LED_END_INPUT_REQUIRED";

Module.register("ignationled", {

	// Module config defaults.
	defaults: {

	},

	/*** start() ***
	*
	*   Defines the start sequence for the module.
	*
	*/
	start: function() {
		Log.info("Starting module: " + this.name);
	},


	/*** notificationReceived ***
	*
	*   A notification was received
	*
	*/
	notificationReceived: function(notification, payload, sender) {
		Log.info("notification received: " + notification);

		// Relay the notification to the node_helper
		if (notification === NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR) {            // NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR
      this.sendSocketNotification(NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR, null);
		} else if (notification === NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR) {       // NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR
      this.sendSocketNotification(NOTIFICATION_IG_LED_END_ACTIVITY_INDICATOR, null);
		} else if (notification === NOTIFICATION_IG_LED_START_FOCUS_ANIMATION) {        // NOTIFICATION_IG_LED_START_FOCUS_ANIMATION
      this.sendSocketNotification(NOTIFICATION_IG_LED_START_FOCUS_ANIMATION, null);
		} else if (notification === NOTIFICATION_IG_LED_END_FOCUS_ANIMATION) {          // NOTIFICATION_IG_LED_END_FOCUS_ANIMATION
      this.sendSocketNotification(NOTIFICATION_IG_LED_END_FOCUS_ANIMATION, null);
		} else if (notification === NOTIFICATION_IG_LED_CONFIRMED) {                    // NOTIFICATION_IG_LED_CONFIRMED
      this.sendSocketNotification(NOTIFICATION_IG_LED_CONFIRMED, null);
		} else if (notification === NOTIFICATION_IG_LED_ERROR) {                        // NOTIFICATION_IG_LED_ERROR
      this.sendSocketNotification(NOTIFICATION_IG_LED_ERROR, null);
		} else if (notification === NOTIFICATION_IG_LED_INPUT_REQUIRED) {               // NOTIFICATION_IG_LED_INPUT_REQUIRED
      this.sendSocketNotification(NOTIFICATION_IG_LED_INPUT_REQUIRED, null);
		} else if (notification === NOTIFICATION_IG_LED_END_INPUT_REQUIRED) {           // NOTIFICATION_IG_LED_END_INPUT_REQUIRED
      this.sendSocketNotification(NOTIFICATION_IG_LED_END_INPUT_REQUIRED, null);
		}
	},
});
