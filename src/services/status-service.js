import { schedule } from 'node-cron';
import APIService from './api-service';
import { logger } from '../helpers/constants';

class StatusService {
  static getStatus(messageID, asyncStatus) {
    // TODO Here we need which Message??
    let statusData;
    try {
      statusData = status(messageID);
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
    console.log({ messageStatus });
    let statusString = '*Message Status:*\n'
      + `Total Users: ${messageStatus.num2send}\n`
      + `Messages Sent: ${messageStatus.sent}\n`
      + `Messages pending to Users: ${messageStatus.pending}\n`
      + `Messages failed to send: ${messageStatus.failed}\n`
      + `Messages aborted: ${messageStatus.aborted}\n`
      + `Messages acknowledged: ${messageStatus.acked}\n`
      + `Messages read: ${messageStatus.read}\n`;
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
    const cronJob = schedule(timeString, () => {
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

const status = (messageID) => {
  const statuscall = APIService.getMessageStatus(messageID, 'summary', '0', '1000');
  return statuscall;
};


export default StatusService;
