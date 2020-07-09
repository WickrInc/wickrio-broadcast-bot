const fs = require('fs');
const WickrIOBotAPI = require('wickrio-bot-api');
const util = require('util');
const Proc = require('./processes.json');

require("dotenv").config({
  path: `.env.configure`
})

var wickrIOConfigure;

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
  try {
    if (err) {
      process.kill(process.pid);
      process.exit();
    }
    if (options.exit) {
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    console.log(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

//catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }));
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true,
  reason: 'uncaughtException'
}));

main();


async function main() {
  const tokenConfig = [
    {
      token: 'WEB_INTERFACE',
      pattern: 'yes|no',
      type: 'string',
      description: 'Do you want to setup the web interface (REST API or WEB Application) [yes/no]',
      message: 'Please enter either yes or no',
      required: true,
      default: 'no',
      list: [
        {
          token: 'WEB_APPLICATION',
          pattern: 'yes|no',
          type: 'string',
          description: 'Do you want to use the web application [yes/no]',
          message: 'Please enter either yes or no',
          required: true,
          default: 'no',
          list: [
            {
              token: 'WEBAPP_HOST',
              pattern: '',
              type: 'string',
              description: "Please enter the host name or ip address to reach the web application",
              message: 'Cannot leave empty! Please enter a value',
              required: true,
              default: false,
            },
            {
              token: 'WEBAPP_PORT',
              pattern: '^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$',
              type: 'number',
              description: "Please enter the host port to use to reach the web application",
              message: 'Cannot leave empty! Please enter a value',
              required: true,
              default: false,
            }
          ]
        },
        {
          token: 'REST_APPLICATION',
          pattern: 'yes|no',
          type: 'string',
          description: 'Do you want to use the REST application [yes/no]',
          message: 'Please enter either yes or no',
          required: true,
          default: 'no',
        },
        {
          token: 'BOT_PORT',
          pattern: '^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$',
          type: 'number',
          description: "Please enter your client bot's port",
          message: 'Cannot leave empty! Please enter a value',
          required: false,
          default: false,
        },
        {
          token: 'BOT_KEY',
          pattern: '',
          type: 'string',
          description: "Please enter your client bot's API-Key",
          message: 'Cannot leave empty! Please enter a value',
          required: true,
          default: false,
        },
        {
          token: 'BOT_AUTH_TOKEN',
          pattern: '',
          type: 'string',
          description: 'Please create an Web API Basic Authorization Token, we recommend an alphanumeric string with at least 24 characters',
          message: 'Cannot leave empty! Please enter a value',
          required: true,
          default: false,
        },
        {
          token: 'HTTPS_CHOICE',
          pattern: 'yes|no',
          type: 'string',
          description: 'Do you want to set up an HTTPS connection with the Web API Interface, highly recommended [yes/no]',
          message: 'Please enter either yes or no',
          required: true,
          default: 'no',
          list: [
            {
              token: 'SSL_KEY_LOCATION',
              pattern: '',
              type: 'file',
              description: 'Please enter the name and location of your SSL .key file',
              message: 'Cannot find file!',
              required: true,
              default: false,
            },
            {
              token: 'SSL_CRT_LOCATION',
              pattern: '',
              type: 'file',
              description: 'Please enter the name and location of your SSL .crt file',
              message: 'Cannot find file!',
              required: true,
              default: false,
            }
          ]
        }
      ]
    },
    {
      token: 'BOT_MAPS',
      pattern: 'yes|no',
      type: 'string',
      description: 'Do you want to map users locations when you send broadcasts [yes/no]',
      message: 'Please enter either yes or no',
      required: true,
      default: 'no',
      list: [
        {
          token: 'BOT_GOOGLE_MAPS',
          pattern: '',
          type: 'string',
          description: "Please enter your google maps api key",
          message: 'Cannot leave empty! Please enter a value',
          required: true,
          default: false,
        }
      ]
    }
  ];

  /*
    1.  Configure all regular tokens the first time.
    2.  Generate tokens for each administrator's security group access.
    3.  Configure 2nd time with only the added tokens.
  */
  // 1.
  const fullName = `${process.cwd()}/processes.json`;
  wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(tokenConfig, fullName, true, true, false);
  await wickrIOConfigure.configureYourBot('WickrIO-Broadcast-Bot');
  // 2.
  const adminArray = wickrIOConfigure.getCurrentValues().ADMINISTRATORS.split(',');
  const tokenToAdd = [];
  let i;
  for (i = 0; i < adminArray.length; i += 1) {
    const newToken = {
      token: adminArray[i],
      pattern: '',
      type: 'string',
      description: `Please enter a list of security groups (ID Numbers or ALL) ${adminArray[i]} has access to.`,
      message: 'Cannot leave empty! Please enter a value',
      required: false,
    };
    tokenToAdd.push(newToken);
  }
  // 3.
  const alt = new WickrIOBotAPI.WickrIOConfigure(tokenToAdd, fullName, false, false, true);
  await alt.configureYourBot('WickrIO-Broadcast-Bot');
  process.exit();
}
