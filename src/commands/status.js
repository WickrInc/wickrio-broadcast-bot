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
    const entriesString = this.genericService.getEntriesString(messageService.getUserEmail());
    const reply = `${entriesString}Which message would you like to see the status of?`;
    return {
      reply,
      state: State.WHICH_STATUS,
    };
  }
}

export default Status;
