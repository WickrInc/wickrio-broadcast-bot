import { existsSync, mkdirSync } from 'fs'

import FileHandler from '../helpers/file-handler'
import WickrIOBotAPI from 'wickrio-bot-api'
import ButtonHelper from '../helpers/button-helper'
import { logger, BROADCAST_ENABLED } from '../helpers/constants'
const bot = new WickrIOBotAPI.WickrIOBot()

// TODO make fs a variable that is passed into the constructor
if (!existsSync(`${process.cwd()}/files`)) {
  mkdirSync(`${process.cwd()}/files`)
}

// TODO reduce magic chars
const dir = `${process.cwd()}/files`

// TODO rename userbroadcastmessage
class CombinedService {
  constructor({
    messageService,
    apiService,
    broadcastMessageService,
    sendMessageService,
  }) {
    this.messageService = messageService
    this.apiService = apiService
    this.broadcastMessageService = broadcastMessageService
    this.sendMessageService = sendMessageService
    this.user = messageService.user
    this.user.ttl = ''
    this.user.bor = ''
  }

  setRepeatFlag(repeatFlag) {
    this.user.repeatFlag = repeatFlag
  }

  setRepeats(repeats) {
    this.user.repeats = repeats
  }

  setActiveRepeat(activeRepeat) {
    this.user.activeRepeat = activeRepeat
  }

  setFrequency(frequency) {
    this.user.frequency = frequency
  }

  setFlags(flags) {
    this.user.flags = flags
  }

  // TODO rename to broadcast File
  setFile(file) {
    this.user.file = file
  }

  setVoiceMemo(voiceMemo) {
    this.user.voiceMemo = voiceMemo
  }

  setVoiceMemoDuration(voiceMemoDuration) {
    this.user.voiceMemoDuration = voiceMemoDuration
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

  // TODO doesDMRecipientExist
  setDMFlag(dmFlag) {
    this.user.dmFlag = dmFlag
  }

  // TODO rename UserListFile
  setSendFile(file) {
    this.user.sendfile = file
  }

  setDMRecipient(dmRecipient) {
    this.user.dmRecipient = dmRecipient
  }

  setCount(count) {
    this.user.count = count
  }

  setAsyncStatusMap(key, value) {
    this.user.asyncStatusMap.set(key, value)
  }

  getAsyncStatusMap() {
    return this.user.asyncStatusMap
  }

  // TODO rename doesUserlistFileExist
  // setSendFileExists(sendFileExists) {
  //   this.user.sendFileExists = sendFileExists
  // }

  // getUserFileFlag() {
  //   return this.user.recipientType
  // }

  getMessage() {
    return this.user.message
  }

  getSendFile() {
    return this.user.sendfile
  }

  getBroadcastEnabled() {
    return BROADCAST_ENABLED === undefined || BROADCAST_ENABLED.value === 'yes'
  }

  getAPISecurityGroups() {
    this.user.APISecurityGroups = this.apiService.getSecurityGroups()
    return this.user.APISecurityGroups
  }

  getFile() {
    return this.user.file
  }

  getVoiceMemo() {
    return this.user.voiceMemo
  }

  getCount() {
    return this.user.count
  }

  getRepeats() {
    return this.user.repeats
  }

  isActiveRepeat() {
    return this.user.activeRepeat
  }

  getFrequency() {
    return this.user.frequency
  }

  getVGroupID() {
    return this.user.vGroupID
  }

  getFiles(userEmail) {
    try {
      const userDir = `${dir}/${userEmail}/`
      return FileHandler.listFiles(userDir)
    } catch (err) {
      // TODO fix this.user.!! gracefully >:)
      logger.error(err)
      return null
    }
  }

  setupFileBroadcast(filePath, filename, userEmail, vGroupID) {
    this.setFile(filePath)
    this.setDisplay(filename)
    this.setUserEmail(userEmail)
    this.setVGroupID(vGroupID)
    this.setSentByFlag(true)
  }

  setupVoiceMemoBroadcast(voiceMemoFilePath, duration, userEmail, vGroupID) {
    this.setVoiceMemo(voiceMemoFilePath)
    this.setVoiceMemoDuration('' + duration)
    this.setUserEmail(userEmail)
    this.setVGroupID(vGroupID)
    this.setSentByFlag(true)
  }

  hasMessageOrFile() {
    return (
      (this.getMessage() !== undefined && this.getMessage() !== '') ||
      (this.getFile() !== undefined && this.getFile() !== '') ||
      (this.getVoiceMemo() !== undefined && this.getVoiceMemo() !== '')
    )
  }

  incCount() {
    this.user.count = this.user.count + 1
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

  getFilesForSending(userEmail) {
    const fileArr = this.getFiles(userEmail)
    let reply = ''
    let messagemeta = {}
    // TODO check button list cut on iOS
    if (!fileArr || fileArr.length === 0) {
      reply =
        "Broadcast to multiple users by clicking on the '+' sign and uploading a .txt file containig a list of usernames in line-separated format - with only one username per line."
    } else {
      reply = 'Select a user file:\n'
      const baseReplyLength = reply.length
      const files = fileArr.map(file => file.slice(0, -5))
      for (let index = 0; index < files.length; index += 1) {
        reply += `(${index + 1}) ${files[index]}\n`
      }
      reply +=
        "You can also upload a new .txt file (by clicking on the '+' sign) containing a list of usernames in line-separated format - with only one username per line."
      messagemeta = ButtonHelper.makeButtonList(
        'List of files',
        'Name',
        'Select',
        baseReplyLength,
        reply.length,
        files
      )
    }
    return {
      reply,
      messagemeta,
      fileArr,
    }
  }

  recallBroadcast() {}

  broadcastMessage() {
    const util = require('util')
    logger.debug(util.inspect(this.user, { depth: null }))
    const queueInfo = this.getQueueInfo()
    if (queueInfo !== '') {
      this.apiService.sendRoomMessage(
        this.user.vGroupID,
        queueInfo,
        '',
        '',
        '',
        [],
        ''
      )
    }
    this.broadcastMessageService.broadcastMessage(this.apiService, this.user)
    const reply = `Your broadcast is being sent to the users in your network. This may take a few minutes. Type /status to check the status of your broadcast.\n\nTo start a new broadcast, type /start`
    this.clearValues()
    return reply
  }

  sendToFile() {
    const util = require('util')
    logger.debug(util.inspect(this.user, { depth: null }))
    const queueInfo = this.getQueueInfo()
    if (queueInfo !== '') {
      this.apiService.sendRoomMessage(
        this.user.vGroupID,
        queueInfo,
        '',
        '',
        '',
        [],
        ''
      )
    }
    const sendReply = this.sendMessageService.sendToFile(
      this.apiService,
      this.user
    )
    let reply
    if (sendReply === '') {
      reply = `Your broadcast is being sent to the users in ${this.user.sendfile}. This may take a few minutes. Type /status to check the status of your broadcast.\n\nTo start a new broadcast, type /start`
    } else {
      reply = sendReply
    }
    this.clearValues()
    return reply
  }

  // TODO this.apiService vs importing apiService??
  retrieveFile(filePath, vGroupID) {
    this.apiService.sendRoomAttachment(vGroupID, filePath, filePath)
  }

  // TODO should these all be in the constructor?
  clearValues() {
    logger.verbose('Clear values called')
    this.user.file = ''
    this.user.sendfile = ''
    this.user.message = ''
    this.user.display = ''
    this.user.ackFlag = false
    this.user.securityGroups = []
    this.user.voiceMemoDuration = 0
    this.user.voiceMemo = ''
    this.user.repeatFlag = false
    this.user.APISecurityGroups = []
    this.user.users = []
    this.user.ttl = ''
    this.user.bor = ''
    // TODO what's flags for?
    this.user.flags = []
    this.user.dmFlag = false
    this.user.dmRecipient = ''
    this.user.sentByFlag = false
  }
}

module.exports = CombinedService
