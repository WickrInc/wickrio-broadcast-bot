const fs = require('fs');
const util = require('util')
const WickrIOBotAPI = require('wickrio-bot-api');

require("dotenv").config({
  path: `.env.configure`
})

const prompt = require('prompt');
const processes = require('./processes.json');
const dataStringify = JSON.stringify(processes);
const dataParsed = JSON.parse(dataStringify);
const {exec, execSync, execFileSync} = require('child_process');

var wickrIOConfigure;

//
// Add any tokens(as strings separated by commas) you want to prompt
// for in the configuration process here. Using the WickrIOBotAPI to
// add Wickr supported Tokens as well.
//
const broadcastTokenConfig = [
    {
        token: 'DATABASE_ENCRYPTION_KEY',
        pattern: '',
        type: 'string',
        description: 'Enter the database encryption key',
        message: 'Cannot leave empty! Please enter a value',
        required: true,
        default: 'N/A',
    }
];

prompt.colors = false;

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
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {pid: true}));
process.on('SIGUSR2', exitHandler.bind(null, {pid: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true,
  reason: 'uncaughtException'
}));

main();

async function main()
{
    var fullName = process.cwd() + "/processes.json";
    wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(broadcastTokenConfig, fullName, true, true);

    await wickrIOConfigure.configureYourBot();
    process.exit();
}

