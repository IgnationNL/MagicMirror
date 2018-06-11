/* Magic Mirror
 * Node Helper: QRCodeScanner
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */

 var fs    				= require("fs");
 var Jimp 				= require("jimp");
 var QrCode 			= require('qrcode-reader');
 const RaspiCam 	= require("raspicam");
 const Raspistill = require('node-raspistill').Raspistill;
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

		if (notification === "SCAN_QR_CODE") {
			






		}
	},
});
