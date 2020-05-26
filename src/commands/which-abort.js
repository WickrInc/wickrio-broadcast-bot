const logger = require('../logger');
const State = require('../state');
const GenericService = require('../services/generic-service');

class WhichAbort {
  static shouldExecute(messageService) {
    if (messageService.getCurrentState() === State.WHICH_ABORT) {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    let reply;
    const currentEntries = GenericService.getMessageEntries(messageService.getUserEmail());
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
      reply = GenericService.cancelMessageID(messageID);
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

module.exports = WhichAbort;
