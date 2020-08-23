import State from '../state'

import { WickrIOAPI } from '../helpers/constants'

// TODO use this instead of putting it in main!
class Messages {
  constructor({ messageService }) {
    this.messageService = messageService
  }

  static shouldExecute() {
    if (this.messageService.getCommand() === '/messages') {
      return true
    }
    return false
  }

  static execute() {
    const reply = ''
    const path = `${process.cwd()}/attachments/messages.txt`
    WickrIOAPI.cmdSendRoomAttachment(this.messageService.vGroupID, path, path)
    const obj = {
      reply,
      state: State.NONE,
    }
    return obj
  }
}

module.exports = Messages
