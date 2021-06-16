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
    // TODO could remove the /broadcast check if done right
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.WHICH_GROUPS
    let reply = this.broadcastService.getSecurityGroups()
    let messagemeta
    const userID = this.messageService.message
    if (userID.toLowerCase() === 'next') {
      this.broadcastService.setDMFlag(false)
    } else {
      const userInfo = this.apiService.getUserInfo([userID])
      const failed = userInfo.failed
      if (failed !== undefined && userInfo.failed.length !== 0) {
        reply = `The user: ${userID} does not exist in your network. Type in the username of the Wickr user to whom you want to direct these responses. Or type Next to skip this step. Or type /cancel to cancel flow`
        state = State.ASK_DM_RECIPIENT
        messagemeta = ButtonHelper.makeCancelButtons(['Next'])
      } else {
        this.broadcastService.setDMFlag(true)
        this.broadcastService.setDMRecipient(userID)
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default AskDMRecipient
