import State from '../state'

class Ack {
  constructor({ genericService, messageService }) {
    this.messageService = messageService
    this.genericService = genericService
    this.commandString = '/ack'
  }

  shouldExecute() {
    if (this.messageService.getCommand() === this.commandString) {
      return true
    }
    return false
  }

  execute(messageService) {
    this.genericService.setMessageStatus(
      '',
      messageService.getUserEmail(),
      '3',
      ''
    )
    const reply = ''
    const obj = {
      reply,
      state: State.NONE,
    }
    return obj
  }

  // if (command === '/ack') {
  //   const userEmailString = `${userEmail}`
  //   genericService.setMessageStatus('', userEmailString, '3', '')
  //   user.currentState = State.NONE
  //   return
  // }
}

export default Ack
