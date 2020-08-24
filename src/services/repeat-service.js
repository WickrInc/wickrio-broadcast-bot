import { schedule } from 'node-cron'
// import APIService from './api-service'
import { logger } from '../helpers/constants'

class RepeatService {
  constructor({ broadcastService, messageService, apiService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.apiService = apiService
    // this.broadcastService.frequency = 0;
    // this.broadcastService.repeats = 0;
    // this.broadcastService.count = 0;
    // this.broadcastService.activeRepeat = false;
    // this.broadcastService.vGroupID = '';
  }

  setFrequency(frequency) {
    this.broadcastService.frequency = frequency
  }

  setRepeats(repeats) {
    this.broadcastService.repeats = repeats
  }

  setActiveRepeat(activeRepeat) {
    this.broadcastService.activeRepeat = activeRepeat
  }

  getActiveRepeat() {
    return this.broadcastService.activeRepeat
  }

  setVGroupID(vGroupID) {
    this.broadcastService.vGroupID = vGroupID
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage')
    this.broadcastService.broadcastMessage()
    this.broadcastService.count = 1
    const timeString = `*/${this.broadcastService.frequency} * * * *`
    const cronJob = schedule(timeString, () => {
      logger.debug('Running repeat cronjob')
      const reply = `Broadcast message #${
        this.broadcastService.count + 1
      } in process of being sent...`
      logger.debug(`reply:${reply}`)
      logger.debug(`vgroupid:${this.broadcastService.vGroupID}`)
      logger.debug(`count:${this.broadcastService.count}`)
      logger.debug(`repeats:${this.broadcastService.repeats}`)
      this.apiService.sendRoomMessage(this.broadcastService.vGroupID, reply)
      this.broadcastService.broadcastMessage()
      if (this.broadcastService.count === this.broadcastService.repeats) {
        this.broadcastService.activeRepeat = false
        logger.debug('rock the cron job')
        return cronJob.stop()
      }
      this.broadcastService.count += 1
      return false
    })
    cronJob.start()
  }
}

export default RepeatService
