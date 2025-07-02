#!/bin/bash
# if [ -f "/usr/local/nvm/nvm.sh" ]; then
#   . /usr/local/nvm/nvm.sh
# fi

# npm start
# Load NVM if available
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
fi

# Start the broadcast bot using the built index.js
node ./build/index.js "$@"