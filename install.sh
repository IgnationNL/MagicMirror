
echo "######## Cloning Magic Mirror repository... ########"
git clone https://github.com/MichMich/MagicMirror.git # Clone MagicMirror repo
cd MagicMirror
git checkout v2.3.1 # Checkout older version, because there are issues with the latest.
cd ../
# Clone Ignation Magic Mirror repo. Note: SSH certificate needs to set up first.
echo "######## Cloning Ignation repository... ########"
git clone git@github.com:IgnationNL/MagicMirror.git IGMagicMirror
# eof: Clone Ignation Magic Mirror repo

# Copy files and modules from Ignation repo
echo "######## Moving Ignation modules and files to MagicMirror... ########"
cp IGMagicMirror/config.js MagicMirror/config/config.js # Copy config file
cp IGMagicMirror/currentweather.css MagicMirror/modules/default/currentweather/currentweather.css
cp IGMagicMirror/custom.css MagicMirror/css/custom.css
cp -r IGMagicMirror/modules/* MagicMirror/modules/
# eof: Copy files and modules from Ignation repo

# Install dependencies
echo "######## Installing Node.js depdencies... ########"
cd MagicMirror/modules/ignationfacerec
npm install
cd ../ignationled
npm install
cd ../ignationlogodisplay
npm install
cd ../../
npm install
# eof: Install dependencies

# Clean up
echo "######## Cleaning up... ########"
cd ../
rm -r -f IGMagicMirror/
# eof: Clean up
