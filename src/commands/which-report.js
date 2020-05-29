import logger from '../logger';
import State from '../state';
import { getMessageEntries } from '../services/generic-service';
import ReportService from '../services/report-service';

class WhichReport {
  constructor(genericService, reportService) {
    this.genericService = genericService;
    this.reportService = reportService;
    this.state = State.WHICH_REPORT;
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
        state: State.WHICH_REPORT,
      };
    } else {
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`;
      // reply = .getReport(messageID, 'summary', false);
      this.reportService.getReport(messageID, messageService.getVGroupID());
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

export default WhichReport;
