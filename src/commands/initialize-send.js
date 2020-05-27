const logger = require('../logger');
const State = require('../state');

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
    let state = State.NONE;
    logger.debug(`message:${messageService.getMessage()}userEmail:${messageService.getUserEmail()}`);
    if (!messageService.getArgument() || messageService.getArgument().length === 0) {
      reply = 'Must have a message or file to send, Usage: /send <message>';
    } else if (length > 0) {
      // TODO get rid of newline on last line
      reply = 'To which list would you like to send your message:\n';
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
      state = State.CHOOSE_FILE;
    } else {
      reply = 'There are no files available to send to. Please upload a file with usernames or hashes first.';
    }
    return {
      reply,
      state,
    };
  }
}

module.exports = InitializeSend;
