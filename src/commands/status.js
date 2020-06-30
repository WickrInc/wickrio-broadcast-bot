import State from '../state';
import { logger } from '../helpers/constants';

class Status {
  constructor(genericService) {
    this.genericService = genericService;
    this.commandString = '/status';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    const userEmail = messageService.getUserEmail();
    this.genericService.resetIndexes();
    // TODO add a string of status as the second parameter to this command
    const entries = this.genericService.getMessageEntries(userEmail, false);
    const entriesString = this.genericService.getEntriesString(userEmail, false);
    let reply;
    if (!entries || entries.length === 0) {
      reply = entriesString;
    } else {
      reply = `${entriesString}Which message would you like to abort?`;
    }
    if (entries.length > 10) {
      reply += '\nOr to see more messages reply more';
    }
    return {
      reply,
      state: State.WHICH_STATUS,
    };
  }
}

export default Status;
