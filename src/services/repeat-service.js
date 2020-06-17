import { schedule } from 'node-cron';
import APIService from './api-service';
import { logger } from '../helpers/constants';

class RepeatService {
  constructor(broadcastService, user) {
    this.user = user;
    this.broadcastService = broadcastService;
    // this.user.frequency = 0;
    // this.user.repeats = 0;
    // this.user.count = 0;
    // this.user.activeRepeat = false;
    // this.user.vGroupID = '';
  }

  setFrequency(frequency) {
    this.user.frequency = frequency;
  }

  setRepeats(repeats) {
    this.user.repeats = repeats;
  }

  setActiveRepeat(activeRepeat) {
    this.user.activeRepeat = activeRepeat;
  }

  getActiveRepeat() {
    return this.user.activeRepeat;
  }

  setVGroupID(vGroupID) {
    this.user.vGroupID = vGroupID;
  }

  repeatMessage() {
    logger.debug('Enter repeatMessage');
    this.broadcastService.broadcastMessage();
    this.user.count = 1;
    const timeString = `*/${this.user.frequency} * * * *`;
    const cronJob = schedule(timeString, () => {
      logger.debug('Running repeat cronjob');
      const reply = `Broadcast message #${this.user.count + 1} in process of being sent...`;
      logger.debug(`reply:${reply}`);
      logger.debug(`vgroupid:${this.user.vGroupID}`);
      logger.debug(`count:${this.user.count}`);
      logger.debug(`repeats:${this.user.repeats}`);
      APIService.sendRoomMessage(this.user.vGroupID, reply);
      this.broadcastService.broadcastMessage();
      if (this.user.count === this.user.repeats) {
        this.user.activeRepeat = false;
        logger.debug('rock the cron job');
        return cronJob.stop();
      }
      this.user.count += 1;
      return false;
    });
    cronJob.start();
  }
}

export default RepeatService;
