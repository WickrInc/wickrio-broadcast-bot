import State from '../state';

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
    // const entriesString = this.genericService.getEntriesString(userEmail, 'see the status of');
    const entriesString = this.genericService.getEntriesString(userEmail);
    const reply = `${entriesString}Which message would you like to see the status of?`
      + '\nOr to see more messages reply more';
    return {
      reply,
      state: State.WHICH_STATUS,
    };
  }
}

export default Status;
