import State from '../state'
import { logger } from '../helpers/constants'

class Start {
  constructor({ combinedService, setupService, messageService }) {
    logger.verbose('Begin Start constructor')
    this.messageService = messageService
    this.combinedService = combinedService
    this.setupService = setupService
    this.commandString = '/start'
  }

  shouldExecute() {
    logger.verbose('Start shouldExecute called')
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    logger.verbose('Start execute called')
    this.combinedService.clearValues()
    this.combinedService.setUserEmail(this.messageService.getUserEmail())
    this.combinedService.setVGroupID(this.messageService.getVGroupID())
    this.combinedService.setSentByFlag(true)
    const state = State.SELECT_RECIPIENTS
    const userEmail = this.messageService.getUserEmail()
    const retObj = this.setupService.getStartReply(userEmail)
    const reply = retObj.reply
    const messagemeta = retObj.messagemeta
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = Start
