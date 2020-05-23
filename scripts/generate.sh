#!/bin/sh

if [ $# -ne 1 ]
  then
    echo "Usage: generate.sh <destination path>"
    exit 1
fi

mkdir -p temp
cp ../build/broadcast-bot.js ../configure.js configure.sh install.sh ../package.json ../processes.json ../README.md restart.sh start.sh stop.sh upgrade.sh temp

cd temp
tar czf $1/software.tar.gz *
cd ..
rm -r temp
