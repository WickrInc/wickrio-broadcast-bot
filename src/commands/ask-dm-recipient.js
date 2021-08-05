import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class AskDMRecipient {
  constructor({ broadcastService, messageService, apiService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.apiService = apiService
    this.state = State.ASK_DM_RECIPIENT
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
    let reply = ''
    let messagemeta
    let state
    const userID = this.messageService.message
    if (userID.toLowerCase() === 'confirm') {
      this.broadcastService.setDMFlag(false)
    } else {
      let userInfo
      try {
        userInfo = this.apiService.getUserInfo([userID])
      } catch {
        reply = `The user: ${userID} does not exist in your network. Type in the username of the Wickr user to whom you want to direct these responses. \nElse type "Confirm" to confirm your broadcast. Or type /cancel to cancel flow`
        state = State.ASK_DM_RECIPIENT
        messagemeta = ButtonHelper.makeCancelButtons(['Confirm'])
        return {
          reply,
          state,
          messagemeta,
        }
      }
      const failed = userInfo.failed
      if (failed !== undefined && userInfo.failed.length !== 0) {
        reply = `The user: ${userID} does not exist in your network. Type in the username of the Wickr user to whom you want to direct these responses. \nElse type "Confirm" to confirm your broadcast. Or type /cancel to cancel flow`
        state = State.ASK_DM_RECIPIENT
        messagemeta = ButtonHelper.makeCancelButtons(['Confirm'])
        return {
          reply,
          state,
          messagemeta,
        }
      } else {
        this.broadcastService.setDMFlag(true)
        this.broadcastService.setDMRecipient(userID)
      }
    }
    if (
      this.broadcastService.getSendFile() !== undefined &&
      this.broadcastService.getSendFile() !== ''
    ) {
      state = State.NONE
      this.broadcastService.sendToFile()
      reply = this.broadcastService.getQueueInfo()
    } else {
      reply = 'Would you like to repeat this broadcast message?'
      state = State.ASK_REPEAT
      messagemeta = ButtonHelper.makeYesNoButton()
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default AskDMRecipient
