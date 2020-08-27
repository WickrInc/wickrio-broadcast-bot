#!/bin/sh

if [ -f ./node_modules.tgz ]
then
    tar -xvf ./node_modules.tgz
else
    npm install --unsafe-perm
fi

npm run build
