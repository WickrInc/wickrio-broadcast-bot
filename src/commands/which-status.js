import logger from '../logger';
import { WHICH_STATUS, NONE } from '../state';
import { getMessageEntries } from '../services/generic-service';
import StatusService from '../services/status-service';


class WhichStatus {
  static shouldExecute(messageService) {
    if (messageService.getCurrentState() === WHICH_STATUS) {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    let reply;
    const currentEntries = getMessageEntries(messageService.getUserEmail());
    let obj;
    const index = messageService.getMessage();
    const length = Math.min(currentEntries.length, 5);
    if (!messageService.isInt() || index < 1 || index > length) {
      reply = `Index: ${index} is out of range. Please enter a number between 1 and ${length}`;
      obj = {
        reply,
        state: WHICH_STATUS,
      };
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      reply = StatusService.getStatus(messageID, false);
      obj = {
        reply,
        state: NONE,
      };
    }
    return obj;
  }
}

export default WhichStatus;
