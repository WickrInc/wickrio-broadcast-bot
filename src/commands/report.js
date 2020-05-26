const logger = require('../logger');
const state = require('../state');
const GenericService = require('../services/generic-service');

class Report {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/report') {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    const currentEntries = GenericService.getMessageEntries(messageService.getUserEmail());
    let reply = '';
    let obj;
    if (currentEntries.length < 1) {
      reply = 'There are no previous messages to display';
      obj = {
        reply,
        state: state.NONE,
      };
    } else {
      const length = Math.min(currentEntries.length, 5);
      let contentData;
      let index = 1;
      const messageList = [];
      let messageString = '';
      for (let i = 0; i < currentEntries.length; i += 1) {
        contentData = GenericService.getMessageEntry(currentEntries[i].message_id);
        const contentParsed = JSON.parse(contentData);
        messageList.push(contentParsed.message);
        messageString += `(${index}) ${contentParsed.message}\n`;
        index += 1;
      }
      reply = `Here are the past ${length} broadcast message(s):\n`
        + `${messageString}`
        + 'Which message would you like to see the report of?';
      obj = {
        reply,
        state: state.WHICH_REPORT,
      };
    }
    return obj;
  }
}

module.exports = Report;
