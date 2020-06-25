import State from '../state';
import { logger } from '../helpers/constants';


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
    const userEmail = messageService.getUserEmail();
    this.sendService.setMessage(messageService.getArgument());
    this.sendService.setUserEmail(userEmail);
    this.sendService.setVGroupID(messageService.getVGroupID());
    this.sendService.setTTL('');
    this.sendService.setBOR('');
    // this.broadcastService.setSentByFlag(true);
    const fileArr = this.sendService.getFiles(userEmail);
    // TODO add more command to getting files
    let reply;
    let state = State.NONE;
    logger.debug(`message:${messageService.getMessage()}userEmail:${messageService.getUserEmail()}`);
    if (
      messageService.getArgument() === undefined
      || messageService.getArgument() === ''
      || messageService.getArgument().length === 0
    ) {
      reply = 'Must have a message or file to send, Usage: /send <message>';
    } else if (!fileArr || fileArr.length === 0) {
      reply = 'There aren\'t any files available for sending, please upload a file of usernames or hashes first.';
    } else {
      // TODO get rid of newline on last line
      // TODO add more function to listing files as well
      reply = 'To which list would you like to send your message:\n';
      for (let index = 0; index < fileArr.length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
      state = State.CHOOSE_FILE;
    }
    return {
      reply,
      state,
    };
  }
}

export default InitializeSend;
