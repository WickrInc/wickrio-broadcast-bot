import logger from '../logger';
import State from '../state';

class WhichAbort {
  constructor(genericService) {
    this.genericService = genericService;
    this.state = State.WHICH_ABORT;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    let reply;
    let state;
    const userEmail = messageService.getUserEmail();
    const currentEntries = this.genericService.getMessageEntries(userEmail, true);
    const index = messageService.getMessage();
    if (index === 'more') {
      this.genericService.incrementIndexes();
      reply = this.genericService.getEntriesString(userEmail, true);
      state = this.state;
    } else if (!messageService.isInt() || index < 1 || index > currentEntries.length) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${currentEntries.length}`;
      state = this.state;
    } else {
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      reply = this.genericService.cancelMessageID(messageID);
      state = State.NONE;
    }
    return {
      reply,
      state,
    };
  }
}

export default WhichAbort;
