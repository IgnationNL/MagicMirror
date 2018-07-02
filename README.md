# Installation Instructions

## Dependecies
1. Python should be installed for the LED module
2. Node and npm should be installed.
3. Configured SSH access to GitHub. If you don't have access yet, please follow instructions below.

## Instructions
1. Download install.sh file from the repository.
2. Run install.sh from terminal. Please note that there is no error checking and the script will continue at all times.

## SSH instructions
1. Create a public/private keypair by executing the following command from terminal: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
2. Press enter on all steps until the key has been created.
3. Go to https://github.com/settings/keys and create a new SSH key.
4. Copy the contents of the public key (id_rsa.pub) and paste it into the key field. Specify a descriptive name.
5. The script is now able to access your GitHub account using the SSH key, without the need for asking a password.
