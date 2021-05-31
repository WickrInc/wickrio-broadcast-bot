import State from '../state'

import { BROADCAST_ENABLED } from '../helpers/constants'
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
    const filePath = this.messageService.getFilePath()
    const fileName = this.messageService.getFilename()
    this.fileService.setFilePath(filePath)
    this.fileService.setFilename(fileName)
    let buttons = []
    let broadcastLetterString = ''
    let broadcastString = ''
    if (
      BROADCAST_ENABLED?.value === undefined ||
      BROADCAST_ENABLED?.value === 'yes'
    ) {
      broadcastLetterString = '(b)roadcast'
      broadcastString = 'broadcast this file or '
      buttons = [
        {
          type: 'message',
          text: 'Broadcast',
          message: 'Broadcast',
        },
      ]
    }
    const reply = `Would you like to ${broadcastString}send this file to a list? Or is it a file of usernames or hashes? Please respond with ${broadcastLetterString}(s)end, (u)ser, or (h)ash`
    const buttonsConcat = [
      {
        type: 'message',
        text: 'Send',
        message: 'Send',
      },
      {
        type: 'message',
        text: 'User',
        message: 'User',
      },
      {
        type: 'message',
        text: 'Hash',
        message: 'Hash',
      },
    ]
    buttons = buttons.concat(buttonsConcat)
    const messagemeta = {
      buttons,
    }
    return {
      reply,
      state: State.FILE_TYPE,
      messagemeta,
    }
  }
}

export default FileReceived
