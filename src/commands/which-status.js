const logger = require('../logger');
const State = require('../state');

class WhichStatus {
  constructor(genericService, statusService) {
    this.genericService = genericService;
    this.statusService = statusService;
    this.state = State.WHICH_STATUS;
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
    let obj;
    const index = messageService.getMessage();
    const length = Math.min(currentEntries.length, 5);
    if (!messageService.isInt() || index < 1 || index > length) {
      reply = `Index: ${index} is out of range. Please enter a number between 1 and ${length}`;
      obj = {
        reply,
        state: State.WHICH_STATUS,
      };
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      reply = this.statusService.getStatus(messageID, false);
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

module.exports = WhichStatus;
