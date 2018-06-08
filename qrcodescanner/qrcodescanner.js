/* Magic Mirror
 * Module: QrCodeScanner
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */
Module.register("qrcodescanner", {

	// Module config defaults.
	defaults: {
		updateInterval: 3000, // every second
		guests: {}, // Format: "identifier": {"vcard": "vcard-content", "checkInOutTime": "timestamp", "isCheckedIn": false}
		checkInOutDelay: 10000,
		statusMessage: "Ready to check-in",
		fadeSpeed: 4000,
	},

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
	},

	socketNotificationReceived: function(notification, payload) {
		Log.info("socket notification received: " + notification);

		if (notification === "SCAN_QR_CODE_RESULT") { // Result for QRCodeScan. Payload contains error and result object.
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
