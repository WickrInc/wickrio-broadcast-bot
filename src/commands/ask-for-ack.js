import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
import logger from '../helpers/logger'

class AskForAck {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.ASK_FOR_ACK
  }

  shouldExecute() {
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.ASK_DM_RECIPIENT
    let reply = ''
    let messagemeta = {}
    if (this.messageService.affirmativeReply()) {
      this.broadcastService.setAckFlag(true)
      state = State.ASK_DM_RECIPIENT
      reply =
        'If your broadcast requires a response, type in the username of the Wickr user to whom you want to direct these responses.\nElse type or click "Confirm" to send your broadcast.'
      messagemeta = ButtonHelper.makeCancelButtons(['Confirm'])
    } else if (this.messageService.negativeReply()) {
      this.broadcastService.setAckFlag(false)
      logger.debug(this.broadcastService.getSendFile())
      if (
        this.broadcastService.getSendFile() !== undefined &&
        this.broadcastService.getSendFile() !== ''
      ) {
        state = State.NONE
        reply = this.broadcastService.sendToFile()
      } else {
        state = State.ASK_REPEAT
        reply = 'Would you like to repeat this broadcast message?'
        messagemeta = ButtonHelper.makeYesNoButton()
      }
    } else {
      reply =
        'Invalid input, please reply with (y)es or (n)o or type /cancel to cancel previous flow'
      state = State.ASK_FOR_ACK
      messagemeta = ButtonHelper.makeYesNoButton()
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default AskForAck
