const logger = require('../logger');
const state = require('../state');

// TODO use this instead of putting it in main!
class Messages {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/messages') {
      return true;
    }
    return false;
  }

  static execute() {
    const reply = '';
    const path = `${process.cwd()}/attachments/messages.txt`;
    const uMessage = WickrIOAPI.cmdSendRoomAttachment(vGroupID, path, path);
    const obj = {
      reply,
      state: state.NONE,
    };
    return obj;
  }
}

module.exports = Messages;
