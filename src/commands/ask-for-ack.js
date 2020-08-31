import State from '../state'

class AskForAck {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.ASK_FOR_ACK
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
    let state
    let reply
    if (this.messageService.affirmativeReply()) {
      this.broadcastService.setAckFlag(true)
    } else if (this.messageService.negativeReply()) {
      this.broadcastService.setAckFlag(false)
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = State.ASK_FOR_ACK

      return {
        reply,
        state,
      }
    }

    const securityGroupList = this.broadcastService.getAPISecurityGroups()
    let groupsString = ''
    for (let i = 0; i < securityGroupList.length; i += 1) {
      // Check if the securityGroup has a size
      if (securityGroupList[i].size === undefined) {
        groupsString = `${groupsString}(${i + 1}) ${
          securityGroupList[i].name
        }\n`
      } else {
        groupsString = `${groupsString}(${i + 1}) ${
          securityGroupList[i].name
        } (users: ${securityGroupList[i].size})\n`
      }
    }
    reply = `${
      'Who would you like to receive this message?\n\n' +
      'Here is a list of the security groups:\n'
    }${groupsString}Please enter the number(s) of the security group(s) you would like to send your message to.\n\nOr reply *all* to send the message to everyone in the network`
    return {
      reply,
      state: State.WHICH_GROUPS,
    }
  }
}

export default AskForAck
