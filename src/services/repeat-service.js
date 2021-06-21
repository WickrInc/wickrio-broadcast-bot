import { schedule } from 'node-cron'
// import APIService from './api-service'
import { logger } from '../helpers/constants'

class RepeatService {
  constructor({ broadcastService, messageService, apiService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.apiService = apiService
    this.vGroupID = ''
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
    this.broadcastService.setRepeats(repeats)
  }

  setActiveRepeat(activeRepeat) {
    this.broadcastService.activeRepeat = activeRepeat
  }

  getActiveRepeat() {
    return this.broadcastService.activeRepeat
  }

  setVGroupID(vGroupID) {
    this.broadcastService.setRepeatVGroupID(vGroupID)
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage')
    this.broadcastService.broadcastMessage()
    this.broadcastService.user.count = 1
    const timeString = `*/${this.broadcastService.frequency} * * * *`
    const cronJob = schedule(timeString, () => {
      logger.debug('Running repeat cronjob')
      const reply = `Broadcast message #${
        this.broadcastService.user.count + 1
      } in process of being sent...`
      logger.debug(`reply:${reply}`)
      logger.debug(`vgroupid:${this.broadcastService.getRepeatVGroupID()}`)
      logger.debug(`count:${this.broadcastService.user.count}`)
      logger.debug(`repeats:${this.broadcastService.user.repeats}`)
      this.apiService.sendRoomMessage(
        '' + this.broadcastService.getRepeatVGroupID,
        reply
      )
      this.broadcastService.broadcastMessage()
      if (this.broadcastService.user.count === this.broadcastService.repeats) {
        this.broadcastService.activeRepeat = false
        this.broadcastService.clearValues()
        logger.debug('rock the cron job')
        return cronJob.stop()
      }
      this.broadcastService.user.count += 1
      return false
    })
    cronJob.start()
  }
}

export default RepeatService
