import StatusService from './status-service'
import ButtonHelper from '../helpers/button-helper'
import updateLastID from '../helpers/message-id-helper'
import { logger } from '../helpers/constants'

// TODO reduce magic chars
const dir = `${process.cwd()}/files`

class SendMessageService {
  // TODO rename to sendToUserList
  static sendToFile(apiService, user) {
    const fileName = user.sendfile
    let sentBy = `Broadcast message sent by: ${user.userEmail}`
    let messageToSend = `${sentBy}\n\n${user.message}`

    const flags = []
    if (user.ackFlag) {
      messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
      sentBy = `${sentBy}\n\nPlease acknowledge message by replying with /ack`
    }
    if (user.dmFlag) {
      messageToSend = `${messageToSend}\n\nPlease send a response to ${user.dmRecipient}`
      sentBy = `${sentBy}\n\nPlease send a response to ${user.dmRecipient}`
    }
    const metaString = ButtonHelper.makeRecipientButtons(
      user.ackFlag,
      user.dmFlag,
      user.dmRecipient
    )
    logger.debug('Broadcasting to a file: file=' + fileName)
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // TODO move filePathcreation?
    const userDir = `${dir}/${user.userEmail}/`
    const filePath = userDir + `${fileName}`
    let uMessage
    const messageID = updateLastID()
    if (user.voiceMemo !== undefined && user.voiceMemo !== '') {
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        filePath,
        jsonDateTime,
        `VoiceMemo-${jsonDateTime}`
      )
      if (!fileName.endsWith('hash') && !fileName.endsWith('user')) {
        return 'User file is not in the proper format please upload a .txt file with a return-separated list of users in your network'
      } else if (fileName.endsWith('hash')) {
        uMessage = apiService.sendVoiceMemoUserHashFile(
          filePath,
          user.voiceMemo,
          user.voiceMemoDuration,
          user.ttl,
          user.bor,
          messageID,
          metaString,
          sentBy
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendVoiceMemoUserNameFile(
          filePath,
          user.voiceMemo,
          user.voiceMemoDuration,
          user.ttl,
          user.bor,
          messageID,
          metaString,
          sentBy
        )
      }
    } else if (user.file !== undefined && user.file !== '') {
      console.log({
        messageID,
        email: user.userEmail,
        filePath,
        jsonDateTime,
        file: user.sendfile,
        display: user.display,
      })
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        filePath,
        jsonDateTime,
        user.display
      )
      if (!fileName.endsWith('hash') && !fileName.endsWith('user')) {
        return 'User file is not in the proper format please upload a .txt file with a return-separated list of users in your network'
      } else if (fileName.endsWith('hash')) {
        uMessage = apiService.sendAttachmentUserHashFile(
          filePath,
          user.file,
          user.display,
          user.ttl,
          user.bor,
          messageID,
          metaString,
          sentBy
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendAttachmentUserNameFile(
          filePath,
          user.file,
          user.display,
          user.ttl,
          user.bor,
          messageID,
          metaString,
          sentBy
        )
      }
    } else {
      console.log({
        messageID,
        email: user.userEmail,
        filePath,
        jsonDateTime,
        message: user.message,
      })
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        filePath,
        jsonDateTime,
        user.message
      )
      if (!fileName.endsWith('hash') && !fileName.endsWith('user')) {
        return 'User file is not in the proper format please upload a .txt file with a return-separated list of users in your network'
      } else if (fileName.endsWith('hash')) {
        uMessage = apiService.sendMessageUserHashFile(
          filePath,
          messageToSend,
          user.ttl,
          user.bor,
          messageID,
          flags,
          metaString
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendMessageUserNameFile(
          filePath,
          messageToSend,
          user.ttl,
          user.bor,
          messageID,
          flags,
          metaString
        )
      }
    }
    if (user.vGroupID !== '' && user.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, user.vGroupID, user)
    }
    logger.debug(`Broadcast uMessage${uMessage}`)
    return ''
  }
}

module.exports = SendMessageService
