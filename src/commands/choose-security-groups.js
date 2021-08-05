import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class ChooseSecurityGroups {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.WHICH_GROUPS
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

    const groups = this.messageService.getMessage().split(/[^0-9]/)
    const securityGroupList = this.broadcastService.getAPISecurityGroups()
    let groupsToSend = []
    let groupsString = ''
    let validInput = true
    let badInput = ''
    if (this.messageService.getMessage().toLowerCase() === 'all') {
      this.broadcastService.setSecurityGroups([])
      reply =
        'Your message will be sent to everyone in the network.\nDo you want to continue?'
      state = State.CONFIRM_GROUPS
      messagemeta = ButtonHelper.makeYesNoButton()
    } else {
      groups.forEach(group => {
        // TODO check for NaN
        // Subtract one for zero based indexing
        const index = parseInt(group, 10) - 1
        if (index >= 0 && index < securityGroupList.length) {
          groupsToSend.push(securityGroupList[index].id)
          groupsString += `${securityGroupList[index].name}\n`
        } else {
          validInput = false
          badInput = index
        }
      })
      if (validInput) {
        state = State.CONFIRM_GROUPS
        reply = `Your message will send to the following security group(s):\n${groupsString}Do you want to continue?`
        this.broadcastService.setSecurityGroups(groupsToSend)
        messagemeta = ButtonHelper.makeYesNoButton()
      } else {
        state = State.WHICH_GROUPS
        reply = `Invalid input: ${badInput} please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.`
        groupsToSend = []
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default ChooseSecurityGroups
