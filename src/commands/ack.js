import State from '../state'

class Ack {
  constructor(genericService) {
    this.genericService = genericService
    this.commandString = '/ack'
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
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
}

export default Ack
