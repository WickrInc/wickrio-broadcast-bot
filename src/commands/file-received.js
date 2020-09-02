import State from '../state'

// TODO add a delete file command??
class FileReceived {
  constructor({ fileService, messageService }) {
    this.fileService = fileService
    this.messageService = messageService
  }

  shouldExecute() {
    const file = this.messageService.getFile()
    // if (file && file !== 'undefined' && file.length !== 0 && file !== '') {
    if (file) {
      return true
    }
    return false
  }

  execute() {
    this.fileService.setFile(this.messageService.getFile())
    this.fileService.setFilename(this.messageService.getFilename())
    const reply =
      'Would you like to broadcast this file, send this file to a list, or is it a file of usernames or hashes? Please respond with (b)roadcast, (s)end, (u)ser, or (h)ash'
    const obj = {
      reply,
      state: State.FILE_TYPE,
    }
    return obj
  }
}

export default FileReceived
