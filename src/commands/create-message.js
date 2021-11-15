import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
import { logger } from '../helpers/constants'

class CreateMessage {
  constructor({ combinedService, messageService }) {
    this.combinedService = combinedService
    this.messageService = messageService
    this.state = State.CREATE_MESSAGE
  }

  shouldExecute() {
    // logger.verbose('CreateMessage: shouldExecute')
    logger.debug('CreateMessage: shouldExecute')
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const message = this.messageService.getMessage()
    const file = this.messageService.getFile()
    const filePath = this.messageService.getFilePath()
    const fileName = this.messageService.getFilename()
    const userEmail = this.messageService.getUserEmail()
    const vGroupID = this.messageService.getVGroupID()
    let reply = 'Would you like to ask the recipients for an acknowledgement?'
    let state = State.ASK_FOR_ACK
    let messagemeta = ButtonHelper.makeYesNoButton()
    if (
      (message === null || message === undefined || message === '') &&
      (file === null || file === undefined || file === '')
    ) {
      reply =
        'Must have a message or file for broadcasting, if you would like to send a file press the "+" button'
      state = State.CREATE_MESSAGE
      messagemeta = {}
    } else if (message !== null && message !== undefined && message !== '') {
      this.combinedService.setMessage(message)
    } else if (this.messageService.isVoiceMemo) {
      this.combinedService.setupVoiceMemoBroadcast(
        filePath,
        this.messageService.voiceMemoDuration,
        userEmail,
        vGroupID
      )
    } else {
      this.combinedService.setupFileBroadcast(
        filePath,
        fileName,
        userEmail,
        vGroupID
      )
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = CreateMessage
