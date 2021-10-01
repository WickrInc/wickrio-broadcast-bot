import { schedule } from 'node-cron'
// import APIService from './api-service'
import { logger } from '../helpers/constants'

class RepeatService {
  constructor({
    combinedService,
    messageService,
    apiService,
    broadcastMessageService,
  }) {
    this.combinedService = combinedService
    this.messageService = messageService
    this.apiService = apiService
    this.broadcastMessageService = broadcastMessageService
    // this.combinedService.frequency = 0;
    // this.combinedService.repeats = 0;
    // this.combinedService.count = 0;
    // this.combinedService.activeRepeat = false;
    // this.combinedService.vGroupID = '';
  }

  setFrequency(frequency) {
    this.combinedService.user.frequency = frequency
  }

  setRepeats(repeats) {
    this.combinedService.user.repeats = repeats
  }

  setActiveRepeat(activeRepeat) {
    this.combinedService.user.activeRepeat = activeRepeat
  }

  isActiveRepeat() {
    return this.combinedService.isActiveRepeat()
  }

  setVGroupID(vGroupID) {
    this.combinedService.user.vGroupID = vGroupID
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage')
    logger.debug(`combined message!:${this.combinedService.getMessage()}`)
    this.combinedService.setCount(0)
    // TODO more robust way to save data needed
    const repeatUser = JSON.parse(JSON.stringify(this.combinedService.user))
    // const repeatUser = this.combinedService.user
    logger.debug(`message:${repeatUser.message}`)
    logger.debug(`repeats:${this.combinedService.getRepeats()}`)
    this.combinedService.broadcastMessage()
    logger.debug('Frequency:' + this.combinedService.getFrequency())
    const timeString = `*/${this.combinedService.getFrequency()} * * * *`
    const cronJob = schedule(timeString, () => {
      logger.debug('Running repeat cronjob')
      this.combinedService.incCount()
      const reply = `Broadcast message #${
        this.combinedService.getCount() + 1
      } in process of being sent...`
      logger.debug(`reply:${reply}`)
      logger.debug(`vgroupid:${this.combinedService.getVGroupID()}`)
      logger.debug(`combined message!:${this.combinedService.getMessage()}`)
      logger.debug(`count:${this.combinedService.getCount()}`)
      logger.debug(`repeats:${this.combinedService.getRepeats()}`)
      logger.debug(`repeat message:${repeatUser.message}`)
      logger.debug(
        `repeats === count:${
          this.combinedService.getRepeats() === this.combinedService.getCount()
        }`
      )
      try {
        this.apiService.sendRoomMessage(
          this.combinedService.getVGroupID(),
          reply
        )
        this.broadcastMessageService.broadcastMessage(
          this.apiService,
          repeatUser
        )
      } catch (err) {
        this.combinedService.setActiveRepeat(false)
        logger.debug('rock the cron job')
        logger.error(err)
        return cronJob.stop()
      }
      if (
        this.combinedService.getRepeats() === this.combinedService.getCount()
      ) {
        this.combinedService.setActiveRepeat(false)
        logger.debug('rock the cron job')
        return cronJob.stop()
      }
      return false
    })
    cronJob.start()
  }
}

export default RepeatService
