#!/bin/sh

if [ $# -ne 1 ]
  then
    echo "Usage: generate.sh <destination path>"
    exit 1
fi

mkdir -p temp

cp -r src public configure.js upgrade.js configure.sh .foreverignore forever.json install.sh LICENSE package.json package-lock.json processes.json README.md restart.sh start.sh stop.sh upgrade.sh configTokens.json temp 

cd temp
tar czf $1/software.tar.gz *
cd ..
rm -r temp
