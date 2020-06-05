import logger from './logger';
import State from './state';

// These are the /commands and must go first to cancel any other existing commands
import Ack from './commands/ack';
import Abort from './commands/abort';
import Cancel from './commands/cancel';
import Help from './commands/help';
import FilesCommand from './commands/files-command';
import FileReceived from './commands/file-received';
import InitializeBroadcast from './commands/initialize-broadcast';
import InitializeSend from './commands/initialize-send';
import Report from './commands/report';
import Status from './commands/status';

// These are the options associated with the commands
import ActiveRepeat from './commands/active-repeat';
import AskRepeat from './commands/ask-repeat';
import AskForAck from './commands/ask-for-ack';
import ChooseFile from './commands/choose-file';
import ChooseSecurityGroups from './commands/choose-security-groups';
import ConfirmSecurityGroups from './commands/confirm-security-groups';
import FileActions from './commands/file-actions';
import RepeatFrequency from './commands/repeat-frequency';
import TimesRepeat from './commands/times-repeat';
import WhichAbort from './commands/which-abort';
import WhichStatus from './commands/which-status';
import WhichReport from './commands/which-report';

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
    fileService,
  ) {
    // These are the services that will be passed to the commands
    this.broadcastService = broadcastService;
    this.sendService = sendService;
    this.statusService = statusService;
    this.repeatService = repeatService;
    this.reportService = reportService;
    this.genericService = genericService;
    this.fileService = fileService;

    // These are the /commands
    this.ack = new Ack(this.genericService);
    this.abort = new Abort(this.genericService);
<<<<<<< HEAD
=======
    this.whichAbort = new WhichAbort(this.genericService);
    this.report = new Report(this.genericService);
    this.whichReport = new WhichReport(this.genericService, this.reportService);
    this.initializeBroadcast = new InitializeBroadcast(this.broadcastService);
    this.chooseFile = new ChooseFile(this.sendService);
>>>>>>> WIP: Trying to call async outside of main
    this.filesCommand = new FilesCommand(this.sendService);
    this.fileReceived = new FileReceived(this.fileService);
    this.initializeBroadcast = new InitializeBroadcast(this.broadcastService);
    this.initializeSend = new InitializeSend(this.sendService);
    this.report = new Report(this.genericService);
    this.statusCommand = new Status(this.genericService);

    // These are the options
    this.activeRepeat = new ActiveRepeat(this.repeatService);
    this.askForAck = new AskForAck(this.broadcastService);
    this.askRepeat = new AskRepeat(this.repeatService, this.broadcastService);
    this.chooseFile = new ChooseFile(this.sendService);
    this.chooseSecurityGroups = new ChooseSecurityGroups(this.broadcastService);
    this.confirmSecurityGroups = new ConfirmSecurityGroups(this.broadcastService);
    this.fileActions = new FileActions(this.fileService, this.broadcastService, this.sendService);
    this.repeatFrequency = new RepeatFrequency(this.repeatService);
    this.timesRepeat = new TimesRepeat(this.repeatService);
    this.whichStatus = new WhichStatus(this.genericService, this.statusService);
    this.whichAbort = new WhichAbort(this.genericService);
    this.whichReport = new WhichReport(this.genericService, this.reportService);

    // Order matters here /commands must go first
    // TODO make it so that the order doesn' matter?
    this.commandList = [
      // These are the /commands and must go first
      this.ack,
      this.abort,
      Cancel,
      Help,
      this.filesCommand,
      this.initializeSend,
      this.initializeBroadcast,
      this.report,
      this.statusCommand,

      // Here are the options that rely on the current state
      this.askForAck,
      this.askRepeat,
      this.activeRepeat,
      this.chooseFile,
      this.chooseSecurityGroups,
      this.confirmSecurityGroups,
      this.fileActions,
      this.repeatFrequency,
      this.timesRepeat,
      this.whichStatus,
      this.whichReport,
      this.whichAbort,
      this.fileReceived,
      Ack,
    ];
  }

  execute(messageService) {
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
    return FileReceived.execute();
  }

  // static fileActions(messageService) {
  //   const response = FileActions.execute(messageService);
  //   return response;
  // }
}

export default Factory;
