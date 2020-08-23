import State from '../state'
import FileHandler from '../helpers/file-handler'

// This class is used to delete the selected file.

class WhichDelete {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.DELETE_FILE
  }

  shouldExecute() {
    if (this.messageService.getCurrentState() === this.state) {
      return true
    }
    return false
  }

  execute() {
    const userEmail = this.messageService.getUserEmail()
    const index = this.messageService.getMessage()
    let reply = null
    let state = State.NONE
    const fileArr = this.sendService.getFiles(userEmail)
    // const length = Math.min(fileArr.length, 5);
    if (!this.messageService.isInt() || index < 1 || index > fileArr.length) {
      reply = `Index: ${index} is out of range. Please enter an integer between 1 and ${fileArr.length}`
      state = State.DELETE_FILE
    } else {
      // Subtract one to account for 0 based indexing
      const fileName = fileArr[parseInt(index, 10) - 1]
      const filePath = `${process.cwd()}/files/${userEmail}/${fileName}`
      if (FileHandler.deleteFile(filePath)) {
        reply = `${fileName} was deleted.`
      } else {
        reply = `Error: unable to delete ${fileName}`
      }
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichDelete
