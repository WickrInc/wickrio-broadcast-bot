const logger = require('../logger');
const State = require('../state');
const GenericService = require('../services/generic-service');
const ReportService = require('../services/report-service');

class WhichReport {
  static shouldExecute(messageService) {
    if (messageService.getCurrentState() === State.WHICH_REPORT) {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    let reply;
    const currentEntries = GenericService.getMessageEntries(messageService.getUserEmail());
    let obj;
    const index = messageService.getMessage();
    const length = Math.min(currentEntries.length, 5);
    if (!messageService.isInt() || index < 1 || index > length) {
      reply = `Index: ${index} is out of range. Please enter a number between 1 and ${length}`;
      obj = {
        reply,
        state: State.WHICH_REPORT,
      };
    } else {
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      // reply = .getReport(messageID, 'summary', false);
      ReportService.getReport(messageID, messageService.getVGroupID());
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

module.exports = WhichReport;
