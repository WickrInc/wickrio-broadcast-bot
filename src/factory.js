const logger = require('./logger');
const Help = require('./commands/help');
const Ack = require('./commands/ack');
const Abort = require('./commands/abort');
const WhichAbort = require('./commands/which-abort');
const FilesCommand = require('./commands/files-command');
const FileReceived = require('./commands/file-received');
const InitializeBroadcast = require('./commands/initialize-broadcast');
const InitializeSend = require('./commands/initialize-send');
const State = require('./state');
const Status = require('./commands/status');
const WhichStatus = require('./commands/which-status');
const Report = require('./commands/report');
const WhichReport = require('./commands/which-report');
const ChooseFile = require('./commands/choose-file');
const Cancel = require('./commands/cancel');
const AskForAck = require('./commands/ask-for-ack');
const ChooseSecurityGroups = require('./commands/choose-security-groups');
const ConfirmSecurityGroups = require('./commands/confirm-security-groups');
const AskRepeat = require('./commands/ask-repeat');
const ActiveRepeat = require('./commands/active-repeat');
const TimesRepeat = require('./commands/times-repeat');
const RepeatFrequency = require('./commands/repeat-frequency');

// TODO how can we use a new Broadcast service each time???
class Factory {
  // TODO add send service
  constructor(broadcastService, sendService, statusService, repeatService, reportService) {
    this.broadcastService = broadcastService;
    this.sendService = sendService;
    this.statusService = statusService;
    this.repeatService = repeatService;
    this.reportService = reportService;
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
      Status,
      WhichStatus,
      Report,
      WhichReport,
      this.initializeBroadcast,
      this.askForAck,
      this.chooseSecurityGroups,
      this.confirmSecurityGroups,
      this.askRepeat,
      this.timesRepeat,
      this.activeRepeat,
      this.repeatFrequency,
      Abort,
      WhichAbort,
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

module.exports = Factory;
