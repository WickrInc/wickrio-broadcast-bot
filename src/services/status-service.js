import { schedule } from 'node-cron'
import { logger, apiService } from '../helpers/constants'

class StatusService {
  static getStatus(messageID, asyncStatus) {
    let statusData
    try {
      statusData = status(messageID)
    } catch (err) {
      if (asyncStatus) {
        return {
          statusString: 'No data found for that message',
          complete: true,
        }
      }
      return 'No data found for that message'
    }
    const messageStatus = JSON.parse(statusData)
    // logger.debug({ messageStatus })
    // TODO what do we do when no Records are found?
    // is this because of sending to empty security group??

    let statusString = StatusService.getStatusString(messageStatus)
    let complete = messageStatus.pending === 0
    const preparing =
      messageStatus.status === 'preparing' || messageStatus.status === 'created'
    // logger.debug(`messageStatus.status is: ${messageStatus.status}`)
    // console.log({ messageStatus })
    if (preparing) {
      complete = false
      statusString =
        'Message preparing to send. There may be other broadcast ahead of this one in the queue, please stand by.'
    }
    if (asyncStatus) {
      return {
        statusString,
        complete,
        preparing,
      }
    }
    return statusString
  }

  static getStatusString(messageStatus) {
    let statusString =
      '*Message Status:*\n' +
      `Total Users: ${messageStatus.num2send}\n` +
      `Messages Sent: ${messageStatus.sent}\n` +
      `Messages pending to Users: ${messageStatus.pending}\n` +
      `Messages failed to send: ${messageStatus.failed}\n` +
      `Messages aborted: ${messageStatus.aborted}\n` +
      `Messages acknowledged: ${messageStatus.acked}\n` +
      `Messages read: ${messageStatus.read}\n`
    if (messageStatus.ignored !== undefined) {
      statusString = `${statusString}Messages Ignored: ${messageStatus.ignored}`
    }
    return statusString
  }

  static asyncStatus(messageID, vGroupID, user) {
    logger.debug('Enter asyncStatus ')
    const timeString = '*/30 * * * * *'
    user.asyncStatusMap.set(messageID, 0)
    // let preparing;
    const cronJob = schedule(timeString, () => {
      logger.debug('Running cronjob')
      const statusObj = StatusService.getStatus(messageID, true)
      const { preparing } = statusObj
      const count = user.asyncStatusMap.get(messageID)
      user.asyncStatusMap.set(messageID, count + 1)
      if (!preparing && statusObj.complete) {
        apiService.sendRoomMessage(vGroupID, statusObj.statusString)
      } else if (user.asyncStatusMap.get(messageID) === 9) {
        const reply = `${statusObj.statusString}
          \nTo get the latest status of a broadcast, type /status at any time.`
        apiService.sendRoomMessage(vGroupID, reply)
      }
      if (statusObj.complete) {
        return cronJob.stop()
      }
      return false
    })
    cronJob.start()
  }
}

const status = messageID =>
  apiService.getMessageStatus(messageID, 'summary', '0', '1000') // need to make this '1000' value dynamically reference the intended number broadcasts kept in the history

export default StatusService
