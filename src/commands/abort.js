import State from '../state';
import GenericService from '../services/generic-service';
import { logger } from '../helpers/constants';

class Abort {
  constructor(genericService) {
    this.genericService = genericService;
    this.commandString = '/abort';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    logger.debug(`:${messageService.getArgument()}:`);
    // check argument here!
    // args = argument.split(' ');
    // if (messageService.getArgument() === '') {
    // TODO put if statement in to allow for argument to this command
    const messageIdEntries = this.genericService.getMessageEntries(messageService.getUserEmail());
    let reply;
    if (messageIdEntries.length < 1) {
      reply = 'There are no previous messages to display';
      return {
        reply,
        state: State.NONE,
      };
    }
    const length = Math.min(messageIdEntries.length, 5);
    let contentData;
    let index = 1;
    const messageList = [];
    let messageString = '';
    for (let i = 0; i < messageIdEntries.length; i += 1) {
      contentData = this.genericService.getMessageEntry(messageIdEntries[i].message_id);
      const contentParsed = JSON.parse(contentData);
      messageList.push(contentParsed.message);
      messageString += `(${index}) ${contentParsed.message}\n`;
      index += 1;
    }
    reply = `Here are the past ${length} broadcast message(s):\n`
      + `${messageString}`
      + 'Which message would you like to abort?';
    return {
      reply,
      state: State.WHICH_ABORT,
    }
  }
}

export default Abort;
