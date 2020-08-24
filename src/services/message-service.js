class MessageService {
  constructor(
    message,
    userEmail,
    argument,
    command,
    currentState,
    vGroupID,
    file,
    filename,
    user
  ) {
    this.message = message
    this.userEmail = userEmail
    this.argument = argument
    this.command = command
    this.currentState = currentState
    this.vGroupID = vGroupID
    this.file = file
    this.filename = filename
    this.user = user
  }

  // TODO why use getters and setters here??
  getMessage() {
    return this.message
  }

  getArgument() {
    return this.argument
  }

  getUserEmail() {
    return this.userEmail
  }

  getVGroupID() {
    return this.vGroupID
  }

  getCommand() {
    return this.command
  }

  getCurrentState() {
    return this.currentState
  }

  setCurrentState({ state }) {
    this.currentState = state
    return this.currentState
  }

  getFile() {
    return this.file
  }

  getFilename() {
    return this.filename
  }

  getUser() {
    return this.user
  }

  affirmativeReply() {
    return (
      this.message.toLowerCase() === 'yes' || this.message.toLowerCase() === 'y'
    )
  }

  negativeReply() {
    return (
      this.message.toLowerCase() === 'no' || this.message.toLowerCase() === 'n'
    )
  }

  isInt() {
    if (!Number.isInteger(+this.message)) {
      return false
    }
    return true
  }

  // static replyWithButtons(message) {
  // const button1 = {
  //   type: 'message',
  //   text: 'Yes',
  //   message: 'yes',
  // }
  // const button2 = {
  //   type: 'message',
  //   text: 'No',
  //   message: 'no',
  // }
  // const buttons = [button1, button2]
  // Send message with buttons here
  // }
}

export default MessageService
