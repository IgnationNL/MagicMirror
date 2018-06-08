/* Magic Mirror
 * Node Helper: QRCodeScanner
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */

 var fs    				= require("fs");
 var Jimp 				= require("jimp");
 var QrCode 			= require('qrcode-reader');

module.exports = NodeHelper.create({
	// Override start method.
	start: function() {
		console.log("Starting node helper for: " + this.name);
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {

		if (notification === "SCAN_QR_CODE") {
			// 1. Take picture

			// 2. Scan picture for QR codes
			var buffer = fs.readFileSync(__dirname + '/image.png');
			var self = this;
			Jimp.read(buffer, function(err, image) {

				var self2 = self; // Asign this/self so we can reference to this class inside the callback.

			    if (err) {
			        console.error(err);
			        self.sendSocketNotification("SCAN_QR_CODE_RESULT", {"result": null, "error": err});
							return;
			    }
			    var qr = new QrCode();

			    qr.callback = function(err, value) {
			        if (err) {
			            console.error(err);
			        }

							self.sendSocketNotification("SCAN_QR_CODE_RESULT", {"result": value, "error": err});
			    };
			    qr.decode(image.bitmap);
			});
		}
	},
});
