#!/bin/bash
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
  nvm use 12.20.2
fi

#npm start
nodefullpath=`which node`
#forever start $nodefullpath --watchIgnore '*.output' ./build/index.js
forever start -m 1 --watchIgnore '*.output' ./forever.json
#forever start --watchIgnore '*.output' ./build/index.js
