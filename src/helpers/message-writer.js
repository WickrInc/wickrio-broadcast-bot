'use strict';

const fs = require('fs');

module.exports = {
  writeFile: function (message) {
    var path = process.cwd() + "/attachments/messages.txt";
    fs.appendFile(path, message + "\n", function(err) {
      if(err) {
          return console.log(err);
      }
      //console.log("The file was saved!");
    });
  }
}

