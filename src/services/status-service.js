const cron = require('node-cron');

const logger = require('../logger');
const APIService = require('./api-service');

class StatusService {
  static getStatus(messageID, asyncStatus) {
  // TODO Here we need which Message??
    let statusData;
    try {
      statusData = APIService.getMessageStatus(messageID, 'summary', '0', '1000');
    } catch (err) {
      if (asyncStatus) {
        return {
          statusString: 'No data found for that message',
          complete: true,
        };
      }
      return 'No data found for that message';
    }
    const messageStatus = JSON.parse(statusData);
    let statusString = '*Message Status:*\n'
                   + `Total Users: ${messageStatus.num2send}\n`
                   + `Messages Sent: ${messageStatus.sent}\n`
                   + `Messages pending to Users: ${messageStatus.pending}\n`
                   + `Messages failed to send: ${messageStatus.failed}\n`
                   + `Messages aborted: ${messageStatus.aborted}\n`
                   + `Messages received: ${messageStatus.received}\n`;
    if (messageStatus.ignored !== undefined) {
      statusString = `${statusString}Messages Ignored: ${messageStatus.ignored}`;
    }
    if (asyncStatus) {
      const complete = messageStatus.pending === 0;
      return {
        statusString,
        complete,
      };
    }
    return statusString;
  }

  static asyncStatus(messageID, vGroupID) {
    logger.debug('Enter asyncStatus ');
    const timeString = '*/30 * * * * *';
    const cronJob = cron.schedule(timeString, () => {
      logger.debug('Running cronjob');
      const statusObj = StatusService.getStatus(messageID, true);
      APIService.sendRoomMessage(vGroupID, statusObj.statusString);
      if (statusObj.complete) {
        return cronJob.stop();
      }
      return false;
    });
    cronJob.start();
  }
}

module.exports = StatusService;
