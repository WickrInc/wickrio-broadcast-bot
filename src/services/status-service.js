import { schedule } from 'node-cron'
import APIService from './api-service'
import { logger, BOT_GOOGLE_MAPS } from '../helpers/constants'

class StatusService {
  buildMapLink = ({ messageStatus, maxUsers }) => {
    let locatedusers = false

    if (messageStatus) {
      // build google map link
      let link = `https://maps.googleapis.com/maps/api/staticmap?key=${BOT_GOOGLE_MAPS.value}&size=700x400&markers=color:blue`
      const locations = {}
      for (const userReply of messageStatus) {
        // Only use acked and read state to show the map location. Others will be errors.
        if (
          (userReply.status === 3 || userReply.status === 6) &&
          userReply.status_message
        ) {
          locatedusers = true
          const { location } = JSON.parse(userReply.status_message)
          const { latitude, longitude } = location

          locations[userReply.user] = {}
          locations[userReply.user].location =
            'http://www.google.com/maps/place/' + latitude + ',' + longitude
          locations[userReply.user].latitude = latitude
          locations[userReply.user].longitude = longitude
          link += `|label:${userReply.user}|${latitude},${longitude}`

          if (Object.keys(locations).length === parseInt(maxUsers)) {
            break
          }
        }
      }
      locations.link = link
      if (locatedusers) {
        // APIService.sendRoomMessage(vGroupID, link)
        return link
      } else {
        return 'no location for the replied users'
        // APIService.sendRoomMessage(
        //   vGroupID,
        //   'no location for the replied users'
        // )
      }
    }
  }

  static getMap(messageID, maxUsers) {
    // get status to check if acknowledged messages exists, and then, if they include the status_message that is added to the repo
    const messageStatus = JSON.parse(
      APIService.getMessageStatus(String(messageID), 'full', String(0), '2000') // get all dynamically
    )

    const link = this.buildMapLink({ messageStatus, maxUsers })
    return link
  }

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
    logger.debug({ messageStatus })
    // TODO what do we do when no Records are found?
    // is this because of sending to empty security group??

    let statusString = StatusService.getStatusString(messageStatus)
    let complete = messageStatus.pending === 0
    const preparing =
      messageStatus.status === 'preparing' || messageStatus.status === 'created'
    logger.debug(`messageStatus.status is: ${messageStatus.status}`)
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

  static asyncStatus(messageID, vGroupID) {
    logger.debug('Enter asyncStatus ')
    const timeString = '*/30 * * * * *'
    // let preparing;
    const cronJob = schedule(timeString, () => {
      logger.debug('Running cronjob')
      const statusObj = StatusService.getStatus(messageID, true)
      const { preparing } = statusObj
      if (!preparing) {
        APIService.sendRoomMessage(vGroupID, statusObj.statusString)
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
  APIService.getMessageStatus(messageID, 'summary', '0', '1000')

export default StatusService
