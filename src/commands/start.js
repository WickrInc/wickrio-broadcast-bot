import { BROADCAST_ENABLED } from '../helpers/constants'
import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
// import { logger } from '../helpers/constants'

class Start {
  constructor({ messageService }) {
    this.messageService = messageService
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
    let broadcastString
    const buttonArray = ['New User File', 'Existing User List']
    // TODO check if value can be capital letters?
    if (BROADCAST_ENABLED === undefined || BROADCAST_ENABLED.value === 'yes') {
      broadcastString = '"Security Group", '
      buttonArray.unshift('Security Group')
    }
    const reply = `How would you like to select the recipients for your broadcast?\nType ${broadcastString}"New User File" or "Existing User List" (if you have one)`
    const messagemeta = ButtonHelper.makeCancelButtons(buttonArray)
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = Start
