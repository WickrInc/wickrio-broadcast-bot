/*
    This javascript file will be ran in upgrade.sh. It's purpose is
    to change "script": "node broadcast-bot.js" in processes.json to
    "script": "node build/broadcast-bot.js"
*/

const Proc = require('./processes.json');
const fs = require('fs');

var dataToChange = JSON.parse(fs.readFileSync('./processes.json', 'utf-8'));
dataToChange.apps[0].script = "./build/broadcast-bot.js";
dataToChange.apps[0].exec_interpreter = "node";
fs.writeFileSync('./processes.json', JSON.stringify(dataToChange, null, 2));
