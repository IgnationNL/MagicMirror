/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information how you can configurate this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
  address: "localhost", // Address to listen on, can be:
  // - "localhost", "127.0.0.1", "::1" to listen on loopback interface
  // - another specific IPv4/6 to listen on a specific interface
  // - "", "0.0.0.0", "::" to listen on any interface
  // Default, when address config is left out, is "localhost"
  port: 8080,
  ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
  // or add a specific IPv4 of 192.168.1.5 :
  // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
  // or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
  // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

  language: "en",
  timeFormat: 24,
  units: "metric",

  modules: [{
      module: "alert",
    },
    {
      module: "clock",
      position: "top_left",
      config: {
        timezone: "Europe/Amsterdam"
      }
    },
    {
      module: "ignationfacerec",
      position: "middle_center"
    },
    {
      module: "currentweather",
      position: "top_left",
      config: {
        location: "Amsterdam",
        locationID: "6544881", //ID from http://www.openweathermap.org/help/city_list.txt
        appid: "1b604c4e0a022785aa29433f8bb60c72"
      }
    },
    {
      module: "newsfeed",
      position: "top_left",
      config: {
        feeds: [{
          title: "What's new?",
          url: "https://www.alliander.com/en/rss.xml"
        }],
        showSourceTitle: true,
        showPublishDate: true
      }
    },
    {
      module: "ignationlogodisplay",
      position: "top_right"
    }, {
      module: "ignationled"
    }
  ]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = config;
}
