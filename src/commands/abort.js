import State from '../state';
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
    this.genericService.resetIndexes();
    const userEmail = messageService.getUserEmail();
    // check argument here!
    // args = argument.split(' ');
    // if (messageService.getArgument() === '') {
    // TODO put if statement in to allow for argument to this command
    const entries = this.genericService.getMessageEntries(userEmail);
    // const messageIdEntries = this.genericService.getMessageEntries(userEmail);
    const entriesString = this.genericService.getAbortEntriesString(userEmail);
    let reply;
    if (!entries || entries.length < 1) {
      reply = entriesString;
    } else {
      reply = `${entriesString}Which message would you like to abort?`
      + '\nOr to see more messages reply more';
    }
    return {
      reply,
      state: State.WHICH_ABORT,
    };
  }
}

export default Abort;
