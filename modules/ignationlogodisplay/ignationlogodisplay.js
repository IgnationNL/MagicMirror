/* Magic Mirror
* Module: IgnationFaceRec
*
* By Ignation https://ignation.io
* All rights reserved
*/

Module.register("ignationlogodisplay", {

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

		var self = this;
		
	},

	/*** getStyles() ***
	*
	*   Loads CSS scripts
	*
	*/
	getStyles: function() {
		return ["ignationlogodisplay_style.css"];
	},

	/*** getDom() ***
	*
	*   Override dom generator
	*
	*/
	getDom: function() {
		var wrapper = document.createElement("div");
		
		var elem = document.createElement("img");
		elem.id = "ignation-logo-id";
		elem.setAttribute("src",  "modules/ignationlogodisplay/images/logo.png");		
		wrapper.appendChild(elem);

		return wrapper;
	},

});
