#!/bin/sh
npm install --unsafe-perm

npm run transpile

cd wickrio-bot-web

npm install

gatsby build