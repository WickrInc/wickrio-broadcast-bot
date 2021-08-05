import State from '../state'

class Ack {
  constructor({ genericService, messageService }) {
    this.messageService = messageService
    this.genericService = genericService
    this.commandString = '/ack'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    this.genericService.setMessageStatus(
      '',
      this.messageService.userEmail,
      '3',
      ''
    )
    const reply = ''
    return {
      reply,
      state: State.NONE,
    }
  }

  // if (command === '/ack') {
  //   const userEmailString = `${userEmail}`
  //   genericService.setMessageStatus('', userEmailString, '3', '')
  //   user.currentState = State.NONE
  //   return
  // }
}

module.exports = Ack
