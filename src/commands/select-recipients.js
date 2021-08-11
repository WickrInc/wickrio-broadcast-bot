import State from '../state'
import SetupService from '../services/setup-service'
import ButtonHelper from '../helpers/button-helper.js'

class SelectRecipients {
  constructor({ broadcastService, sendService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.sendService = sendService
    this.state = State.SELECT_RECIPIENTS
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let reply
    let state
    let messagemeta = {}
    const message = this.messageService.getMessage()
    const userEmail = this.messageService.getUserEmail()
    if (
      (message.toLowerCase() === 'security group' ||
        message.toLowerCase() === 's') &&
      this.broadcastService.getBroadcastEnabled()
    ) {
      reply = this.broadcastService.getSecurityGroupReply()
      state = State.WHICH_GROUPS
    } else if (
      message.toLowerCase() === 'user file' ||
      message.toLowerCase() === 'u'
    ) {
      const sendObj = this.sendService.getFilesForSending(
        this.messageService.getUserEmail()
      )
      state = State.CHOOSE_FILE
      reply = sendObj.reply
      messagemeta = sendObj.messagemeta
    } else if (
      (message.toLowerCase() === 'all' || message.toLowerCase() === 'a') &&
      this.broadcastService.getBroadcastEnabled()
    ) {
      this.broadcastService.setSecurityGroups([])
      reply =
        'Your message will be sent to everyone in the network.\nDo you want to continue?'
      state = State.CONFIRM_GROUPS
      messagemeta = ButtonHelper.makeYesNoButton(0)
    } else {
      const retObj = SetupService.getStartReply(userEmail)
      reply = retObj.reply
      messagemeta = retObj.messagemeta
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default SelectRecipients
