import { schedule } from 'node-cron'
import APIService from './api-service'
import { logger } from '../helpers/constants'

class RepeatService {
  constructor({ broadcastService, messageService }) {
    this.messageService = messageService
    this.broadcastService = broadcastService
    // this.messageService.frequency = 0;
    // this.messageService.repeats = 0;
    // this.messageService.count = 0;
    // this.messageService.activeRepeat = false;
    // this.messageService.vGroupID = '';
  }

  setFrequency(frequency) {
    this.messageService.frequency = frequency
  }

  setRepeats(repeats) {
    this.messageService.repeats = repeats
  }

  setActiveRepeat(activeRepeat) {
    this.messageService.activeRepeat = activeRepeat
  }

  getActiveRepeat() {
    return this.messageService.activeRepeat
  }

  setVGroupID(vGroupID) {
    this.messageService.vGroupID = vGroupID
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage')
    this.broadcastService.broadcastMessage()
    this.messageService.count = 1
    const timeString = `*/${this.messageService.frequency} * * * *`
    const cronJob = schedule(timeString, () => {
      logger.debug('Running repeat cronjob')
      const reply = `Broadcast message #${
        this.messageService.count + 1
      } in process of being sent...`
      logger.debug(`reply:${reply}`)
      logger.debug(`vgroupid:${this.messageService.vGroupID}`)
      logger.debug(`count:${this.messageService.count}`)
      logger.debug(`repeats:${this.messageService.repeats}`)
      APIService.sendRoomMessage(this.messageService.vGroupID, reply)
      this.broadcastService.broadcastMessage()
      if (this.messageService.count === this.messageService.repeats) {
        this.messageService.activeRepeat = false
        logger.debug('rock the cron job')
        return cronJob.stop()
      }
      this.messageService.count += 1
      return false
    })
    cronJob.start()
  }
}

export default RepeatService
