/* Magic Mirror
 * Module: IgnationFaceRec
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */

const NOTIFICATION_SIGN_IN_USER 																= "IG_SIGN_IN_USER";
const NOTIFICATION_SIGN_IN_USER_RESULT 													= "IG_SIGN_IN_USER_RESULT";
const NOTIFICATION_REGISTER_USER 																= "IG_REGISTER_USER";
const NOTIFICATION_REGISTER_USER_RESULT 												= "IG_REGISTER_USER_RESULT";
const NOTIFICATION_STATUS_MESSAGE 															= "IG_STATUS_MESSAGE";

const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_FAILED 						= 0;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_TAKING_PICTURE 		= 1;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_ANALYSING_PICTURE = 2;
const NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE 							= 3;

Module.register("ignationfacerec", {

  // Module config defaults.
  defaults: {
    guests: {}, // Format: "identifier": {"vcard": "vcard-content", "checkInOutTime": "timestamp", "isCheckedIn": false}
    checkInOutDelay: 10000,
    updateInterval: 1000, // Interval at which DOM will be cleaned up
    timeToFade: 4000, // Time to be passed before a status message will be fade out. Typically we only want to use this for the "Welcome" message as not to stick on the screen for too long.
    fadeSpeed: 4000, // The speed at which status messages fade.
    statusMessage: "Ready to check-in",
    statusMessageLastUpdateTime: null,
    isInRegisterMode: false,
    imageKey: null,
  },

  /*** start() ***
   *
   *   Defines the start sequence for the module.
   *
   */
  start: function() {
    Log.info("Starting module: " + this.name);

    var self = this;

    this.sendSocketNotification("START", this.config);

		$(document).on('keypress', function(e) {
	    var tag = e.target.tagName.toLowerCase(); // e.g. input, textarea, document
	    //if ( e.which === 119 && tag != 'input' && tag != 'textarea')

			if (e.which == 13) { // Enter
				self.handleEnterKeyPress();
			}
		});

    // Schedule update timer.
    setInterval(function() {
      self.cleanDom();
    }, this.config.updateInterval);
  },

  /*** getScripts() ***
   *
   *   Loads external JS scripts
   *
   */
  getScripts: function() {
    return [
      this.file('node_modules/vcard-parser/src/vcard.js'),
      'https://code.jquery.com/jquery-2.2.3.min.js'
    ];
  },

  /*** getStyles() ***
   *
   *   Loads CSS scripts
   *
   */
  getStyles: function() {
    return ["ignationfacerec_style.css"];
  },

  /*** cleanDom() ***
   *
   *   Cleans out the statusMessage when time has elapsed
   *
   */
  cleanDom: function() {
    if (!this.config.isInRegisterMode && this.config.statusMessageLastUpdateTime != null) {
      if (((new Date()).getTime() - this.config.statusMessageLastUpdateTime) >= this.config.timeToFade) {
        this.config.statusMessage = "";
        this.config.statusMessageLastUpdateTime = null;
        $("#ignationfacerec-wrapper").fadeOut(2000);
      }

    }
  },

	/*** handleEnterKeyPress() ***
	 *
	 *   Performs necessary actions for enter press.
	 *
	 */
	handleEnterKeyPress: function() {
		if (this.config.isInRegisterMode) { // User needs to register before continue.
			var name = document.getElementById("ignationfacerec-input-name").value;

			if (name.toLowerCase === "cancel") { // Cancel registration.
				this.config.isInRegisterMode = false;
				this.config.statusMessage = "Cancelled by user";
				this.config.statusMessageLastUpdateTime = (new Date()).getTime();
				this.updateDom();
				return;
			}

			this.config.statusMessage = "Please wait: Registering user.";
			this.updateDom();
			this.sendNotification(NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR, null); // Notify LED

			this.sendSocketNotification(NOTIFICATION_REGISTER_USER, {
				"name": name,
				"key": this.config.imageKey
			});
		} else {
			this.config.statusMessage = "Please wait";
			this.updateDom();
			this.sendNotification(NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR, null); // Notify LED

			this.sendSocketNotification(NOTIFICATION_SIGN_IN_USER, {});
		}

	},

  /*** getDom() ***
   *
   *   Override dom generator
   *
   */
  getDom: function() {
    var wrapper = document.createElement("div");

    if (this.config.isInRegisterMode) {
      var status = document.createTextNode("Register new user");

      var textInput = document.createElement("input");
      textInput.type = "text";
      textInput.placeholder = "Your name";
      textInput.autofocus = true;
      textInput.id = "ignationfacerec-input-name";

      wrapper.className = this.config.classes ? this.config.classes : "thin medium bright";
      wrapper.id = "ignationfacerec-wrapper";
      wrapper.appendChild(status);
      wrapper.appendChild(textInput);
    } else {
      var status = document.createTextNode(this.config.statusMessage);

      wrapper.className = this.config.classes ? this.config.classes : "thin medium bright";
      wrapper.id = "ignationfacerec-wrapper";
      wrapper.appendChild(status);

      this.config.statusMessage = "";
    }

    return wrapper;
  },


  /*** notificationReceived ***
   *
   *   A notification was received
   *
   */
  notificationReceived: function(notification, payload, sender) {
    Log.info("notification received: " + notification);
  },

  /*** socketNotificationReceived ***
   *
   *   A notification from the server was received
   *
   */
  socketNotificationReceived: function(notification, payload) {
    Log.info("socket notification received: " + notification);

    if (notification === NOTIFICATION_SIGN_IN_USER_RESULT) { // Sign in result

      if (payload.error) { // Error
        console.log(payload.error);

        this.config.statusMessage = "Please try again";

        if (payload.error.message.includes("no faces in the image")) {
          this.config.statusMessage = "Couldn't recognize face. Please try again.";
          this.config.statusMessageLastUpdateTime = (new Date()).getTime();
        }

        this.updateDom();
        this.sendNotification(NOTIFICATION_IG_LED_END_INPUT_REQUIRED, null); // End the input required LED animation first.
        this.sendNotification(NOTIFICATION_IG_LED_ERROR, null); // Notify LED
        return;
      }

      var ledAction = NOTIFICATION_IG_LED_ERROR; // Default.
      if (payload.result.status === NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_TAKING_PICTURE) { // Taking picture
        this.config.statusMessage = "Please look at the mirror and hold still.";
        ledAction = NOTIFICATION_IG_LED_START_FOCUS_ANIMATION;
      } else if (payload.result.status === NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_ANALYSING_PICTURE) { // Analysing picture
        this.config.statusMessage = "Thank you. Please wait.";
        ledAction = NOTIFICATION_IG_LED_START_ACTIVITY_INDICATOR;
      } else if (payload.result.status === NOTIFICATION_SIGN_IN_USER_RESULT_STATUS_DONE) { // Signing in is complete
        if (payload.result.faceId === null) { // Unknown user
          this.config.statusMessage = "Welcome. Please enter your name and press enter to complete.";
          this.config.imageKey = payload.result.key;
          this.config.isInRegisterMode = true;
          ledAction = NOTIFICATION_IG_LED_INPUT_REQUIRED;

        } else { // Returning user
          console.log("original message");
          this.config.statusMessage = "Welcome " + atob(payload.result.faceId);
          this.config.statusMessageLastUpdateTime = (new Date()).getTime();
          ledAction = NOTIFICATION_IG_LED_CONFIRMED;
        }
      }

      this.updateDom();
      this.sendNotification(ledAction, null); // Update LED

    } // eof: AWS_SIGN_IN_RESULT
    else if (notification === NOTIFICATION_REGISTER_USER_RESULT) { // Register result

      var ledAction = NOTIFICATION_IG_LED_ERROR; // Default action
      if (payload.error) {
        this.config.statusMessage = "Something went wrong registering. Please try again.";
      } else {
        this.config.statusMessage = "Thanks for registering " + payload.result.externalImageId;
        this.config.statusMessageLastUpdateTime = (new Date()).getTime();

        this.sendNotification(NOTIFICATION_IG_LED_END_INPUT_REQUIRED, null); // End the input required LED animation first.

        ledAction = NOTIFICATION_IG_LED_CONFIRMED;
      }
      this.config.isInRegisterMode = false;
      this.config.imageKey = null;

      this.updateDom();
      this.sendNotification(ledAction, null); // Update LED
    } // eof: AWS_REGISTER_RESULT
    else if (notification === "STATUS_UPDATE") { // Status update
      this.config.statusMessage = payload.result.message;
      this.updateDom();
    } // eof: Status update
  },
});
