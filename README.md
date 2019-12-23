# Wickr IO Broadcast Bot
To get started, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Configuration:
Wickr IO integrations are configured by running the configure.sh file,

Required tokens:
- WICKRIO_BOT_NAME
- WHITELISTED_USERS - Comma-separated list of wickr users that will be allowed to use the bot
- DATABASE_ENCRYPTION_KEY - Choose a 16-character(minimum) string key to derive the crypto key from in order to encrypt and decrypt the user database of this bot. This must be specified, there is no default. NOTE: be careful not to change if reconfiguring the bot or else the user database won't be accessible.
