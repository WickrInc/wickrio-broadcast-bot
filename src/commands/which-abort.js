import logger from '../logger';
import State from '../state';
import GenericService from '../services/generic-service';

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
    const currentEntries = this.genericService.getMessageEntries(messageService.getUserEmail());
    // TODO do we need an object here or can we just return inside the if/else?
    let obj;
    const index = messageService.getMessage();
    const length = Math.min(currentEntries.length, 5);
    if (!messageService.isInt() || index < 1 || index > length) {
      reply = `Index: ${index} is out of range. Please enter a number between 1 and ${length}`;
      obj = {
        reply,
        state: State.WHICH_ABORT,
      };
    } else {
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      reply = this.genericService.cancelMessageID(messageID);
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

export default WhichAbort;
