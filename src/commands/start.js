import { BROADCAST_ENABLED } from '../helpers/constants'
import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
// import { logger } from '../helpers/constants'

class Start {
  constructor({ messageService, sendService }) {
    this.messageService = messageService
    this.sendService = sendService
    this.commandString = '/start'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const state = State.SELECT_RECIPIENTS
    let reply = ''
    let broadcastString = ''
    let existingString = ''
    let messagemeta = {}
    const buttonArray = ['New User File']
    // TODO check if value can be capital letters?
    // TODO Check the correct way to check BROADCAST_ENABLED
    if (BROADCAST_ENABLED === undefined || BROADCAST_ENABLED.value === 'yes') {
      broadcastString = '"S" for Security Group"\n'
      buttonArray.unshift('Security Group')
    }
    // TODO should be undefined??
    if (
      this.sendService.getFiles(this.messageService.getUserEmail()) !== null
    ) {
      existingString = '\n"E" for Existing User File'
      buttonArray.push('Existing User File')
    }
    if (buttonArray.length === 1) {
      reply =
        'To upload a new user file, select the " + " icon below and upload a .txt file containing return separated usernames of users who are in your Wickr network.'
    } else {
      reply = `How would you like to select the recipients for your broadcast?\nType ${broadcastString}"N" for New User File${existingString}`
      messagemeta = ButtonHelper.makeCancelButtons(buttonArray)
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = Start
