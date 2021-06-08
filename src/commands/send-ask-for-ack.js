import State from '../state'
import ButtonHelper from '../helpers/button-helper'

import WickrIOBotAPI from 'wickrio-bot-api'
const bot = new WickrIOBotAPI.WickrIOBot()

class SendAskForAck {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.SEND_ASK_FOR_ACK
  }

  shouldExecute() {
    // TODO could remove the /broadcast check if done right
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.NONE
    let reply
    let messagemeta = {}

    if (this.messageService.affirmativeReply()) {
      this.sendService.setAckFlag(true)
    } else if (this.messageService.negativeReply()) {
      this.sendService.setAckFlag(false)
    } else {
      reply =
        'Invalid input, please reply with (y)es or (n)o or type /cancel to cancel previous flow'
      state = State.SEND_ASK_FOR_ACK
      messagemeta = ButtonHelper.makeYesNoButton()
      return {
        reply,
        state,
        messagemeta,
      }
    }

    const txQInfo = bot.getTransmitQueueInfo()
    const broadcastsInQueue = txQInfo.tx_queue.length
    let broadcastDelay = txQInfo.estimated_time
    broadcastDelay = broadcastDelay + 30
    broadcastDelay = Math.round(broadcastDelay / 60)
    if (broadcastsInQueue > 0) {
      reply = `There are ${broadcastsInQueue} broadcasts before you in the queue. This may add a delay of approximately ${broadcastDelay} minutes to your broadcast.`
    } else {
      reply =
        `Message sent to users from the file: ` + this.sendService.getSendFile()
    }

    // TODO check for errors first!! return from send
    this.sendService.sendToFile()
    return {
      reply,
      state,
    }
  }
}

export default SendAskForAck
