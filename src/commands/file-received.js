import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

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
      broadcastLetterString = '(b)roadcast, '
      broadcastString = 'broadcast this file or '
      buttons = ['Broadcast']
    }
    const reply = `Would you like to ${broadcastString}send this file to a list? Or is it a file of usernames or hashes? Please respond with ${broadcastLetterString}(s)end, (u)ser`
    const buttonsConcat = ['Send', 'User']
    buttons = buttons.concat(buttonsConcat)
    const messagemeta = ButtonHelper.makeCancelButtons(buttons)
    return {
      reply,
      state: State.FILE_TYPE,
      messagemeta,
    }
  }
}

export default FileReceived
