const logger = require('../logger');
const state = require('../state');

class InitializeSend {
  constructor(sendService) {
    this.sendService = sendService;
    this.commandString = '/send';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    this.sendService.setMessage(messageService.getArgument());
    this.sendService.setUserEmail(messageService.getUserEmail());
    this.sendService.setVGroupID(messageService.getVGroupID());
    const fileArr = this.sendService.getFiles();
    const length = Math.min(fileArr.length, 5);
    let reply;
    logger.debug(`message:${messageService.getMessage()}userEmail:${messageService.getUserEmail()}`);
    // TODO check for empty string
    if (!messageService.getMessage() || !messageService.getMessage().length === 0) {
      reply = 'Must have a message or file to send, Usage: /send <message>';
    }
    if (length > 0) {
      reply = 'To which list would you like to send your message:\n';
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
      const obj = {
        reply,
        state: state.CHOOSE_FILE,
      };
      return obj;
    }
    // TODO reorganize this and above ^
    reply = 'There are no files available to send to. Please upload file with usernames or hashes first.';
    const obj = {
      reply,
      state: state.NONE,
    };
    return obj;
  }
}

module.exports = InitializeSend;
