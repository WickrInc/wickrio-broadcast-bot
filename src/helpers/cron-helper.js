const cron = require('node-cron');

let cronJob;

class CronHelper {
  static schedule(waitTime, callback) {
    const timeString = `*/${waitTime} * * * * *`;
    cronJob = cron.schedule(timeString, () => {
      callback();
    });
  }

  static cancel() {
    cronJob.stop();
  }
}

module.exports = CronHelper;
