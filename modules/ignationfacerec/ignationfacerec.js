/* Magic Mirror
* Module: IgnationFaceRec
*
* By Ignation https://ignation.io
* All rights reserved
*/
Module.register("ignationfacerec", {

	// Module config defaults.
	defaults: {
		guests: {}, // Format: "identifier": {"vcard": "vcard-content", "checkInOutTime": "timestamp", "isCheckedIn": false}
		updateInterval: 1000, // Interval at which DOM will be cleaned up
		timeToFade: 4000, // Time to be passed before a status message will be fade out.
		checkInOutDelay: 10000,
		statusMessage: "Ready to check-in",
		statusMessageLastUpdateTime: null,
		isInRegisterMode: false,
		imageKey: null,
		fadeSpeed: 4000, // The speed at which status messages fade.
		keyPressNotificationReceiveAmount: 0,
		// MMM KeyBindings
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
		// eof: MMM KeyBindings
	},

	// MMM KeyBindings
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

			// eof: MMM KeyBindings



			// Define start sequence.
			start: function() {
				Log.info("Starting module: " + this.name);

				var self = this;

				this.sendSocketNotification("START", this.config);

				// Schedule update timer.
				setInterval(function() {
					self.cleanDom();
				}, this.config.updateInterval);
			},

			getScripts: function() {
				return [
					this.file('node_modules/vcard-parser/src/vcard.js'),
					'https://code.jquery.com/jquery-2.2.3.min.js'
				];
			},

			cleanDom: function() {
				if (!this.config.isInRegisterMode && this.config.statusMessageLastUpdateTime != null) {
					if (((new Date()).getTime() - this.config.statusMessageLastUpdateTime) >= this.config.timeToFade) {
						this.config.statusMessage = "";
						this.config.statusMessageLastUpdateTime = null;
						$("#ignationfacerec-wrapper").fadeOut(2000);
					}

				}
			},
			// Override dom generator.
			getDom: function() {
				var wrapper = document.createElement("div");

				if (this.config.isInRegisterMode) {
					var textInput = document.createElement("input");
					textInput.type = "text";
					textInput.placeholder = "Your name";
					textInput.id = "ignationfacerec-input-name";

					wrapper.className = this.config.classes ? this.config.classes : "thin medium bright";
					wrapper.id = "ignationfacerec-wrapper";
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


			// Override notification handler.
			notificationReceived: function(notification, payload, sender) {
				Log.info("notification received: " + notification);


				if (notification === "KEYPRESS") {

					if (payload.KeyName !== "Enter") { // We only listen to Enters
						return;
					}

					this.config.keyPressNotificationReceiveAmount++;
					if (this.config.keyPressNotificationReceiveAmount !== 2) { // Multiple keyPressNotifications are send for one single event. Use this line to filter that out.
						return;
					}
					this.config.keyPressNotificationReceiveAmount = 0;

					if (this.config.isInRegisterMode)  { // User needs to register before continue.
						console.log("Registering user");
						var name = document.getElementById("ignationfacerec-input-name").value;

						this.config.statusMessage = "Please wait: Registering user.";
						this.updateDom();

						this.sendSocketNotification("REGISTER_USER", {"name": name, "key": this.config.imageKey});
					} else {
						console.log("signing in user");
						this.sendSocketNotification("SIGN_IN_USER", {});

						this.config.statusMessage = "Please wait. Signing user in.";
						this.updateDom();
					}
				}
			},

			socketNotificationReceived: function(notification, payload) {
				Log.info("socket notification received: " + notification);

				if (notification === "AWS_SIGN_IN_RESULT") { // AWS_SIGN_IN_RESULT
					console.log("We got aws rekognition result: " + payload);

					if (payload.error) { // Error
						console.log("ERROR: " + payload.error);
						this.config.statusMessage = "An error occured: " + payload.error;
						this.updateDom();
						return;
					}

					if (payload.result.faceId === null) { // Unknown user
						this.config.statusMessage = "Welcome. Please enter your name and press enter to complete.";
						this.config.imageKey = payload.result.key;
						this.config.isInRegisterMode = true;

					} else { // Returning user
						this.config.statusMessage = "Welcome " + payload.result.faceId;
						this.config.statusMessageLastUpdateTime = (new Date()).getTime();
						console.log(this.config.statusMessageLastUpdateTime);
					}

					this.updateDom();

				} // eof: AWS_SIGN_IN_RESULT
				else if (notification === "AWS_REGISTER_RESULT") { // AWS_REGISTER_RESULT
					console.log("registered");
					console.log(payload.result);

					if (payload.error) {
						this.config.statusMessage = "Something went wrong registering.";
					} else {
						this.config.statusMessage = "Thanks for registering " + payload.result.externalImageId;
						this.config.statusMessageLastUpdateTime = (new Date()).getTime();
					}
					this.config.isInRegisterMode = false;
					this.config.imageKey = null;


					this.updateDom();
				} // eof: AWS_REGISTER_RESULT
			},

		});
