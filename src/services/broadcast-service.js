// import APIService from './api-service'
import StatusService from './status-service'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger } from '../helpers/constants'

class BroadcastService {
  constructor({ messageService, apiService }) {
    this.messageService = messageService
    this.apiService = apiService

    this.file = null
    this.message = null
    this.mail = null
    this.display = null
    this.ackFlag = false
    this.securityGroups = []
    this.duration = 0
    this.voiceMemo = null
    this.repeatFlag = false
    this.vGroupID = null
    this.APISecurityGroups = []
    this.messageServices = []
    this.ttl = null
    this.bor = null
  }

  setRepeatFlag(repeatFlag) {
    this.repeatFlag = repeatFlag
  }

  setFlags(flags) {
    this.flags = flags
  }

  setFile(file) {
    this.file = file
  }

  setVoiceMemo(voiceMemo) {
    this.voiceMemo = voiceMemo
  }

  setDuration(duration) {
    this.duration = duration
  }

  setMessage(message) {
    this.message = message
    console.log({ setMessage: this.message })
  }

  setDisplay(display) {
    this.display = display
  }

  setUserEmail(email) {
    this.userEmail = email
  }

  setSecurityGroups(securityGroups) {
    this.securityGroups = securityGroups
  }

  setUsers(users) {
    this.users = users
  }

  getAPISecurityGroups() {
    this.APISecurityGroups = this.apiService.getSecurityGroups()
    return this.APISecurityGroups
  }

  setAckFlag(ackFlag) {
    this.ackFlag = ackFlag
  }

  setSentByFlag(sentByFlag) {
    this.sentByFlag = sentByFlag
  }

  setVGroupID(vGroupID) {
    this.vGroupID = vGroupID
  }

  setBOR(bor) {
    this.bor = bor
  }

  setTTL(ttl) {
    this.ttl = ttl
  }

  setWebApp() {
    this.webapp = true
  }

  recallBroadcast() {}

  broadcastMessage() {
    // console.log({
    //   file: this.file,
    //   message: this.message,
    //   mail: this.mail,
    //   display: this.display,
    //   ackFlag: this.ackFlag,
    //   securityGroups: this.securityGroups,
    //   duration: this.duration,
    //   voiceMemo: this.voiceMemo,
    //   repeatFlag: this.repeatFlag,
    //   vGroupID: this.vGroupID,
    //   APISecurityGroups: this.APISecurityGroups,
    //   messageServices: this.messageServices,
    //   ttl: this.ttl,
    //   bor: this.bor,
    // })
    let messageToSend
    const sentBy = `Broadcast message sent by: ${this.userEmail}`
    if (this.sentByFlag) {
      messageToSend = `${this.message}\n\n${sentBy}`
    } else {
      messageToSend = this.message
    }

    if (this.ackFlag) {
      if (this.sentByFlag) {
        messageToSend = `${messageToSend}\nPlease acknowledge message by replying with /ack`
      } else {
        messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
      }
    }

    let target
    // if (this.users !== undefined && this.users.length > 0) {
    if (this.users) {
      target = 'USERS'
    } else if (
      this.securityGroups === undefined ||
      this.securityGroups.length < 1
    ) {
      target = 'NETWORK'
    } else {
      target = this.securityGroups.join()
    }

    logger.debug(`target${target}`)
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // messageID must be a string
    // TODO is is necessary to do this.
    const messageID = `${updateLastID()}`
    console.log({ messageID })
    let uMessage
    const reply = {}
    console.log({ messageToSend })
    if (target === 'USERS') {
      if (this.flags === undefined) this.flags = []

      uMessage = this.apiService.send1to1MessageLowPriority(
        this.users,
        messageToSend,
        this.ttl,
        this.bor,
        messageID,
        this.flags
      )
      logger.debug(`send1to1Messge returns=${uMessage}`)
      reply.pending =
        'Broadcast message in process of being sent to list of users'
      reply.rawMessage = this.message
      reply.message = messageToSend
    } else if (target === 'NETWORK') {
      if (this.voiceMemo) {
        // if (this.voiceMemo !== undefined && this.voiceMemo !== '') {
        uMessage = this.apiService.sendNetworkVoiceMemo(
          this.voiceMemo,
          this.duration,
          this.ttl,
          this.bor,
          messageID,
          sentBy
        )
        reply.pending = 'Voice Memo broadcast in process of being sent'
        reply.rawMessage = this.message
        reply.message = messageToSend
        // } else if (this.file !== undefined && this.file !== '') {
      } else if (this.file) {
        uMessage = this.apiService.sendNetworkAttachment(
          this.file,
          this.display,
          this.ttl,
          this.bor,
          messageID,
          sentBy
        )
        reply.pending = 'File broadcast in process of being sent'
        reply.rawMessage = this.message
        reply.message = messageToSend
        //
        // what is this? why webappp?
        //
        if (this.webapp && this.message) {
          uMessage = this.apiService.sendNetworkMessage(
            this.message,
            this.ttl,
            this.bor,
            messageID
          )
        }
      } else {
        uMessage = this.apiService.sendNetworkMessage(
          messageToSend,
          this.ttl,
          this.bor,
          messageID
        )
        reply.pending = 'Broadcast message in process of being sent'
        reply.rawMessage = this.message
        reply.message = messageToSend
      }
      // } else if (this.voiceMemo !== undefined && this.voiceMemo !== '') {
    } else if (this.voiceMemo) {
      uMessage = this.apiService.sendSecurityGroupVoiceMemo(
        this.securityGroups,
        this.voiceMemo,
        this.duration,
        this.ttl,
        this.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'Voice Memo broadcast in process of being sent to security group'
      reply.rawMessage = this.message
      reply.message = messageToSend
      // } else if (this.file !== undefined && this.file !== '') {
    } else if (this.file) {
      uMessage = this.apiService.sendSecurityGroupAttachment(
        this.securityGroups,
        this.file,
        this.display,
        this.ttl,
        this.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'File broadcast in process of being sent to security group'
      reply.rawMessage = this.message
      reply.message = messageToSend
      if (this.webapp && this.message) {
        uMessage = this.apiService.sendSecurityGroupMessage(
          this.securityGroups,
          this.message,
          this.ttl,
          this.bor,
          messageID
        )
      }
    } else {
      uMessage = this.apiService.sendSecurityGroupMessage(
        this.securityGroups,
        messageToSend,
        this.ttl,
        this.bor,
        messageID
      )
      reply.pending =
        'Broadcast message in process of being sent to security group'
      reply.rawMessage = this.message
      reply.message = messageToSend
    }
    // if (this.file !== undefined && this.file !== '') {
    if (this.file) {
      logger.debug(`display:${this.display}:`)
      this.apiService.writeMessageIDDB(
        messageID,
        this.userEmail,
        target,
        jsonDateTime,
        this.display
      )
      // } else if (this.voiceMemo !== undefined && this.voiceMemo !== '') {
    } else if (this.voiceMemo) {
      this.apiService.writeMessageIDDB(
        messageID,
        this.userEmail,
        target,
        jsonDateTime,
        `VoiceMemo-${jsonDateTime}`
      )
    } else {
      this.apiService.writeMessageIDDB(
        messageID,
        this.userEmail,
        target,
        jsonDateTime,
        this.message
      )
    }
    // if (this.vGroupID !== '' && this.vGroupID !== undefined) {
    if (this.vGroupID) {
      StatusService.asyncStatus(messageID, this.vGroupID)
    }
    logger.debug(`Broadcast uMessage=${uMessage}`)
    reply.message_id = messageID
    if (target === 'USERS') {
      reply.users = this.users
    } else {
      reply.securityGroups = this.securityGroups
    }

    this.clearValues()

    return reply
  }

  // TODO check if this.works as expected
  static isInt(value) {
    return !Number.isNaN(value)
  }

  clearValues() {
    this.file = ''
    this.message = ''
    this.userEmail = ''
    this.display = ''
    this.ackFlag = false
    this.securityGroups = []
    this.duration = 0
    this.voiceMemo = ''
    this.repeatFlag = false
    this.vGroupID = ''
    this.APISecurityGroups = []
    this.users = []
    this.ttl = ''
    this.bor = ''
    this.flags = []
  }
}

export default BroadcastService
