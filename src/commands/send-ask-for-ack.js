import State from '../state'

class SendAskForAck {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.SEND_ASK_FOR_ACK
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
    let state = State.NONE
    let reply
    let messagemeta = {}

    if (this.messageService.affirmativeReply()) {
      this.sendService.setAckFlag(true)
    } else if (this.messageService.negativeReply()) {
      this.sendService.setAckFlag(false)
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = State.SEND_ASK_FOR_ACK
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
          }
        ],
      }

      return {
        reply,
        state,
        messagemeta,
      }
    }

    reply =
      `Message sent to users from the file: ` + this.sendService.getSendFile()

    // TODO check for errors first!! return from send
    // TODO should the fileName be a variable of sendService??
    this.sendService.sendToFile()
    return {
      reply,
      state,
    }
  }
}

export default SendAskForAck
