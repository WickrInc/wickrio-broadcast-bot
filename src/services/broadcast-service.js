import APIService from './api-service'
import StatusService from './status-service'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger } from '../helpers/constants'

class BroadcastService {
  constructor({ messageService }) {
    this.messageService = messageService
    this.broadcast = this.messageService
    // this.file = '';
    // this.message = '';
    // this.mail = '';
    // this.display = '';
    // this.ackFlag = false;
    // this.securityGroups = [];
    // this.duration = 0;
    // this.voiceMemo = '';
    // this.repeatFlag = false;
    // this.vGroupID = '';
    // this.APISecurityGroups = [];
    // this.messageServices = [];
    // this.ttl = '';
    // this.bor = '';
  }

  setRepeatFlag(repeatFlag) {
    this.broadcast.repeatFlag = repeatFlag
  }

  setFlags(flags) {
    this.broadcast.flags = flags
  }

  setFile(file) {
    this.broadcast.file = file
  }

  setVoiceMemo(voiceMemo) {
    this.broadcast.voiceMemo = voiceMemo
  }

  setDuration(duration) {
    this.broadcast.duration = duration
  }

  setMessage(message) {
    this.broadcast.message = message
  }

  setDisplay(display) {
    this.broadcast.display = display
  }

  setUserEmail(email) {
    this.broadcast.userEmail = email
  }

  setSecurityGroups(securityGroups) {
    this.broadcast.securityGroups = securityGroups
  }

  setUsers(users) {
    this.broadcast.users = users
  }

  getAPISecurityGroups() {
    this.broadcast.APISecurityGroups = APIService.getSecurityGroups()
    return this.broadcast.APISecurityGroups
  }

  setAckFlag(ackFlag) {
    this.broadcast.ackFlag = ackFlag
  }

  setSentByFlag(sentByFlag) {
    this.broadcast.sentByFlag = sentByFlag
  }

  setVGroupID(vGroupID) {
    this.broadcast.vGroupID = vGroupID
  }

  setBOR(bor) {
    this.broadcast.bor = bor
  }

  setTTL(ttl) {
    this.broadcast.ttl = ttl
  }

  setWebApp() {
    this.broadcast.webapp = true
  }

  broadcastMessage() {
    let messageToSend
    const sentBy = `Broadcast message sent by: ${this.broadcast.userEmail}`
    if (this.broadcast.sentByFlag) {
      messageToSend = `${this.broadcast.message}\n\n${sentBy}`
    } else {
      messageToSend = this.broadcast.message
    }

    if (this.broadcast.ackFlag) {
      if (this.broadcast.sentByFlag) {
        messageToSend = `${messageToSend}\nPlease acknowledge message by replying with /ack`
      } else {
        messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
      }
    }
    // TODO what is users vs network?
    let target
    if (this.broadcast.users !== undefined && this.broadcast.users.length > 0) {
      target = 'USERS'
    } else if (
      this.broadcast.securityGroups === undefined ||
      this.broadcast.securityGroups.length < 1
    ) {
      target = 'NETWORK'
    } else {
      target = this.broadcast.securityGroups.join()
    }

    logger.debug(`target${target}`)
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // messageID must be a string
    // TODO is is necessary to do this.broadcast.
    const messageID = `${updateLastID()}`
    console.log({ messageID })
    let uMessage
    const reply = {}
    if (target === 'USERS') {
      if (this.broadcast.flags === undefined) this.broadcast.flags = []

      uMessage = APIService.send1to1MessageLowPriority(
        this.broadcast.users,
        messageToSend,
        this.broadcast.ttl,
        this.broadcast.bor,
        messageID,
        this.broadcast.flags
      )
      logger.debug(`send1to1Messge returns=${uMessage}`)
      reply.pending =
        'Broadcast message in process of being sent to list of users'
      reply.rawMessage = this.broadcast.message
      reply.message = messageToSend
    } else if (target === 'NETWORK') {
      if (
        this.broadcast.voiceMemo !== undefined &&
        this.broadcast.voiceMemo !== ''
      ) {
        uMessage = APIService.sendNetworkVoiceMemo(
          this.broadcast.voiceMemo,
          this.broadcast.duration,
          this.broadcast.ttl,
          this.broadcast.bor,
          messageID,
          sentBy
        )
        reply.pending = 'Voice Memo broadcast in process of being sent'
        reply.rawMessage = this.broadcast.message
        reply.message = messageToSend
      } else if (
        this.broadcast.file !== undefined &&
        this.broadcast.file !== ''
      ) {
        uMessage = APIService.sendNetworkAttachment(
          this.broadcast.file,
          this.broadcast.display,
          this.broadcast.ttl,
          this.broadcast.bor,
          messageID,
          sentBy
        )
        reply.pending = 'File broadcast in process of being sent'
        reply.rawMessage = this.broadcast.message
        reply.message = messageToSend
        if (this.broadcast.webapp && this.broadcast.message) {
          uMessage = APIService.sendNetworkMessage(
            this.broadcast.message,
            this.broadcast.ttl,
            this.broadcast.bor,
            messageID
          )
        }
      } else {
        uMessage = APIService.sendNetworkMessage(
          messageToSend,
          this.broadcast.ttl,
          this.broadcast.bor,
          messageID
        )
        reply.pending = 'Broadcast message in process of being sent'
        reply.rawMessage = this.broadcast.message
        reply.message = messageToSend
      }
    } else if (
      this.broadcast.voiceMemo !== undefined &&
      this.broadcast.voiceMemo !== ''
    ) {
      uMessage = APIService.sendSecurityGroupVoiceMemo(
        this.broadcast.securityGroups,
        this.broadcast.voiceMemo,
        this.broadcast.duration,
        this.broadcast.ttl,
        this.broadcast.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'Voice Memo broadcast in process of being sent to security group'
      reply.rawMessage = this.broadcast.message
      reply.message = messageToSend
    } else if (
      this.broadcast.file !== undefined &&
      this.broadcast.file !== ''
    ) {
      uMessage = APIService.sendSecurityGroupAttachment(
        this.broadcast.securityGroups,
        this.broadcast.file,
        this.broadcast.display,
        this.broadcast.ttl,
        this.broadcast.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'File broadcast in process of being sent to security group'
      reply.rawMessage = this.broadcast.message
      reply.message = messageToSend
      if (this.broadcast.webapp && this.broadcast.message) {
        uMessage = APIService.sendSecurityGroupMessage(
          this.broadcast.securityGroups,
          this.broadcast.message,
          this.broadcast.ttl,
          this.broadcast.bor,
          messageID
        )
      }
    } else {
      uMessage = APIService.sendSecurityGroupMessage(
        this.broadcast.securityGroups,
        messageToSend,
        this.broadcast.ttl,
        this.broadcast.bor,
        messageID
      )
      reply.pending =
        'Broadcast message in process of being sent to security group'
      reply.rawMessage = this.broadcast.message
      reply.message = messageToSend
    }
    if (this.broadcast.file !== undefined && this.broadcast.file !== '') {
      logger.debug(`display:${this.broadcast.display}:`)
      APIService.writeMessageIDDB(
        messageID,
        this.broadcast.userEmail,
        target,
        jsonDateTime,
        this.broadcast.display
      )
    } else if (
      this.broadcast.voiceMemo !== undefined &&
      this.broadcast.voiceMemo !== ''
    ) {
      APIService.writeMessageIDDB(
        messageID,
        this.broadcast.userEmail,
        target,
        jsonDateTime,
        `VoiceMemo-${jsonDateTime}`
      )
    } else {
      APIService.writeMessageIDDB(
        messageID,
        this.broadcast.userEmail,
        target,
        jsonDateTime,
        this.broadcast.message
      )
    }
    if (
      this.broadcast.vGroupID !== '' &&
      this.broadcast.vGroupID !== undefined
    ) {
      StatusService.asyncStatus(messageID, this.broadcast.vGroupID)
    }
    logger.debug(`Broadcast uMessage=${uMessage}`)
    reply.message_id = messageID
    if (target === 'USERS') {
      reply.users = this.broadcast.users
    } else {
      reply.securityGroups = this.broadcast.securityGroups
    }

    this.clearValues()

    return reply
  }

  // TODO check if this.broadcast.works as expected
  static isInt(value) {
    return !Number.isNaN(value)
  }

  clearValues() {
    this.broadcast.file = ''
    this.broadcast.message = ''
    this.broadcast.userEmail = ''
    this.broadcast.display = ''
    this.broadcast.ackFlag = false
    this.broadcast.securityGroups = []
    this.broadcast.duration = 0
    this.broadcast.voiceMemo = ''
    this.broadcast.repeatFlag = false
    this.broadcast.vGroupID = ''
    this.broadcast.APISecurityGroups = []
    this.broadcast.users = []
    this.broadcast.ttl = ''
    this.broadcast.bor = ''
    this.broadcast.flags = []
  }
}

export default BroadcastService
