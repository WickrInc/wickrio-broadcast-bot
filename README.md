# Wickr IO Broadcast Bot
To get started, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Configuration:
Wickr IO integrations are configured by running the configure.sh file,

Required tokens:
- WICKRIO_BOT_NAME
- WHITELISTED_USERS - Comma-separated list of wickr users that will be allowed to use the bot
- DATABASE_ENCRYPTION_KEY - Choose a 16-character(minimum) string key to derive the crypto key from in order to encrypt and decrypt the user database of this bot. This must be specified, there is no default. NOTE: be careful not to change if reconfiguring the bot or else the user database won't be accessible.

## Setting up the testing environment with code coverage

In the  package.json make sure the wickrio-bot-api is at least  5.79.X

Make sure the test script in  the  package.json is  as follows "nyc --reporter=text-summary  --reporter=text mocha test", this will be the default test script that will be run with the ./test.sh  (if you  pass in no arguments)

The following modules were used to do testing with code coverage:
nyc
mocha
@istanbuljs/nyc-config-babel
babel-plugin-istanbul

Make sure these modules are installed. 

In the babel section of the package.json make sure that "sourceMaps" is set to true, and that "istanbul" is added to all the plugins lists.

In the nyc section of the package.json the following should be present:
    "all": true,
    "sourceMap": false,
    "instrument": false,
    "extends": "@istanbuljs/nyc-config-babel",

These settings will allow nyc to use code that was instrumented through babel using @istanbuljs/nyc-config-babel.

When you do "npm run build" the files in the build directory  will be created. The files in the build directory are used during testing and code coverage. (If the build directory doesn't exist at the the time of running "./test.sh", the build directory will be created automatically)

Any tests you plan on running should be located in the "tests" directory, any tests you add must be using modules from the build directory. For example if you want to make tests for help.js make sure your require statement looks like the following: const Help = require('../build/commands/help')

The information used to setup the testing environment was found at the following links:

https://www.npmjs.com/package/@istanbuljs/nyc-config-babel
https://github.com/istanbuljs/babel-plugin-istanbul

## Running the testing script;

Unit tests are found in the tests directory. They are made using the mocha npm module. nyc is also used to collect code coverage on these tests. 

To run the tests with code-coverage simply use the test.sh script. By default if you run ./test.sh with no arguments a test summary and a detailed report will be outputted to the screen. Otherwise, if you input arguments that are valid reporters used by nyc then the report will be generated using those chosen reporters. For example if you use the argument "json" the following script will be run: "nyc --reporter=json mocha test" Reporter choices can be found here https://istanbul.js.org/docs/advanced/alternative-reporters/

If build files are not present at the time of running ./test.sh, npm run build will be run to create those files so they can be tested. 

The test.sh script can be found in the root directory of the broadcast-bot repo. 
