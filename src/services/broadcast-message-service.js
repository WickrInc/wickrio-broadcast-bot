import StatusService from './status-service'
import ButtonHelper from '../helpers/button-helper'
import updateLastID from '../helpers/message-id-helper'
import { logger } from '../helpers/constants'

class BroadcastMessageService {
  static broadcastMessage(apiService, user) {
    // console.log({
    //   file: user.file,
    //   message: user.message,
    //   mail: user.mail,
    //   display: user.display,
    //   ackFlag: user.ackFlag,
    //   securityGroups: user.securityGroups,
    //   voiceMemoDuration: user.voiceMemoDuration,
    //   voiceMemo: user.voiceMemo,
    //   repeatFlag: user.repeatFlag,
    //   vGroupID: user.vGroupID,
    //   APISecurityGroups: user.APISecurityGroups,
    //   messageServices: user.messageServices,
    //   ttl: user.ttl,
    //   bor: user.bor,
    // })
    let sentBy = `Broadcast message sent by: ${user.userEmail}`
    let messageToSend = user.message

    // TODO when is sentByFlag false??
    if (user.sentByFlag) {
      messageToSend = `${sentBy}\n\n${user.message}`
    }
    if (user.ackFlag) {
      sentBy = `${sentBy}\n\nPlease acknowledge message by replying with /ack`
      messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
    }
    if (user.dmFlag) {
      sentBy = `${sentBy}\n\nPlease send a response to ${user.dmRecipient}`
      messageToSend = `${messageToSend}\n\nPlease send a response to ${user.dmRecipient}`
    }

    let target
    if (user.users !== undefined && user.users.length !== 0) {
      target = 'USERS'
    } else if (
      user.securityGroups === undefined ||
      user.securityGroups.length < 1
    ) {
      target = 'NETWORK'
    } else {
      target = user.securityGroups.join()
    }

    logger.debug(`target${target}`)
    const currentDate = new Date()
    const jsonDateTime = currentDate.toJSON()
    // messageID must be a string
    // TODO is is necessary to do user.
    const messageID = `${updateLastID()}`
    let uMessage
    const reply = {}
    const flags = []
    const metaString = ButtonHelper.makeRecipientButtons(
      user.ackFlag,
      user.dmFlag,
      user.dmRecipient
    )
    // if (user.file !== undefined && user.file !== '') {
    if (user.file) {
      logger.debug(`display:${user.display}:`)
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        target,
        jsonDateTime,
        user.display
      )
      // } else if (user.voiceMemo !== undefined && user.voiceMemo !== '') {
    } else if (user.voiceMemo) {
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        target,
        jsonDateTime,
        `VoiceMemo-${jsonDateTime}`
      )
    } else {
      apiService.writeMessageIDDB(
        messageID,
        user.userEmail,
        target,
        jsonDateTime,
        user.message
      )
    }
    if (target === 'USERS') {
      if (user.flags === undefined) user.flags = []

      uMessage = apiService.send1to1MessageLowPriority(
        user.users,
        messageToSend,
        user.ttl,
        user.bor,
        messageID,
        user.flags,
        metaString
      )
      logger.debug(`send1to1Messge returns=${uMessage}`)
      reply.pending =
        'Broadcast message in process of being sent to list of users'
      reply.rawMessage = user.message
      reply.message = messageToSend
    } else if (target === 'NETWORK') {
      if (user.voiceMemo) {
        uMessage = apiService.sendNetworkVoiceMemo(
          user.voiceMemo,
          user.voiceMemoDuration,
          user.ttl,
          user.bor,
          messageID,
          sentBy,
          metaString
        )
        reply.pending = 'Voice Memo broadcast in process of being sent'
        reply.rawMessage = user.message
        reply.message = messageToSend
      } else if (user.file) {
        uMessage = apiService.sendNetworkAttachment(
          user.file,
          user.display,
          user.ttl,
          user.bor,
          messageID,
          sentBy,
          metaString
        )
        reply.pending = 'File broadcast in process of being sent'
        reply.rawMessage = user.message
        reply.message = messageToSend
        //
        // what is this? why webappp?
        //
        if (user.webapp && user.message) {
          console.log('from webapp')
          uMessage = apiService.sendNetworkMessage(
            user.message,
            user.ttl,
            user.bor,
            messageID,
            flags,
            metaString
          )
        }
      } else {
        uMessage = apiService.sendNetworkMessage(
          messageToSend,
          user.ttl,
          user.bor,
          messageID,
          flags,
          metaString
        )
        reply.pending = 'Broadcast message in process of being sent'
        reply.rawMessage = user.message
        reply.message = messageToSend
      }
    } else if (user.voiceMemo) {
      uMessage = apiService.sendSecurityGroupVoiceMemo(
        user.securityGroups,
        user.voiceMemo,
        user.voiceMemoDuration,
        user.ttl,
        user.bor,
        messageID,
        sentBy,
        metaString
      )
      reply.pending =
        'Voice Memo broadcast in process of being sent to security group'
      reply.rawMessage = user.message
      reply.message = messageToSend
    } else if (user.file) {
      uMessage = apiService.sendSecurityGroupAttachment(
        user.securityGroups,
        user.file,
        user.display,
        user.ttl,
        user.bor,
        messageID,
        sentBy,
        metaString
      )
      reply.pending =
        'File broadcast in process of being sent to security group'
      reply.rawMessage = user.message
      reply.message = messageToSend
      if (user.webapp && user.message) {
        console.log('webapp sec group')
        uMessage = apiService.sendSecurityGroupMessage(
          user.securityGroups,
          user.message,
          user.ttl,
          user.bor,
          messageID,
          flags,
          metaString
        )
      }
    } else {
      uMessage = apiService.sendSecurityGroupMessage(
        user.securityGroups,
        messageToSend,
        user.ttl,
        user.bor,
        messageID,
        flags,
        metaString
      )
      reply.pending =
        'Broadcast message in process of being sent to security group'
      reply.rawMessage = user.message
      reply.message = messageToSend
    }
    if (user.vGroupID !== '' && user.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, user.vGroupID, user)
    }
    logger.debug(`Broadcast uMessage=${uMessage}`)
    reply.message_id = messageID
    if (target === 'USERS') {
      reply.users = user.users
    } else {
      reply.securityGroups = user.securityGroups
    }
    return reply
  }
}

module.exports = BroadcastMessageService
