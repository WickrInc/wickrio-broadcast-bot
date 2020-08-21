// import logger from './logger'
// import State from './state'

// These are the /commands and must go first to cancel any other existing commands
import Ack from './commands/ack'
import Abort from './commands/abort'
import Cancel from './commands/cancel'
import DeleteFile from './commands/delete-file'
import Help from './commands/help'
import FilesCommand from './commands/files-command'
import FileReceived from './commands/file-received'
import InitializeBroadcast from './commands/initialize-broadcast'
import InitializeSend from './commands/initialize-send'
import Report from './commands/report'
import Status from './commands/status'
import Map from './commands/map'

// These are the options associated with the commands
import ActiveRepeat from './commands/active-repeat'
import AskRepeat from './commands/ask-repeat'
import AskForAck from './commands/ask-for-ack'
import ChooseFile from './commands/choose-file'
import ChooseSecurityGroups from './commands/choose-security-groups'
import ConfirmSecurityGroups from './commands/confirm-security-groups'
import FileActions from './commands/file-actions'
import OverwriteCheck from './commands/overwrite-check'
import RepeatFrequency from './commands/repeat-frequency'
import SendUserFile from './commands/send-user-file'
import TimesRepeat from './commands/times-repeat'
import WhichAbort from './commands/which-abort'
import WhichDelete from './commands/which-delete'
import WhichReport from './commands/which-report'
import WhichStatus from './commands/which-status'
import WhichMap from './commands/which-map'
import BroadcastService from './services/broadcast-service'
import RepeatService from './services/repeat-service'
import SendService from './services/send-service'
import FileService from './services/file-service'
import GenericService from './services/generic-service'
import StatusService from './services/status-service'
import ReportService from './services/report-service'

// TODO how can we use a new Broadcast service each time???
class Factory {
  // TODO add send service
  constructor(user) {
    // These are the services that will be passed to the commands

    this.broadcastService = new BroadcastService(user)
    this.sendService = new SendService(user)
    this.statusService = new StatusService()
    this.repeatService = new RepeatService(this.broadcastService, user)
    this.reportService = new ReportService()
    this.genericService = new GenericService(10, user)
    this.fileService = new FileService(user)

    // These are the /commands
    this.ack = new Ack(this.genericService)
    this.abort = new Abort(this.genericService)
    this.cancel = new Cancel(this.broadcastService, this.sendService)
    this.deleteFile = new DeleteFile(this.sendService)
    this.filesCommand = new FilesCommand(this.sendService)
    this.fileReceived = new FileReceived(this.fileService)
    this.initializeBroadcast = new InitializeBroadcast(this.broadcastService)
    this.initializeSend = new InitializeSend(this.sendService)
    this.report = new Report(this.genericService)
    this.statusCommand = new Status(this.genericService)
    this.map = new Map(this.genericService)
    this.help = new Help(this.genericService)

    // These are the options
    this.activeRepeat = new ActiveRepeat(this.repeatService)
    this.askForAck = new AskForAck(this.broadcastService)
    this.askRepeat = new AskRepeat(this.repeatService, this.broadcastService)
    this.chooseFile = new ChooseFile(this.sendService)
    this.chooseSecurityGroups = new ChooseSecurityGroups(this.broadcastService)
    this.confirmSecurityGroups = new ConfirmSecurityGroups(
      this.broadcastService
    )
    this.fileActions = new FileActions(
      this.fileService,
      this.broadcastService,
      this.sendService
    )
    this.overwriteCheck = new OverwriteCheck(this.fileService)
    this.repeatFrequency = new RepeatFrequency(this.repeatService)
    this.sendUserFile = new SendUserFile(this.sendService)
    this.timesRepeat = new TimesRepeat(this.repeatService)
    this.whichAbort = new WhichAbort(this.genericService)
    this.whichDelete = new WhichDelete(this.sendService)
    this.whichReport = new WhichReport(this.genericService, this.reportService)
    this.whichStatus = new WhichStatus(this.genericService, this.statusService)
    this.whichMap = new WhichMap(this.genericService, this.statusService)

    // Order matters here /commands must go first
    // TODO make it so that the order doesn' matter?
    this.commandList = [
      // These are the /commands and must go first
      this.ack,
      this.abort,
      this.cancel,
      this.deleteFile,
      this.help,
      this.filesCommand,
      this.fileReceived,
      this.initializeSend,
      this.initializeBroadcast,
      this.report,
      this.statusCommand,
      this.map,
      this.panel,

      // Here are the options that rely on the current state
      this.askForAck,
      this.askRepeat,
      this.activeRepeat,
      this.chooseFile,
      this.chooseSecurityGroups,
      this.confirmSecurityGroups,
      this.fileActions,
      this.overwriteCheck,
      this.repeatFrequency,
      this.sendUserFile,
      this.timesRepeat,
      this.whichAbort,
      this.whichDelete,
      this.whichReport,
      this.whichStatus,
      this.whichMap,
    ]
  }

  execute(messageService) {
    for (const command of this.commandList) {
      if (command.shouldExecute(messageService)) {
        return command.execute(messageService)
      }
    }
    // TODO fix the admin command returning this then add it back
    // return {
    //   reply: 'Command not recognized send the command /help for a list of commands',
    //   state: State.NONE,
    // };
  }

  file(file, display) {
    this.broadcastService.setFile(file)
    this.broadcastService.setDisplay(display)
    return FileReceived.execute()
  }

  // static fileActions(messageService) {
  //   const response = FileActions.execute(messageService);
  //   return response;
  // }
}

export default Factory
