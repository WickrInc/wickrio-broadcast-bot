const fs = require('fs');
const util = require('util')

require("dotenv").config({
  path: `.env.configure`
})

const prompt = require('prompt');
const processes = require('./processes.json');
const dataStringify = JSON.stringify(processes);
const dataParsed = JSON.parse(dataStringify);
const {exec, execSync, execFileSync} = require('child_process');


//Add any tokens(as strings separated by commas) you want to prompt for in the configuration process here
const tokens = ['WICKRIO_BOT_NAME', 'DATABASE_ENCRYPTION_KEY', 'ADMINISTRATORS', 'VERIFY_USERS'];

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
  if (processConfigured()) {
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
      var it = await inputTokens();
      process.exit();
    } catch (err) {
      console.log(err);
    }
  }
}

async function inputTokens() {
  var config = [];
  var i = 0;

  newObjectResult = getCurrentValues();

  return new Promise((resolve, reject) => {
    var recursivePrompt = function() {
      var token = tokens[i];
      if (i === tokens.length) {
        return resolve("Configuration complete!");
      }

      // For this token if it is defined in the environment
      // Then set the input value for the token
      if (process.env[token] !== undefined) {
        var input = token + '=' + process.env[token];
        config.push(input);
        i++;
        return recursivePrompt();
      }

      var dflt = newObjectResult[token];
      var emptyChoice = false;
      var patternType;
      var messageText;

      // If this is a VERITY_USERS then set the type, all others are strings
      if (token === 'VERIFY_USERS') {
        messageText = 'Please enter either manual or automatic';
        typeValue = 'string';
        patternType = 'manual|automatic';
        if (dflt === "undefined" || dflt === undefined) {
          dflt = "automatic";
        }
      } else {
        messageText = 'Cannot leave ' + token + ' empty! Please enter a value';
        typeValue = 'string';
        if (dflt === "undefined" || dflt === undefined) {
          dflt = "N/A";
          emptyChoice = true;
        }
      }

      var schema = {
        properties: {
          [token]: {
            pattern: patternType,
            type: typeValue,
            description: 'Enter your ' + token.replace(/_/g, " ").replace(/\w\S*/g, function(txt) {
              return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }) + ' (Default: ' + dflt + ')',
            message: messageText,
            required: emptyChoice
          }
        }
      };
      prompt.get(schema, function(err, answer) {
        if (answer[token] === "")
          answer[token] = newObjectResult[token];
        var input = token + '=' + answer[token];
        config.push(input);
        i++;
        recursivePrompt();
      });
    }
    recursivePrompt();
  }).then(function(answer) {
    let objectKeyArray = [];
    let objectValueArray = [];
    for (var i = 0; i < config.length; i++) {
      let locationEqual = config[i].indexOf("=");
      let objectKey = config[i].slice(0, locationEqual);
      let objectValue = config[i].slice(locationEqual + 1, config[i].length); //Input value
      objectKeyArray.push(objectKey);
      objectValueArray.push(objectValue);
    }
    var newObjectResult = {};
    for (var j = 0; j < config.length; j++) {
      newObjectResult[objectKeyArray[j]] = objectValueArray[j];
    }
    for (var key in newObjectResult) {
      // If the environment variable is set then use it
      if (process.env[key] !== undefined) {
        var obj = {
          "value": process.env[key],
          "encrypted": false
        };
        newObjectResult[key] = obj;
      }
      // Else use the value just entered by the user
      else {
        var obj = {
          "value": newObjectResult[key],
          "encrypted": false
        };
        newObjectResult[key] = obj;
      }
    }
    for (var key in dataParsed.apps[0].env.tokens) {
      delete dataParsed.apps[0].env.tokens[key];
    }
    try {
      var cp = execSync('cp processes.json processes_backup.json');
      if (process.env.WICKRIO_BOT_NAME !== undefined) {
        var newName = "WickrIO-Broadcast-Bot_" + process.env.WICKRIO_BOT_NAME;
      } else if (newObjectResult.WICKRIO_BOT_NAME !== undefined) {
        var newName = "WickrIO-Broadcast-Bot_" + newObjectResult.WICKRIO_BOT_NAME.value;
      } else {
        var newName = "WickrIO-Broadcast-Bot";
      }

      //var assign = Object.assign(dataParsed.apps[0].name, newName);
      dataParsed.apps[0].name = newName;

      var assign = Object.assign(dataParsed.apps[0].env.tokens, newObjectResult);
      var ps = fs.writeFileSync('./processes.json', JSON.stringify(dataParsed, null, 2));
    } catch (err) {
      console.log(err);
    }
    console.log(answer);
    return;
  }).catch(err => {
    console.log(err);
  });
}

function getCurrentValues()
{
    var newObjectResult = {};
    var processes;
    try {
        processes = fs.readFileSync('./processes.json', 'utf-8');
        if (!processes) {
          console.log("Error reading processes.json!")
          return newObjectResult;
        }
    }
    catch (err) {
        console.log(err);
        return newObjectResult;
    }

    var pjson = JSON.parse(processes);
    if (pjson.apps[0].env.tokens === undefined) {
        return newObjectResult;
    }

    // Create a mapping of the list of tokens and their values
    for(var attributename in pjson.apps[0].env.tokens){
        newObjectResult[attributename] = pjson.apps[0].env.tokens[attributename].value;
    }

    return newObjectResult;
}

/*
 * This function will check if any of the tokens have NOT been configured.
 * If all tokens have values assigned then a true value is returned.
 * If any tokens do not have values assigned then a false value is returned.
 */
function processConfigured()
{
    var processes;
    try {
        processes = fs.readFileSync('./processes.json', 'utf-8');
        if (!processes) {
          console.log("Error reading processes.json!")
          return false;
        }
    }
    catch (err) {
        console.log(err);
        return false;
    }

    var pjson = JSON.parse(processes);
    if (pjson.apps[0].env.tokens === undefined) {
        return false;
    }

    // Check if the value for any of the tokens is not set
    // If it is not set then return false
    for (var i = 0; i < tokens.length; i++) {
        if (pjson.apps[0].env.tokens[tokens[i]] === undefined) {
            return false;
        }
    }

    // All of the tokens have values set
    return true;
}
