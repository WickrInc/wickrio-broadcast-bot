import { schedule } from 'node-cron'
import { apiService } from '../helpers/constants'
import logger from '../helpers/logger'
import ButtonHelper from '../helpers/button-helper.js'
import ackTracker from '../helpers/ack-tracker'

class StatusService {
  static async getStatus(messageID, asyncStatus) 
  {
    let statusData;
    try {
      statusData = await status(messageID)
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
    let statusString = StatusService.getStatusString(messageStatus, messageID)
    let complete = messageStatus.pending === 0
    const preparing =
      messageStatus.status === 'preparing' || messageStatus.status === 'created'
    // logger.debug(`messageStatus.status is: ${messageStatus.status}`)
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

  static getStatusString(messageStatus, messageID = null) {
    let statusString =
      '*Message Status:*\n' +
      `Total Users: ${messageStatus.num2send}\n` +
      `Messages Sent: ${messageStatus.sent}\n` +
      `Messages pending to Users: ${messageStatus.pending}\n` +
      `Messages failed to send: ${messageStatus.failed}\n` +
      `Messages aborted: ${messageStatus.aborted}\n` +
      `Messages read: ${messageStatus.read}\n`
    
    // Use custom ack tracker if messageID is available, otherwise use WickrIO's count
    if (messageID) {
      const customAckCount = ackTracker.getAckCount(messageID)
      statusString += `Messages acknowledged: ${customAckCount}\n`
    } else {
      statusString += `Messages acknowledged: ${messageStatus.acked}\n`
    }
    
    if (messageStatus.ignored !== undefined) {
      statusString = `${statusString}Messages Ignored: ${messageStatus.ignored}`
    }
    return statusString
  }

  static asyncStatus(messageID, vGroupID, user) {
    logger.debug('Enter asyncStatus ')
    const timeString = '*/30 * * * * *'
    if (
      user.asyncStatusMap === undefined ||
      !(user.asyncStatusMap instanceof Map)
    ) {
      user.asyncStatusMap = new Map()
    }
    user.asyncStatusMap.set(messageID, 0)
    // let preparing;
    const cronJob = schedule(timeString, async () => {
      // logger.debug('Running cronjob')
      const statusObj =  await StatusService.getStatus(messageID, true)
      const { preparing } = statusObj
      const count = user.asyncStatusMap.get(messageID)
      user.asyncStatusMap.set(messageID, count + 1)
      let reply = statusObj.statusString
      if (!preparing && statusObj.complete) {
        const metastring = JSON.stringify(ButtonHelper.makeStartButtons(false))
        await apiService.sendRoomMessage(vGroupID, reply, '', '', '', [], metastring)
      } else if (user.asyncStatusMap.get(messageID) === 9) {
        const metastring = JSON.stringify(
          ButtonHelper.makeCommandButtons(['Status'])
        )
        reply = `${reply}\nTo get the latest status of a broadcast, type /status at any time.`
        await apiService.sendRoomMessage(vGroupID, reply, '', '', '', [], metastring)
      }
      if (statusObj.complete) {
        return cronJob.stop()
      }
      return false
    })
    cronJob.start()
  }
}

const status = async messageID =>
  await apiService.getMessageStatus(messageID, 'summary', '0', '1000') // need to make this '1000' value dynamically reference the intended number broadcasts kept in the history

export default StatusService
