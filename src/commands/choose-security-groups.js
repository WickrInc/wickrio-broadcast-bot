import State from '../state'

class ChooseSecurityGroups {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.WHICH_GROUPS
  }

  // TODO should this be standard??
  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let reply
    let state
    let messagemeta = {}

    if (this.messageService.getMessage() === 'all') {
      this.broadcastService.setSecurityGroups([])
      reply = 'Would you like to repeat this broadcast message?'
      state = State.ASK_REPEAT
      messagemeta = {
        buttons: [
          {
            type: 'message',
            text: 'yes',
            message: 'yes',
          },
          {
            type: 'message',
            text: 'no',
            message: 'no',
          },
        ],
      }

      return {
        reply,
        state,
        messagemeta,
      }
    }

    const groups = this.messageService.getMessage().split(/[^0-9]/)
    const securityGroupList = this.broadcastService.getAPISecurityGroups()
    let groupsToSend = []
    let groupsString = ''
    let validInput = true
    let badInput = ''
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
      reply = `Your message will send to the following security group(s):\n${groupsString}Continue?`
      this.broadcastService.setSecurityGroups(groupsToSend)
      messagemeta = {
        buttons: [
          {
            type: 'message',
            text: 'yes',
            message: 'yes',
          },
          {
            type: 'message',
            text: 'no',
            message: 'no',
          },
        ],
      }
    } else {
      state = State.WHICH_GROUPS
      reply = `Invalid input: ${badInput} please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.`
      groupsToSend = []
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default ChooseSecurityGroups
