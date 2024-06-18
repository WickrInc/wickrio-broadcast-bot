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
import Start from './commands/start'
import Status from './commands/status'
import Map from './commands/map'

// These are the options associated with the commands
import ActiveRepeat from './commands/active-repeat'
import AskRepeat from './commands/ask-repeat'
import AskForAck from './commands/ask-for-ack'
import AskDMRecipient from './commands/ask-dm-recipient'
import ChooseFile from './commands/choose-file'
import CreateMessage from './commands/create-message'
import ChooseSecurityGroups from './commands/choose-security-groups'
import ConfirmSecurityGroups from './commands/confirm-security-groups'
import FileActions from './commands/file-actions'
import OverwriteCheck from './commands/overwrite-check'
import Panel from './commands/panel'
import RepeatFrequency from './commands/repeat-frequency'
import SendUserFile from './commands/send-user-file'
import SelectRecipients from './commands/select-recipients'
import TimesRepeat from './commands/times-repeat'
import WhichAbort from './commands/which-abort'
import WhichDelete from './commands/which-delete'
import WhichReport from './commands/which-report'
import WhichStatus from './commands/which-status'
import WhichMap from './commands/which-map'
// import BroadcastService from './services/broadcast-service'
// import SendService from './services/send-service'
import BroadcastMessageService from './services/broadcast-message-service'
import CombinedService from './services/combined-service'
import RepeatService from './services/repeat-service'
import SendMessageService from './services/send-message-service'
import SetupService from './services/setup-service'
import FileService from './services/file-service'
import GenericService from './services/generic-service'
import StatusService from './services/status-service'
import ReportService from './services/report-service'
import Version from './commands/version'
import Queue from './commands/queue'
import MapService from './services/map-service'
import {
  WickrIOAPI,
  apiService,
  RESPONSES_ENABLED,
  ADMINISTRATORS_CHOICE,
} from './helpers/constants'
import writeFile from './helpers/message-writer.js'
import logger from './helpers/logger'

// TODO how can we use a new Broadcast service each time???
class Factory {
  // TODO add send service
  constructor({ messageService }) {
    // constructor({ messageService, broadcastService }) {
    // These are the services that will be passed to the commands
    this.messageService = messageService
    // this.broadcastService = broadcastService
    this.apiService = apiService
    this.genericService = new GenericService({
      endIndex: 10,
      messageService: this.messageService,
      apiService: this.apiService,
    })

    // acknowledges all messages sent to user
    // move to factory?
    if (this.messageService.msgType === 'location') {
      const obj = {
        location: {
          latitude: this.messageService.latitude,
          longitude: this.messageService.longitude,
        },
      }
      const statusMessage = JSON.stringify(obj)

      this.genericService.setMessageStatus(
        '',
        `${this.messageService.userEmail}`,
        '3',
        statusMessage
      )
      return
    }

    if (
      ADMINISTRATORS_CHOICE.value === 'yes' &&
      !this.messageService.isAdmin &&
      this.messageService.command !== '/ack'
    ) {
      if (
        RESPONSES_ENABLED === undefined ||
        RESPONSES_ENABLED.value === 'yes'
      ) {
        const reply = `Hey this bot is just for announcements and can't respond to you personally, or ${this.messageService.userEmail} is not authorized to use this bot. If you have a question, please get a hold of us at wickr-support@amazon.com or visit us at support.wickr.com. Thanks, Team Wickr`
        WickrIOAPI.cmdSendRoomMessage(this.messageService.vGroupID, reply)
        // logger.debug({ sMessage })
        writeFile(this.messageService.message)
      }
      this.validatedUser = false
      return
    }

    this.validatedUser = true
    this.reportService = ReportService
    this.statusService = StatusService

    this.broadcastService = new CombinedService({
      messageService: this.messageService,
      apiService: this.apiService,
      broadcastMessageService: BroadcastMessageService,
      sendMessageService: SendMessageService,
    })
    this.combinedService = new CombinedService({
      messageService: this.messageService,
      apiService: this.apiService,
      broadcastMessageService: BroadcastMessageService,
      sendMessageService: SendMessageService,
    })
    this.repeatService = new RepeatService({
      combinedService: this.combinedService,
      messageService: this.messageService,
      apiService: this.apiService,
      broadcastMessageService: BroadcastMessageService,
    })
    this.sendService = new CombinedService({
      messageService: this.messageService,
      apiService: this.apiService,
      broadcastMessageService: BroadcastMessageService,
      sendMessageService: SendMessageService,
    })
    // this.sendService = new SendService({ messageService: this.messageService })
    this.fileService = new FileService({ messageService: this.messageService })
    this.mapService = new MapService({
      apiService: this.apiService,
    })

    // These are the /commands
    this.version = new Version({
      messageService: this.messageService,
    })
    this.queue = new Queue({
      messageService: this.messageService,
    })
    this.ack = new Ack({
      genericService: this.genericService,
      messageService: this.messageService,
    })
    this.abort = new Abort({
      genericService: this.genericService,
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
      setupService: SetupService,
      combinedService: this.combinedService,
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
      genericService: this.genericService,
      messageService: this.messageService,
    })
    this.statusCommand = new Status({
      genericService: this.genericService,
      messageService: this.messageService,
    })
    this.start = new Start({
      messageService: this.messageService,
      setupService: SetupService,
      combinedService: this.combinedService,
    })
    this.map = new Map({
      genericService: this.genericService,
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
    this.askDMRecipient = new AskDMRecipient({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
      apiService: this.apiService,
    })
    this.askRepeat = new AskRepeat({
      combinedService: this.combinedService,
      messageService: this.messageService,
    })
    this.chooseFile = new ChooseFile({
      sendService: this.sendService,
      fileService: this.fileService,
      messageService: this.messageService,
    })
    this.chooseSecurityGroups = new ChooseSecurityGroups({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.createMessage = new CreateMessage({
      combinedService: this.combinedService,
      messageService: this.messageService,
    })
    this.confirmSecurityGroups = new ConfirmSecurityGroups({
      broadcastService: this.broadcastService,
      messageService: this.messageService,
    })
    this.fileActions = new FileActions({
      fileService: this.fileService,
      combinedService: this.combinedService,
      setupService: SetupService,
      messageService: this.messageService,
    })
    this.overwriteCheck = new OverwriteCheck({
      fileService: this.fileService,
      combinedService: this.combinedService,
      messageService: this.messageService,
    })
    this.repeatFrequency = new RepeatFrequency({
      combinedService: this.combinedService,
      repeatService: this.repeatService,
      messageService: this.messageService,
    })
    this.sendUserFile = new SendUserFile({
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.selectRecipients = new SelectRecipients({
      broadcastService: this.broadcastService,
      sendService: this.sendService,
      messageService: this.messageService,
    })
    this.timesRepeat = new TimesRepeat({
      combinedService: this.combinedService,
      messageService: this.messageService,
    })
    this.whichAbort = new WhichAbort({
      genericService: this.genericService,
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
      mapService: this.mapService,
      messageService: this.messageService,
    })

    // Order matters here /commands must go first
    // TODO make it so that the order doesn' matter?
    this.commandList = [
      // These are the /commands and must go first
      this.version,
      this.queue,
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
      this.start,
      this.statusCommand,
      this.map,
      this.panel,

      // Here are the options that rely on the current state
      this.askDMRecipient,
      this.askForAck,
      this.askRepeat,
      this.activeRepeat,
      this.chooseFile,
      this.chooseSecurityGroups,
      this.createMessage,
      this.confirmSecurityGroups,
      this.fileActions,
      this.overwriteCheck,
      this.repeatFrequency,
      this.selectRecipients,
      this.sendUserFile,
      this.timesRepeat,
      this.whichAbort,
      this.whichDelete,
      this.whichReport,
      this.whichStatus,
      this.whichMap,
    ]
  }

  async execute() {
    const defaultReply =
      'This command is not recognized. Check the format and spelling and try again. For a list of available commands, type in /help'
    // If the constructor did not validate the user then return!
    if (!this.validatedUser) return
    logger.debug('STATE' + this.messageService.user.currentState)

    for (const command of this.commandList) {
      if (command.shouldExecute()) {
        return await command.execute()
      }
    }

    return {
      reply: defaultReply,
    }
  }

  // TODO do we need this?
  file(file, display) {
    this.broadcastService.setFile(file)
    this.broadcastService.setDisplay(display)
    return FileReceived.execute()
  }
}

export default Factory
