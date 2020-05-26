import { schedule } from 'node-cron';
import { debug } from '../logger';
import APIService from './api-service';

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
    debug('Enter repeatMessage');
    this.broadcastService.broadcastMessage();
    this.count = 1;
    const timeString = `*/${this.frequency} * * * *`;
    const cronJob = schedule(timeString, () => {
      debug('Running repeat cronjob');
      const reply = `Broadcast message #${this.count + 1} in process of being sent...`;
      debug(`reply:${reply}`);
      debug(`vgroupid:${this.vGroupID}`);
      debug(`count:${this.count}`);
      debug(`repeats:${this.repeats}`);
      APIService.sendRoomMessage(this.vGroupID, reply);
      this.broadcastService.broadcastMessage();
      if (this.count === this.repeats) {
        this.activeRepeat = false;
        debug('rock the cron job');
        return cronJob.stop();
      }
      this.count += 1;
      return false;
    });
    cronJob.start();
  }
}

export default RepeatService;
