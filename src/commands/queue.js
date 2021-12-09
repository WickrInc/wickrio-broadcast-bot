import WickrIOBotAPI from 'wickrio-bot-api'
import logger from '../helpers/logger'
const bot = new WickrIOBotAPI.WickrIOBot()

class Queue {
  constructor({ messageService }) {
    this.messageService = messageService
  }

  shouldExecute() {
    if (this.messageService.command === '/queue') {
      return true
    }
    return false
  }

  execute() {
    try {
      const txQInfo = bot.getTransmitQueueInfo()
      let reply

      if (txQInfo === undefined) {
        reply = 'There is no transmit queue information!'
      } else {
        if (txQInfo.estimated_time !== undefined) {
          reply =
            'Estimated remaining time for transmits is ' +
            txQInfo.estimated_time +
            ' seconds'
        }

        if (txQInfo.count !== undefined) {
          reply +=
            '\nThere are ' + txQInfo.count + ' messages to be transmitted'
        }

        if (txQInfo.tx_queue !== undefined) {
          reply +=
            '\nThere are ' +
            txQInfo.tx_queue.length +
            ' broadcasts in the queue.'
        }
      }

      return {
        reply,
      }
    } catch (err) {
      logger.error('queue:' + err)
      const reply = 'Failed to get queue information!'
      return {
        reply,
      }
    }
  }
}

export default Queue
