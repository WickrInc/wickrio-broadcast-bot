# Wickr IO Broadcast Bot
To get started, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Configuration:
Wickr IO integrations are configured by running the configure.sh file,

Required tokens:
- WICKRIO_BOT_NAME
- WHITELISTED_USERS - Comma-separated list of wickr users that will be allowed to use the bot
- DATABASE_ENCRYPTION_KEY - Choose a 16-character(minimum) string key to derive the crypto key from in order to encrypt and decrypt the user database of this bot. This must be specified, there is no default. NOTE: be careful not to change if reconfiguring the bot or else the user database won't be accessible.

## Testing and code coverage;

Unit tests are found in the tests directory. They are made using the mocha npm module. nyc is also used to collect code coverage on these tests. 

To run the tests with code-coverage simply use the test.sh script. By default if you run ./test.sh with no arguments a test summary and a detailed report will be outputted to the screen. Otherwise, if you input arguments that are valid reporters used by nyc then the report will be generated using those chosen reporters. For example if you use the argument "json" the following script will be run: "nyc --reporter=json mocha test" Reporter choices can be found here https://istanbul.js.org/docs/advanced/alternative-reporters/

If build files are not present at the time of running ./test.sh, npm run build will be run to create those files so they can be tested. 

The test.sh script can be found in the root directory of the broadcast-bot repo. 

the following modules were used to do testing with code coverage:
nyc
mocha
@istanbuljs/nyc-config-babel
babel-plugin-istanbul

If any issues arise with node modules try reinstalling those ^
