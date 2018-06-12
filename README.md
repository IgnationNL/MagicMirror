# Install Magic Mirror
1. Clone the Magic Mirror repository from: https://github.com/MichMich/MagicMirror
2. cd into the directory and run the command "npm install". This will install all dependencies for the Magic Mirror.
3. Make a copy of the config.js.sample file under /config and rename it just "config.js"
4. Now you can run "npm start" to verify if it's working. The screen will go full screen, but you can also open a webpage and navigate to localhost:xxxx (where xxxx is the port that is logged from the terminal). I couldn't find log output in the terminal, but opening up a webbrowser and the webbroswer's console will show output.

# Install 3rd party KeyBindings module
5. Clone the MMM-KeyBindings module from: https://github.com/shbatm/MMM-KeyBindings
6. Move the entire MMM-KeyBindings folder under the modules folder from the Magic Mirror.
7. cd into the MMM-KeyBindings folder and run "npm install". This will install the dependencies for the module.

# Install Ignation's Face recognition module
8. Clone the Ignation Face Recogntion module from: https://github.com/IgnationNL/MagicMirror
9. Move the entire ignationfacerec folder under the modules folder from the Magic Mirror.
10. cd into the ignationfacerec folder and run "npm install". This will install the dependencies for the module.

11. Copy the config.js from https://github.com/IgnationNL/MagicMirror to the config folder of the MagicMirror

12. Run by "npm start"

OPTIONAL

# Install Ignation's QRCode Scanner module
13. Clone the Ignation QRCodeScanner from: https://github.com/IgnationNL/MagicMirror
14. Move the entire qrcodescanner folder under the modules folder from the Magic Mirror.
15. cd into the qrcodescanner folder and run "npm install". This will install the dependencies for the module.
16. Edit the Magic Mirror config file and add the "qrcodescanner" module under modules. You can use any position you like for now. It might also be a good idea to turn off most modules to make it easy debugging at first.
17. You can now run "npm start" again and the module should be enabled.
