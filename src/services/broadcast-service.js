// import APIService from './api-service'
import StatusService from './status-service'
import WickrIOBotAPI from 'wickrio-bot-api'
import ButtonHelper from '../helpers/button-helper'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger, BROADCAST_ENABLED } from '../helpers/constants'
const bot = new WickrIOBotAPI.WickrIOBot()

class BroadcastService {
  constructor({ messageService, apiService }) {
    this.messageService = messageService
    this.apiService = apiService
    this.user = messageService.user
    this.user.ttl = ''
    this.user.bor = ''
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

  setDMFlag(dmFlag) {
    this.user.dmFlag = dmFlag
  }

  setDMRecipient(dmRecipient) {
    this.user.dmRecipient = dmRecipient
  }

  setupFileBroadcast(filePath, filename, userEmail, vGroupID) {
    this.setFile(filePath)
    this.setDisplay(filename)
    this.setUserEmail(userEmail)
    this.setVGroupID(vGroupID)
    this.setSentByFlag(true)
  }

  getBroadcastEnabled() {
    return BROADCAST_ENABLED === undefined || BROADCAST_ENABLED === 'yes'
  }

  getSecurityGroupReply() {
    const securityGroupList = this.getAPISecurityGroups()
    let groupsString = ''
    for (let i = 0; i < securityGroupList.length; i += 1) {
      // Check if the securityGroup has a size
      if (securityGroupList[i].size === undefined) {
        groupsString = `${groupsString}(${i + 1}) ${
          securityGroupList[i].name
        }\n`
      } else {
        groupsString = `${groupsString}(${i + 1}) ${
          securityGroupList[i].name
        } (users: ${securityGroupList[i].size})\n`
      }
    }
    const reply = `${
      'Who would you like to receive this message?\n\n' +
      'Here is a list of the security groups:\n'
    }${groupsString}Please enter the number(s) of the security group(s) you would like to send your message to.\n\nOr reply *all* to send the message to everyone in the network`
    return reply
    // {
    //   reply,
    //   // messagemeta,
    // }
  }

  getQueueInfo() {
    // Check the queue and send info message if pending broadcasts
    const txQInfo = bot.getTransmitQueueInfo()
    const broadcastsInQueue = txQInfo.tx_queue.length
    let broadcastDelay = txQInfo.estimated_time
    broadcastDelay = broadcastDelay + 30
    broadcastDelay = Math.round(broadcastDelay / 60)
    if (broadcastsInQueue > 0) {
      return `There are ${broadcastsInQueue} broadcasts before you in the queue. This may add a delay of approximately ${broadcastDelay} minutes to your broadcast.`
    }
    return ''
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
    let sentBy = `Broadcast message sent by: ${this.user.userEmail}`
    if (this.user.ackFlag) {
      sentBy = `${sentBy}\nPlease acknowledge message by replying with /ack`
    }
    if (this.user.dmFlag) {
      sentBy = `${sentBy}\nPlease send a response to ${this.user.dmRecipient}`
    }

    if (this.user.sentByFlag) {
      messageToSend = `${this.user.message}\n\n${sentBy}`
    } else {
      messageToSend = this.user.message
      if (this.user.ackFlag) {
        messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
      }
      if (this.user.dmFlag) {
        messageToSend = `${messageToSend}\n\nPlease send a response to ${this.user.dmRecipient}`
      }
    }

    let target
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
    const jsonDateTime = currentDate.toJSON()
    // messageID must be a string
    // TODO is is necessary to do this.user.
    const messageID = `${updateLastID()}`
    let uMessage
    const reply = {}
    const flags = []
    const metaString = ButtonHelper.makeRecipientButtons(
      this.user.ackFlag,
      this.user.dmFlag,
      this.user.dmRecipient
    )

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

    if (target === 'USERS') {
      if (this.user.flags === undefined) this.user.flags = []

      uMessage = this.apiService.send1to1MessageLowPriority(
        this.user.users,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID,
        this.user.flags,
        metaString
      )
      logger.debug(`send1to1Messge returns=${uMessage}`)
      reply.pending =
        'Broadcast message in process of being sent to list of users'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
    } else if (target === 'NETWORK') {
      if (this.user.voiceMemo) {
        uMessage = this.apiService.sendNetworkVoiceMemo(
          this.user.voiceMemo,
          this.user.duration,
          this.user.ttl,
          this.user.bor,
          messageID,
          sentBy,
          metaString
        )
        reply.pending = 'Voice Memo broadcast in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
      } else if (this.user.file) {
        uMessage = this.apiService.sendNetworkAttachment(
          this.user.file,
          this.user.display,
          this.user.ttl,
          this.user.bor,
          messageID,
          sentBy,
          metaString
        )
        reply.pending = 'File broadcast in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
        //
        // what is this? why webappp?
        //
        if (this.user.webapp && this.user.message) {
          console.log('from webapp')
          uMessage = this.apiService.sendNetworkMessage(
            this.user.message,
            this.user.ttl,
            this.user.bor,
            messageID,
            flags,
            metaString
          )
        }
      } else {
        uMessage = this.apiService.sendNetworkMessage(
          messageToSend,
          this.user.ttl,
          this.user.bor,
          messageID,
          flags,
          metaString
        )
        reply.pending = 'Broadcast message in process of being sent'
        reply.rawMessage = this.user.message
        reply.message = messageToSend
      }
    } else if (this.user.voiceMemo) {
      uMessage = this.apiService.sendSecurityGroupVoiceMemo(
        this.user.securityGroups,
        this.user.voiceMemo,
        this.user.duration,
        this.user.ttl,
        this.user.bor,
        messageID,
        sentBy,
        metaString
      )
      reply.pending =
        'Voice Memo broadcast in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
    } else if (this.user.file) {
      uMessage = this.apiService.sendSecurityGroupAttachment(
        this.user.securityGroups,
        this.user.file,
        this.user.display,
        this.user.ttl,
        this.user.bor,
        messageID,
        sentBy,
        metaString
      )
      reply.pending =
        'File broadcast in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
      if (this.user.webapp && this.user.message) {
        console.log('webapp sec group')
        uMessage = this.apiService.sendSecurityGroupMessage(
          this.user.securityGroups,
          this.user.message,
          this.user.ttl,
          this.user.bor,
          messageID,
          flags,
          metaString
        )
      }
    } else {
      uMessage = this.apiService.sendSecurityGroupMessage(
        this.user.securityGroups,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID,
        flags,
        metaString
      )
      reply.pending =
        'Broadcast message in process of being sent to security group'
      reply.rawMessage = this.user.message
      reply.message = messageToSend
    }
    if (this.user.vGroupID !== '' && this.user.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, this.user.vGroupID)
    }
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
    this.user.dmFlag = false
    this.user.dmRecipient = ''
  }
}

module.exports = BroadcastService
