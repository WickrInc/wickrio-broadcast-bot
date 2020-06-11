import State from '../state';

class Report {
  constructor(genericService) {
    this.genericService = genericService;
    this.commandString = '/report';
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
    const entriesString = this.genericService.getEntriesString(userEmail);
    const reply = `${entriesString}Which message would you like to see the report of?`
      + '\nOr to see more messages reply more';
    return {
      reply,
      state: State.WHICH_REPORT,
    };
  }
}

export default Report;
