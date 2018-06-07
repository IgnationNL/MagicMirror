/* Magic Mirror
 * Module: QrCodeScanner
 *
 * By Ignation https://ignation.io
 * All rights reserved
 */
Module.register("qrcodescanner", {

	// Module config defaults.
	defaults: {
		updateInterval: 1000 // every second
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		var self = this;

		// Schedule update timer.
		setInterval(function() {
			Log.info("intervallll");
			self.takePicture();
		}, this.config.updateInterval);
	},

	// @TODO: The module "fs" should be loaded as well somehow.
	getScripts: function() {
        return [
            this.file('node_modules/jimp/index.js'),
						this.file('node_modules/qrcode-reader/dist/index.js')
        ];
    },

	/* takePicture()
	 * Takes a picture using the raspi camera
	 *
	 * return xx
	 */
	takePicture: function() {
		Log.info("reading qr code from static picture");

		// THIS IS THE ORIGINAL CODE SNIPPET FOR READING A PICTURE AND READING THE QRCODE FROM IT.
		// IT WORKS STANDALONE, HOWEVER IN THE MAGIC MIRROR MODULE FORMAT IT'S NOT POSSIBLE TO DO A "require". I WAS ABLE TO INCLUDE
		// THE SCRIPTS FOR JIMP AND QRCODE-READER USING THE getScripts METHOD ABOVE, BUT I DON'T KNOW HOW TO INCLUDE THE FS.

		// var fs    = require("fs"); 								// require is not possible
		// var Jimp = require("jimp");								// require is not possible
		// var QrCode = require('qrcode-reader');			// require is not possible
		//
		// var buffer = fs.readFileSync(__dirname + '/image.png'); // Read the image.png picture
		// Jimp.read(buffer, function(err, image) {
		//     if (err) {
		//         console.error(err);
		//         // TODO handle error
		//     }
		//     var qr = new QrCode();
		//     qr.callback = function(err, value) {
		//         if (err) {
		//             console.error(err);
		//             // TODO handle error
		//         }
		//         console.log(value.result);
		//         console.log(value);
		//     };
		//     qr.decode(image.bitmap);
		// });
		// EOF: ORIGINAL CODE SNIPPET
		},



	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		Log.info("notification received: ");
	},

});
