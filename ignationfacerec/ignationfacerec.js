/* Magic Mirror
 * Module: QrCodeScanner
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */
Module.register("ignationfacerec", {

	// Module config defaults.
	defaults: {
		updateInterval: 3000, // every second
		guests: {}, // Format: "identifier": {"vcard": "vcard-content", "checkInOutTime": "timestamp", "isCheckedIn": false}
		checkInOutDelay: 10000,
		statusMessage: "Ready to check-in",
		fadeSpeed: 4000,
		keyBindingsMode: "DEFAULT",
        keyBindings: {
            /* Add each key you want to respond to in the form:
             *      yourKeyName: "KeyName_from_MMM-KeyBindings"
             */
            Right: "ArrowRight",
            Left: "ArrowLeft",
						Enter: "Enter",
						Space: "Space",
            /* ... */
        },
				keyBindingsTakeFocus: "Enter",
	},

	/*** setupKeyBindings ***
	     *
	     *   Add function below to your moduleName.js
	     *   Add `this.setupKeyBindings()` to module's 'start' function
	     *
	     *   If your module does not already overridde the function, use the snippet below
	     *      start: function() {
	     *          console.log(this.name + " has started...");
	     *          this.setupKeyBindings();
	     *      },
	     *
	     */
	    setupKeyBindings: function() {
	        this.currentKeyPressMode = "DEFAULT";
	        if (typeof this.config.kbMultiInstance === undefined) {
	            this.config.kbMultiInstance = true;
	        }
	        this.kbInstance = (["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1", undefined, "0.0.0.0"].indexOf(
	            window.location.hostname) > -1) ? "SERVER" : "LOCAL";
	        this.reverseKBMap = {};
	        for (var eKey in this.config.keyBindings) {
	            if (this.config.keyBindings.hasOwnProperty(eKey)) {
	                this.reverseKBMap[this.config.keyBindings[eKey]] = eKey;
	            }
	        }
	    },

	    /*** validateKeyPress ***
	     *
	     *   Add function below to your moduleName.js
	     *   Add `if (this.validateKeyPress(notification, payload)) { return; }`
	     *    to the first line of module's 'notificationRecieved' function.
	     *
	     *   If your module does not already overridde the function, use the snippet below
	     *      notificationReceived: function(notification, payload, sender) {
	     *          if (this.validateKeyPress(notification, payload)) { return; }
	     *      },
	     *
	     */
	    validateKeyPress: function(notification, payload) {
	        // Handle KEYPRESS mode change events from the MMM-KeyBindings Module
	        if (notification === "KEYPRESS_MODE_CHANGED") {
	            this.currentKeyPressMode = payload;
	            return true;
	        }

	        // Uncomment line below for diagnostics & to confirm keypresses are being recieved
	        // if (notification === "KEYPRESS") { console.log(payload); }

	        // Validate Keypresses
	        if (notification === "KEYPRESS" && this.currentKeyPressMode === this.config.keyBindingsMode) {
	            if (this.config.kbMultiInstance && payload.Sender !== this.kbInstance) {
	                return false; // Wrong Instance
	            }
	            if (!(payload.KeyName in this.reverseKBMap)) {
	                return false; // Not a key we listen for
	            }
	            this.validKeyPress(payload);
	            return true;
	        }

	        // Test for focus key pressed and need to take focus:
	        if (notification === "KEYPRESS" && ("keyBindingsTakeFocus" in this.config)) {
	            if (this.currentKeyPressMode === this.config.keyBindingsMode) {
	                return false; // Already have focus.
	            }
	            if (this.config.kbMultiInstance && payload.Sender !== this.kbInstance) {
	                return false; // Wrong Instance
	            }
	            if (typeof this.config.keyBindingsTakeFocus === "object") {
	                if (this.config.keyBindingsTakeFocus.KeyPress !== payload.KeyPress ||
	                    this.config.keyBindingsTakeFocus.KeyState !== payload.KeyState) {
	                    return false; // Wrong KeyName/KeyPress Combo
	                }
	            } else if (typeof this.config.keyBindingsTakeFocus === "string" &&
	                payload.KeyName !== this.config.keyBindingsTakeFocus) {
	                return false; // Wrong Key;
	            }

	            this.keyPressFocusReceived();
	            return true;
	        }

	        return false;
	    },
	    /*** validKeyPress ***
	     *
	     *   Add function below to your moduleName.js
	     *   Function is called when a valid key press for your module
	     *      has been received and is ready for action
	     *   Modify this function to do what you need in your module
	     *      whenever a valid key is pressed.
	     *
	     */
	    validKeyPress: function(kp) {
	        console.log(kp.KeyName);

	        // Example for responding to "Left" and "Right" arrow
	        if (kp.KeyName === this.config.keyBindings.Right) {
	            console.log("RIGHT KEY WAS PRESSED!");
	        } else if (kp.KeyName === this.config.keyBindings.Left) {
	            console.log("LEFT KEY WAS PRESSED!");
	        }
	    },

	    /*** OPTIONAL: keyPressFocusReceived ***
	     *
	     *   Add function below to your moduleName.js
	     *   Function is called when a valid take focus key press
	     *      has been received and is ready for action
	     *   Modify this function to do what you need in your module
	     *      whenever focus is received.
	     *
	     */
	    keyPressFocusReceived: function(kp) {
	        console.log(this.name + "HAS FOCUS!");
	        this.sendNotification("KEYPRESS_MODE_CHANGED", this.config.keyBindingsMode);
	        this.currentKeyPressMode = this.config.keyBindingsMode;
	        // DO ANYTHING YOU NEED
	    },

	    /*** OPTIONAL: keyPressReleaseFocus ***
	     *
	     *   Add function below to your moduleName.js
	     *   Call this function when ready to release focus
	     *
	     *   Modify this function to do what you need in your module
	     *      whenever you're ready to give up focus.
	     *
	     */
	    keyPressReleaseFocus: function() {
	        console.log(this.name + "HAS RELEASED FOCUS!");
	        this.sendNotification("KEYPRESS_MODE_CHANGED", "DEFAULT");
	        this.currentKeyPressMode = "DEFAULT";
	        // DO ANYTHING YOU NEED
	    },
			// eof: Key



	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		var self = this;

		this.sendSocketNotification("START", this.config);

		// Schedule update timer.
		setInterval(function() {
			self.scanQRCode();
			self.updateDom(self.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	getScripts: function() {
        return [
            this.file('node_modules/vcard-parser/src/vcard.js'),
						'https://code.jquery.com/jquery-2.2.3.min.js'
        ];
    },

	/* scanQRCode()
	 * Sends a request to the server to take a picture and scan it for QR codes.
	 *
	 */
	scanQRCode: function() {
		this.sendSocketNotification("SCAN_QR_CODE", null);
	},

	// Override dom generator.
	getDom: function() {
		var status = document.createTextNode(this.config.statusMessage);
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin medium bright";
		wrapper.id = "qrcodescanner-statusmessage";
		wrapper.appendChild(status);

		this.config.statusMessage = "";

		return wrapper;
	},


	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		Log.info("notification received: " + notification);


		if (notification === "KEYPRESS") {
			this.sendSocketNotification("KEYPRESS", payload);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.info("socket notification received: " + notification);

		if (notification === "AWS_REKOGNITION_RESULT") {
			console.log("We got aws rekognition result: " + payload);

			if (payload.result.faceId === null) {
				this.config.statusMessage = "Welcome. Please register.";
			} else {
				this.config.statusMessage = "Welcome " + payload.result.faceId;
			}

			this.updateDom();

		}


		else if (notification === "SCAN_QR_CODE_RESULT") { // Result for QRCodeScan. Payload contains error and result object.
			if (payload.error) { // Error
				Log.info("QRCodeScan gave error.");
				return;
			}

			// Parse VCard
			var card = vCard.parse(payload.result.result);
			var email = card.email[0].value;

			if (!email) { // Cannot check guest in without email. Show error.
				// Show in interface
				this.config.statusMessage = "Cannot check in guest. The QRCode doesn't contain an e-mail address.";
				this.updateDom();
				return;
			}

			// Check if guest has been here before
			if (!this.config.guests.hasOwnProperty(email)) { // First time. Add to guest array and check in.
				var newGuest = {"vcard": card, "checkInOutTime": (new Date()).getTime(), "isCheckedIn": true}
				this.config.guests[email] = newGuest;

				// Show in interface
				this.config.statusMessage = "Welcome " + email;
				this.updateDom();
			} else { // Guest is already known. Check in or out.
				if (((new Date().getTime()) - this.config.guests[email].checkInOutTime) < this.config.checkInOutDelay) { // Ignore update if another check in or check out occured < x seconds ago
					return;
				} else { // We can now check in/out the user
					this.config.guests[email].isCheckedIn = !this.config.guests[email].isCheckedIn;
					this.config.guests[email].checkInOutTime = (new Date()).getTime();

					this.config.statusMessage = (this.config.guests[email].isCheckedIn) ? "Welcome " + email : "Goodbye " + email;
					this.updateDom();
				}
			}
		}
	},

});
