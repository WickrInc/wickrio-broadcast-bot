import State from '../state'

import { WickrIOAPI } from './helpers/constants'

// TODO use this instead of putting it in main!
class Messages {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/messages') {
      return true
    }
    return false
  }

  static execute(messageService) {
    const reply = ''
    const path = `${process.cwd()}/attachments/messages.txt`
    WickrIOAPI.cmdSendRoomAttachment(messageService.vGroupID, path, path)
    const obj = {
      reply,
      state: State.NONE,
    }
    return obj
  }
}

module.exports = Messages
