import State from '../state'

class ChooseFile {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.CHOOSE_FILE
  }

  shouldExecute() {
    const { userEmail } = this.messageService.getMessageData()

    const userCurrentState = this.messageService.getUserCurrentState({
      userEmail,
    })
    if (userCurrentState === this.state) {
      return true
    }
    return false
  }

  // TODO add more function here as well
  execute() {
    const {
      // argument,
      message,
      userEmail,
      // vGroupID,
    } = this.messageService.getMessageData()

    // const userEmail = this.messageService.getUserEmail()
    // const index = this.messageService.getMessage()
    let reply = null
    let state = State.NONE
    this.messageService.setUserCurrentState({
      currentState: State.NONE,
    }) // change to broacastservice?
    const fileArr = this.sendService.getFiles(userEmail)
    // const length = Math.min(fileArr.length, 5);
    if (
      !this.messageService.isInt() ||
      message < 1 ||
      message > fileArr.length
    ) {
      reply = `Index: ${message} is out of range. Please enter an integer between 1 and ${fileArr.length}`
      state = State.CHOOSE_FILE
      this.messageService.setUserCurrentState({
        currentState: State.CHOOSE_FILE,
      }) // change to broacastservice?
    } else {
      // Subtract one to account for 0 based indexing
      const fileName = fileArr[parseInt(message, 10) - 1]
      // TODO check for errors first!! return from send
      // TODO should the fileName be a variable of sendService??
      this.sendService.sendToFile(fileName)
      this.messageService.setUserCurrentState({
        currentState: State.NONE,
      })
      reply = `Message sent to users from the file: ${fileName}`
    }
    return {
      reply,
      state,
    }
  }
}

export default ChooseFile
