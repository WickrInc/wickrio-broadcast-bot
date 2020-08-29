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
import Panel from './commands/panel'
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
import APIService from './services/api-service'
import StatusService from './services/status-service'
import ReportService from './services/report-service'
import Version from './commands/version'

// TODO how can we use a new Broadcast service each time???
class Factory {
  // TODO add send service
  constructor({ messageService }) {
    // constructor({ messageService, broadcastService }) {
    // These are the services that will be passed to the commands
    this.messageService = messageService
    // this.broadcastService = broadcastService
    this.apiService = APIService
    this.reportService = ReportService
    this.statusService = StatusService

    this.broadcastService = new BroadcastService({
      messageService: this.messageService,
      apiService: this.apiService,
    })
    this.repeatService = new RepeatService({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.sendService = new SendService(this.messageService)
    this.fileService = new FileService(this.messageService)
    this.genericService = new GenericService({
      endIndex: 10,
      messageService: this.messageService,
      apiService: this.apiService,
    })

    // These are the /commands
    this.version = new Version({
      messageService: this.messageService,
    })
    this.ack = new Ack({
      genericService: this.genericService,
      messageService: this.messageService,
    })
    this.abort = new Abort({
      genericeService: this.genericService,
      messageService: this.messageService,
    })
    this.cancel = new Cancel({
      broadcastService: this.broadcastService,
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.deleteFile = new DeleteFile({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.filesCommand = new FilesCommand({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.fileReceived = new FileReceived({
      fileService: this.fileService,
      messageService: this.messageService,
    })
    this.initializeBroadcast = new InitializeBroadcast({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.initializeSend = new InitializeSend({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.report = new Report({
      genericeService: this.genericService,
      messageService: this.messageService,
    })
    this.statusCommand = new Status({
      genericService: this.genericService,
      messageService: this.messageService,
    })
    this.map = new Map({
      genericeService: this.genericService,
      messageService: this.messageService,
    })
    this.panel = new Panel({
      apiService: this.apiService,
      messageService: this.messageService,
    })
    this.help = new Help({
      apiService: this.apiService,
      messageService: this.messageService,
    })

    // These are the options
    this.activeRepeat = new ActiveRepeat({
      repeatService: this.repeatService,
      messageService: this.messageService,
    })
    this.askForAck = new AskForAck({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.askRepeat = new AskRepeat({
      repeatService: this.repeatService,
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.chooseFile = new ChooseFile({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.chooseSecurityGroups = new ChooseSecurityGroups({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.confirmSecurityGroups = new ConfirmSecurityGroups({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.fileActions = new FileActions({
      fileService: this.fileService,
      broadcastService: this.broadcastService,
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.overwriteCheck = new OverwriteCheck({
      fileService: this.fileService,
      messageService: this.messageService,
    })
    this.repeatFrequency = new RepeatFrequency({
      repeatService: this.repeatService,
      messageService: this.messageService,
    })
    this.sendUserFile = new SendUserFile({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.timesRepeat = new TimesRepeat({
      repeatService: this.repeatService,
      messageService: this.messageService,
    })
    this.whichAbort = new WhichAbort({
      genericeService: this.genericService,
      messageService: this.messageService,
    })
    this.whichDelete = new WhichDelete({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.whichReport = new WhichReport({
      genericService: this.genericService,
      reportService: this.reportService,
      messageService: this.messageService,
    })
    this.whichStatus = new WhichStatus({
      genericService: this.genericService,
      statusService: this.statusService,
      messageService: this.messageService,
    })
    this.whichMap = new WhichMap({
      genericService: this.genericService,
      statusService: this.statusService,
      messageService: this.messageService,
    })

    // Order matters here /commands must go first
    // TODO make it so that the order doesn' matter?
    this.commandList = [
      // These are the /commands and must go first
      this.version,
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

  execute() {
    for (const command of this.commandList) {
      if (command.shouldExecute()) {
        return command.execute()
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
