const cron = require('node-cron');
const logger = require('../logger');
const APIService = require('./api-service');

class RepeatService {
  constructor(broadcastService) {
    this.frequency = 0;
    this.repeats = 0;
    this.broadcastService = broadcastService;
    this.count = 0;
    this.activeRepeat = false;
    this.vGroupID = '';
  }

  setFrequency(frequency) {
    this.frequency = frequency;
  }

  setRepeats(repeats) {
    this.repeats = repeats;
  }

  setActiveRepeat(activeRepeat) {
    this.activeRepeat = activeRepeat;
  }

  getActiveRepeat() {
    return this.activeRepeat;
  }

  setVGroupID(vGroupID) {
    this.vGroupID = vGroupID;
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage');
    this.broadcastService.broadcastMessage();
    this.count = 1;
    const timeString = `*/${this.frequency} * * * *`;
    const cronJob = cron.schedule(timeString, () => {
      logger.debug('Running repeat cronjob');
      const reply = `Broadcast message #${this.count + 1} in process of being sent...`;
      logger.debug(`reply:${reply}`);
      logger.debug(`vgroupid:${this.vGroupID}`);
      logger.debug(`count:${this.count}`);
      logger.debug(`repeats:${this.repeats}`);
      APIService.sendRoomMessage(this.vGroupID, reply);
      this.broadcastService.broadcastMessage();
      if (this.count === this.repeats) {
        this.activeRepeat = false;
        logger.debug('rock the cron job');
        return cronJob.stop();
      }
      this.count += 1;
      return false;
    });
    cronJob.start();
  }
}

module.exports = RepeatService;
