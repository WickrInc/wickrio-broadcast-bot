const logger = require('../logger');
const state = require('../state');
const GenericService = require('../services/generic-service');

class Abort {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/abort') {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    logger.debug(`:${messageService.getArgument()}:`);
    // check argument here!
    // args = argument.split(' ');
    let obj;
    if (messageService.getArgument() === '') {
      const messageIdEntries = GenericService.getMessageEntries(messageService.getUserEmail());
      let reply = '';

      if (messageIdEntries.length < 1) {
        reply = 'There are no previous messages to display';
        obj = {
          reply,
          state: state.NONE,
        };
      }
      const length = Math.min(messageIdEntries.length, 5);
      let contentData;
      let index = 1;
      const messageList = [];
      let messageString = '';
      for (let i = 0; i < messageIdEntries.length; i += 1) {
        contentData = GenericService.getMessageEntry(messageIdEntries[i].message_id);
        const contentParsed = JSON.parse(contentData);
        messageList.push(contentParsed.message);
        messageString += `(${index}) ${contentParsed.message}\n`;
        index += 1;
      }
      reply = `Here are the past ${length} broadcast message(s):\n`
        + `${messageString}`
        + 'Which message would you like to abort?';
      obj = {
        reply,
        state: state.WHICH_ABORT,
      };
      // TODO keep working on this!!
    }
    // else if (isNaN(argument)) {
    //   const reply = strings.enterID;
    //   const uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    // }
    return obj;
  }
}

module.exports = Abort;
