import logger from './logger';
import Help from './commands/help';
import Ack from './commands/ack';
import Abort from './commands/abort';
import WhichAbort from './commands/which-abort';
import FilesCommand from './commands/files-command';
import FileReceived from './commands/file-received';
import InitializeBroadcast from './commands/initialize-broadcast';
import InitializeSend from './commands/initialize-send';
import State from './state';
import Status from './commands/status';
import WhichStatus from './commands/which-status'
import Report from './commands/report';
import WhichReport from './commands/which-report';
import ChooseFile from './commands/choose-file';
import Cancel from './commands/cancel';
import AskForAck from './commands/ask-for-ack';
import ChooseSecurityGroups from './commands/choose-security-groups';
import ConfirmSecurityGroups from './commands/confirm-security-groups';
import AskRepeat from './commands/ask-repeat';
import ActiveRepeat from './commands/active-repeat';
import TimesRepeat from './commands/times-repeat';
import RepeatFrequency from './commands/repeat-frequency';

// TODO how can we use a new Broadcast service each time???
class Factory {
  // TODO add send service
  constructor(
    broadcastService,
    sendService,
    statusService,
    repeatService,
    reportService,
    genericService,
  ) {
    this.broadcastService = broadcastService;
    this.sendService = sendService;
    this.statusService = statusService;
    this.repeatService = repeatService;
    this.reportService = reportService;
    this.genericService = genericService;

    console.log({
      broadcastService,
      sendService,
      statusService,
      repeatService,
      reportService,
      genericService,
    })
    this.statusCommand = new Status(this.genericService);
    this.whichStatus = new WhichStatus(this.genericService, this.statusService);
    this.abort = new Abort(this.genericService);
    this.whichAbort = new WhichAbort(this.genericService);
    this.report = new Report(this.genericService);
    this.whichReport = new WhichReport(this.genericService, this.reportService);
    this.initializeBroadcast = new InitializeBroadcast(this.broadcastService);
    this.chooseFile = new ChooseFile(this.sendService);
    this.fileReceived = new FileReceived(this.sendService);
    this.filesCommand = new FilesCommand(this.sendService);
    this.askForAck = new AskForAck(this.broadcastService);
    this.confirmSecurityGroups = new ConfirmSecurityGroups(this.broadcastService);
    this.chooseSecurityGroups = new ChooseSecurityGroups(this.broadcastService);
    this.askRepeat = new AskRepeat(this.repeatService, this.broadcastService);
    this.timesRepeat = new TimesRepeat(this.repeatService);
    this.activeRepeat = new ActiveRepeat(this.repeatService);
    this.repeatFrequency = new RepeatFrequency(this.repeatService);
    this.initializeSend = new InitializeSend(this.sendService);
    this.chooseFile = new ChooseFile(this.sendService);

    this.commandList = [
      Help,
      Cancel,
      this.filesCommand,
      this.initializeSend,
      this.chooseFile,
      this.statusCommand,
      this.whichStatus,
      this.report,
      this.whichReport,
      this.initializeBroadcast,
      this.askForAck,
      this.chooseSecurityGroups,
      this.confirmSecurityGroups,
      this.askRepeat,
      this.timesRepeat,
      this.activeRepeat,
      this.repeatFrequency,
      this.abort,
      this.whichAbort,
      Ack,
    ];
  }

  execute(messageService) {
    // this.commandList.forEach((command) => {
    for (const command of this.commandList) {
      if (command.shouldExecute(messageService)) {
        return command.execute(messageService);
      }
    }
    // TODO fix the admin command returning this then add it back
    // return {
    //   reply: 'Command not recognized send the command /help for a list of commands',
    //   state: State.NONE,
    // };
  }

  file(file, display) {
    this.broadcastService.setFile(file);
    this.broadcastService.setDisplay(display);
    return this.fileReceived.execute();
  }
}

export default Factory;
