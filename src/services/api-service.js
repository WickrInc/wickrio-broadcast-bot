// TODO what's the correct format here?
import { WickrIOAPI } from '../helpers/constants'

class APIService {
  getSecurityGroups() {
    const groupData = WickrIOAPI.cmdGetSecurityGroups()
    const temp = JSON.parse(groupData)
    // return JSON.parse(groupData);
    return temp
  }

  sendSecurityGroupVoiceMemo(
    securityGroups,
    voiceMemo,
    duration,
    ttl,
    bor,
    messageID,
    sentBy
  ) {
    // TODO add time sent to VoiceMemo String?
    return WickrIOAPI.cmdSendSecurityGroupVoiceMemo(
      securityGroups,
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendSecurityGroupAttachment(
    securityGroups,
    filename,
    displayName,
    ttl,
    bor,
    messageID,
    sentBy
  ) {
    return WickrIOAPI.cmdSendSecurityGroupAttachment(
      securityGroups,
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendSecurityGroupMessage(securityGroups, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendSecurityGroupMessage(
      message,
      securityGroups,
      ttl,
      bor,
      messageID
    )
  }

  sendNetworkVoiceMemo(voiceMemo, duration, ttl, bor, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkVoiceMemo(
      voiceMemo,
      'VoiceMemo',
      duration,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendNetworkAttachment(filename, displayName, ttl, bor, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkAttachment(
      filename,
      displayName,
      ttl,
      bor,
      messageID,
      sentBy
    )
  }

  sendNetworkMessage(message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendNetworkMessage(message, ttl, bor, messageID)
  }

  writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    return WickrIOAPI.cmdAddMessageID(
      messageId,
      sender,
      target,
      dateSent,
      messageContent
    )
  }

  getMessageStatus(messageID, type, page, pageSize) {
    try {
      return WickrIOAPI.cmdGetMessageStatus(messageID, type, page, pageSize)
    } catch (err) {
      return err
    }
  }

  getMessageStatusFiltered(messageID, type, page, pageSize, filter, users) {
    try {
      return WickrIOAPI.cmdGetMessageStatus(
        messageID,
        type,
        page,
        pageSize,
        filter,
        users
      )
    } catch (err) {
      return undefined
    }
  }

  getMessageIDEntry(messageID) {
    try {
      return WickrIOAPI.cmdGetMessageIDEntry(messageID)
    } catch (err) {
      return undefined
    }
  }

  getMessageIDTable(page, size, sender) {
    return WickrIOAPI.cmdGetMessageIDTable(page, size, sender)
  }

  sendRoomMessage(vGroupID, message) {
    return WickrIOAPI.cmdSendRoomMessage(vGroupID, message)
  }

  sendRoomAttachment(vGroupID, attachment, display) {
    return WickrIOAPI.cmdSendRoomAttachment(vGroupID, attachment, display)
  }

  sendMessageUserHashFile(filePath, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendMessageUserHashFile(
      filePath,
      message,
      ttl,
      bor,
      messageID
    )
  }

  sendMessageUserNameFile(filePath, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendMessageUserNameFile(
      filePath,
      message,
      ttl,
      bor,
      messageID
    )
  }

  sendAttachmentUserHashFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID
  ) {
    return WickrIOAPI.cmdSendAttachmentUserHashFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID
    )
  }

  sendAttachmentUserNameFile(
    filePath,
    attachment,
    display,
    ttl,
    bor,
    messageID
  ) {
    return WickrIOAPI.cmdSendAttachmentUserNameFile(
      filePath,
      attachment,
      display,
      ttl,
      bor,
      messageID
    )
  }

  setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    return WickrIOAPI.cmdSetMessageStatus(
      messageID,
      userID,
      statusNumber,
      statusMessage
    )
  }

  send1to1Message(userArray, reply, ttl, bor, messageID) {
    return WickrIOAPI.cmdSend1to1Message(userArray, reply, ttl, bor, messageID)
  }

  send1to1MessageLowPriority(userArray, reply, ttl, bor, messageID, flags) {
    const buttons = []
    return WickrIOAPI.cmdSend1to1Message(
      userArray,
      reply,
      ttl,
      bor,
      messageID,
      flags,
      buttons,
      true
    )
  }

  cancelMessageID(messageID) {
    return WickrIOAPI.cmdCancelMessageID(messageID)
  }

  setEventCallback(callbackUrl) {
    return WickrIOAPI.cmdSetEventCallback(callbackUrl)
  }

  getEventCallback() {
    return WickrIOAPI.cmdGetEventCallback()
  }

  deleteEventCallback() {
    return WickrIOAPI.cmdDeleteEventCallback()
  }
}

export default APIService
