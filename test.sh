# This  is a script to run the unit tests with code coverage
# Arguments are used to pick what reporter to use for the coverage report
# Arguments that you can pass through can be found at the following link:
# https://istanbul.js.org/docs/advanced/alternative-reporters/

# If you pass no arguments the default test script will be run: "nyc --reporter=text-summary  --reporter=text mocha test"

#!/bin/bash
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
  nvm use 16
fi

# run build if "build" directory not found
if [ ! -d "./build" ]; then
  npm run build
fi

# run tests
if [ $# -eq 0 ]; then
  npm test
else
  for num; do
    reporter+="--reporter=$num "
  done
  echo "npx nyc $reporter mocha test"
  npx nyc $reporter mocha test
fi
