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


var tokenConfig = [];
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
  tokenConfig = wickrIOConfigure.getTokenList();
//  wickrIOConfigure.displayValues();


  if (wickrIOConfigure.processConfigured()) {
    try {
      var cp = execSync('cp processes.json processes_backup.json');
      if (dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value !== undefined) {
        var newName = "WickrIO-Broadcast-Bot_" + dataParsed.apps[0].env.tokens.WICKRIO_BOT_NAME.value;
      } else {
        var newName = "WickrIO-Broadcast-Bot";
      }
      //var assign = Object.assign(dataParsed.apps[0].name, newName);
      dataParsed.apps[0].name = newName;
      var ps = fs.writeFileSync('./processes.json', JSON.stringify(dataParsed, null, 2));
    } catch (err) {
      console.log(err);
    }
    console.log("Already configured");
    process.exit();
  } else {
    try {
      await wickrIOConfigure.inputTokens();
      console.log("Finished Configuring!");
      process.exit();
    } catch (err) {
      console.log(err);
    }
  }
}

