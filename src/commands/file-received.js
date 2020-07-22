import State from '../state'

// TODO add a delete file command??
class FileReceived {
  constructor(fileService) {
    this.fileService = fileService
  }

  shouldExecute(messageService) {
    // const file = messageService.getFile();
    if (
      messageService.getFile() !== 'undefined' &&
      messageService.getFile().length !== 0 &&
      messageService.getFile() !== ''
    ) {
      return true
    }
    return false
  }

  execute(messageService) {
    this.fileService.setFile(messageService.getFile())
    this.fileService.setFilename(messageService.getFilename())
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
