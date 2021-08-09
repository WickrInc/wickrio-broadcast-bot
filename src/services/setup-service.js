import { existsSync, mkdirSync } from 'fs'

import { BROADCAST_ENABLED } from '../helpers/constants'
import ButtonHelper from '../helpers/button-helper.js'
import pkgjson from '../../package.json'
// import FileHandler from '../helpers/file-handler'

// TODO make fs a variable that is passed into the constructor
if (!existsSync(`${process.cwd()}/files`)) {
  mkdirSync(`${process.cwd()}/files`)
}

// const dir = `${process.cwd()}/files`

class SetupService {
  constructor(dataStorage) {
    this.dataStorage = dataStorage
    this.admins = dataStorage.readCredentials().admins
  }

  setRecipientType(recipientType) {
    this.recipientType = recipientType
  }

  saveData() {
    this.dataStorage.saveData({ admins: this.admins })
  }

  alreadySetup(userEmail) {
    return this.admins[userEmail]
  }

  setupComplete(userEmail) {
    this.admins[userEmail] = true
    this.saveData()
  }

  static getWelcomeMessage() {
    const reply = `Welcome to the Wickr BroadcastBot (version ${pkgjson.version}). I can help you broadcast messages to the members of your network. To get started type /start.\n\n At any time you can type /help to get a list of available commands or /cancel to exit from the the broadcast configuration flow.`
    const buttons = ['Start', 'Help']
    const messagemeta = ButtonHelper.makeCommandButtons(buttons, 0)
    return {
      reply,
      messagemeta,
    }
  }

  static getStartReply() {
    let reply = ''
    let broadcastString = ''
    // let existingString = ''
    let messagemeta = {}
    const buttonArray = ['User File', 'Security Group', 'All']
    // TODO check if value can be capital letters?
    // TODO Check the correct way to check BROADCAST_ENABLED
    if (BROADCAST_ENABLED === undefined || BROADCAST_ENABLED.value === 'yes') {
      broadcastString =
        "'S' for Security Group\n\nOr reply 'All' to send the message to everyone in the network"
      reply = `To whom would you like to broadcast?\nType:\n'U' for User File\n${broadcastString}`
      messagemeta = ButtonHelper.makeCancelButtons(buttonArray)
    } else {
      reply =
        'Broadcast to multiple users by uploading a .txt file with the list of usernames in line-separated format, only one username per line'
    }
    return {
      reply,
      messagemeta,
    }
  }
}

module.exports = SetupService
