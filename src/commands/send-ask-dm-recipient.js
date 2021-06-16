import State from '../state'

class SendAskDMRecipient {
  constructor({ sendService, messageService, apiService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.apiService = apiService
    this.state = State.SEND_ASK_DM_RECIPIENT
  }

  shouldExecute() {
    // logger.trace('SendAskDMRecipient: shouldExecute')
    console.log('SendAskDMRecipient: shouldExecute')
    // TODO could remove the /broadcast check if done right
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.NONE
    let reply
    let messagemeta
    const userID = this.messageService.message
    if (userID.toLowerCase() === 'complete') {
      this.sendService.setDMFlag(false)
    } else {
      const userInfo = this.apiService.getUserInfo([userID])
      const failed = userInfo.failed
      if (failed !== undefined && userInfo.failed.length !== 0) {
        reply = `The user: ${userID} does not exist in Wickr. Type in the username of the Wickr user to whom you want to direct these responses. Or type /cancel to cancel flow`
        state = State.SEND_ASK_DM_RECIPIENT
        return {
          reply,
          state,
          messagemeta,
        }
      } else {
        this.sendService.setDMFlag(true)
        this.sendService.setDMRecipient(userID)
      }
    }

    reply = this.sendService.getQueueInfo()
    // TODO check for errors first!! return from send
    this.sendService.sendToFile()
    return {
      reply,
      state,
    }
  }
}

export default SendAskDMRecipient
