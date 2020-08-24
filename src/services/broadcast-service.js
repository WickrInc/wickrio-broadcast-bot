// import APIService from './api-service'
// import StatusService from './status-service'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger } from '../helpers/constants'

class BroadcastService {
  constructor({ messageService, apiService, user }) {
    this.messageService = messageService
    this.apiService = apiService
    this.user = messageService.user
    // this.user.file = null
    // this.user.message = null
    // this.user.mail = null
    // this.user.display = null
    // this.user.ackFlag = false
    // this.user.securityGroups = []
    // this.user.duration = 0
    // this.user.voiceMemo = null
    // this.user.repeatFlag = false
    // this.user.vGroupID = null
    // this.user.APISecurityGroups = []
    // this.user.messageServices = []
    // this.user.ttl = null
    // this.user.bor = null
  }

  setRepeatFlag(repeatFlag) {
    this.user.repeatFlag = repeatFlag
  }

  setFlags(flags) {
    this.user.flags = flags
  }

  setFile(file) {
    this.user.file = file
  }

  setVoiceMemo(voiceMemo) {
    this.user.voiceMemo = voiceMemo
  }

  setDuration(duration) {
    this.user.duration = duration
  }

  setMessage(message) {
    this.user.message = message
    console.log({ setMessage: this.user.message })
  }

  setDisplay(display) {
    this.user.display = display
  }

  setUserEmail(email) {
    this.user.userEmail = email
  }

  setSecurityGroups(securityGroups) {
    this.user.securityGroups = securityGroups
  }

  setUsers(users) {
    this.user.users = users
  }

  getAPISecurityGroups() {
    this.user.APISecurityGroups = this.apiService.getSecurityGroups()
    return this.user.APISecurityGroups
  }

  setAckFlag(ackFlag) {
    this.user.ackFlag = ackFlag
  }

  setSentByFlag(sentByFlag) {
    this.user.sentByFlag = sentByFlag
  }

  setVGroupID(vGroupID) {
    this.user.vGroupID = vGroupID
  }

  setBOR(bor) {
    this.user.bor = bor
  }

  setTTL(ttl) {
    this.user.ttl = ttl
  }

  setWebApp() {
    this.user.webapp = true
  }

  recallBroadcast() {}

  broadcastMessage() {
    // console.log({
    //   file: this.user.file,
    //   message: this.user.message,
    //   mail: this.user.mail,
    //   display: this.user.display,
    //   ackFlag: this.user.ackFlag,
    //   securityGroups: this.user.securityGroups,
    //   duration: this.user.duration,
    //   voiceMemo: this.user.voiceMemo,
    //   repeatFlag: this.user.repeatFlag,
    //   vGroupID: this.user.vGroupID,
    //   APISecurityGroups: this.user.APISecurityGroups,
    //   messageServices: this.user.messageServices,
    //   ttl: this.user.ttl,
    //   bor: this.user.bor,
    // })
    let messageToSend
    const sentBy = `Broadcast message sent by: ${this.user.userEmail}`
    if (this.user.sentByFlag) {
      messageToSend = `${this.user.message}\n\n${sentBy}`
    } else {
      messageToSend = this.user.message
    }

    if (this.user.ackFlag) {
      if (this.user.sentByFlag) {
        messageToSend = `${messageToSend}\nPlease acknowledge message by replying with /ack`
      } else {
        messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
      }
    }

    let target
    // if (this.user.users !== undefined && this.user.users.length > 0) {
    if (this.user.users) {
      target = 'USERS'
    } else if (
      this.user.securityGroups === undefined ||
      this.user.securityGroups.length < 1
    ) {
      target = 'NETWORK'
    } else {
      target = this.user.securityGroups.join()
    }

    logger.debug(`target${target}`)
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // messageID must be a string
    // TODO is is necessary to do this.user.
    const messageID = `${updateLastID()}`
    console.log({ messageID })
    let uMessage
    const reply = {}
    console.log({ messageToSend })
    if (target === 'USERS') {
      if (this.user.flags === undefined) this.user.flags = []

      uMessage = this.apiService.send1to1MessageLowPriority(
        this.user.users,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID,
        this.user.flags
      )
      logger.debug(`send1to1Messge returns=${uMessage}`)
      reply.pending =
        'Broadcast message in process of being sent to list of users'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
    } else if (target === 'NETWORK') {
      if (this.user.voiceMemo) {
        // if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
        uMessage = this.apiService.sendNetworkVoiceMemo(
          this.user.voiceMemo,
          this.user.duration,
          this.user.ttl,
          this.user.bor,
          messageID,
          sentBy
        )
        reply.pending = 'Voice Memo broadcast in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
        // } else if (this.user.file !== undefined && this.user.file !== '') {
      } else if (this.user.file) {
        uMessage = this.apiService.sendNetworkAttachment(
          this.user.file,
          this.user.display,
          this.user.ttl,
          this.user.bor,
          messageID,
          sentBy
        )
        reply.pending = 'File broadcast in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
        //
        // what is this? why webappp?
        //
        if (this.user.webapp && this.user.message) {
          uMessage = this.apiService.sendNetworkMessage(
            this.user.message,
            this.user.ttl,
            this.user.bor,
            messageID
          )
        }
      } else {
        uMessage = this.apiService.sendNetworkMessage(
          messageToSend,
          this.user.ttl,
          this.user.bor,
          messageID
        )
        reply.pending = 'Broadcast message in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
      }
      // } else if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
    } else if (this.user.voiceMemo) {
      uMessage = this.apiService.sendSecurityGroupVoiceMemo(
        this.user.securityGroups,
        this.user.voiceMemo,
        this.user.duration,
        this.user.ttl,
        this.user.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'Voice Memo broadcast in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
      // } else if (this.user.file !== undefined && this.user.file !== '') {
    } else if (this.user.file) {
      uMessage = this.apiService.sendSecurityGroupAttachment(
        this.user.securityGroups,
        this.user.file,
        this.user.display,
        this.user.ttl,
        this.user.bor,
        messageID,
        sentBy
      )
      reply.pending =
        'File broadcast in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
      if (this.user.webapp && this.user.message) {
        uMessage = this.apiService.sendSecurityGroupMessage(
          this.user.securityGroups,
          this.user.message,
          this.user.ttl,
          this.user.bor,
          messageID
        )
      }
    } else {
      uMessage = this.apiService.sendSecurityGroupMessage(
        this.user.securityGroups,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID
      )
      reply.pending =
        'Broadcast message in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
    }
    // if (this.user.file !== undefined && this.user.file !== '') {
    if (this.user.file) {
      logger.debug(`display:${this.user.display}:`)
      this.apiService.writeMessageIDDB(
        messageID,
        this.user.userEmail,
        target,
        jsonDateTime,
        this.user.display
      )
      // } else if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
    } else if (this.user.voiceMemo) {
      this.apiService.writeMessageIDDB(
        messageID,
        this.user.userEmail,
        target,
        jsonDateTime,
        `VoiceMemo-${jsonDateTime}`
      )
    } else {
      this.apiService.writeMessageIDDB(
        messageID,
        this.user.userEmail,
        target,
        jsonDateTime,
        this.user.message
      )
    }
    // if (this.user.vGroupID !== '' && this.user.vGroupID !== undefined) {
    // //if (this.user.vGroupID) {
    //   StatusService.asyncStatus(messageID, this.user.vGroupID)
    // }
    logger.debug(`Broadcast uMessage=${uMessage}`)
    reply.message_id = messageID
    if (target === 'USERS') {
      reply.users = this.user.users
    } else {
      reply.securityGroups = this.user.securityGroups
    }

    this.clearValues()

    return reply
  }

  // TODO check if this.user.works as expected
  static isInt(value) {
    return !Number.isNaN(value)
  }

  clearValues() {
    this.user.file = ''
    this.user.message = ''
    this.user.userEmail = ''
    this.user.display = ''
    this.user.ackFlag = false
    this.user.securityGroups = []
    this.user.duration = 0
    this.user.voiceMemo = ''
    this.user.repeatFlag = false
    this.user.vGroupID = ''
    this.user.APISecurityGroups = []
    this.user.users = []
    this.user.ttl = ''
    this.user.bor = ''
    this.user.flags = []
  }
}

export default BroadcastService
