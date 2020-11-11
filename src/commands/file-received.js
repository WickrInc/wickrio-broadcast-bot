import State from '../state'

import { BROADCAST_ENABLED } from '../helpers/constants'
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
    // const file = this.messageService.getFile()
    const filePath = this.messageService.getFilePath()
    const fileName = this.messageService.getFilename()
    console.log({ filePath, fileName })
    // this.fileService.setFile(file)
    this.fileService.setFilePath(filePath)
    this.fileService.setFilename(fileName)
    console.log('BROADCAST_ENABLED' + BROADCAST_ENABLED)
    console.log('BROADCAST_ENABLED value' + BROADCAST_ENABLED.value)
    const broadcastLetterString =
      BROADCAST_ENABLED?.value === 'no' ? '' : '(b)roadcast, '
    const broadcastString =
      BROADCAST_ENABLED.value === 'no' ? '' : 'broadcast this file or '
    const reply = `Would you like to ${broadcastString}send this file to a list? Or is it a file of usernames or hashes? Please respond with ${broadcastLetterString}(s)end, (u)ser, or (h)ash`
    const obj = {
      reply,
      state: State.FILE_TYPE,
    }
    return obj
  }
}

export default FileReceived
