import { schedule } from 'node-cron'
import APIService from './api-service'
import { logger, BOT_GOOGLE_MAPS } from '../helpers/constants'

class StatusService {
  static getMap(messageID, maxUsers) {
    // set initial value false
    let locatedusers = false
    // unordered .list
    // console.log({ tableDataRaw: JSON.parse(tableDataRaw) })
    // don't need this with the email  in getMessageIDTable
    // var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
    //   return entry.sender == email
    // });

    // get status to check if acknowledged messages exists, and then, if they include the status_message that is added to the repo
    const messageStatus = JSON.parse(
      APIService.getMessageStatus(String(messageID), 'full', String(0), '2000') // get all dynamically
    )

    if (messageStatus) {
      let link = `https://maps.googleapis.com/maps/api/staticmap?key=${BOT_GOOGLE_MAPS.value}&size=700x400&markers=color:blue`
      const locations = {}
      console.log({ messageStatus })
      // for (let i = 0; i < argument - 1; i++) {
      for (const userReply of messageStatus) {
        // const userReply = messageStatus[i]
        console.log({ userReply })
        // Only use acked and read state to show the map location. Others will be errors.
        if ((userReply.status === 3 || userReply.status === 6) && userReply.status_message) {
          console.log('located a user')
          locatedusers = true
          const { location } = JSON.parse(userReply.status_message)

          console.log({ location })
          const { latitude, longitude } = location
          console.log({ latitude, longitude })

          locations[userReply.user] = {}
          locations[userReply.user].location =
            'http://www.google.com/maps/place/' + latitude + ',' + longitude
          locations[userReply.user].latitude = latitude
          locations[userReply.user].longitude = longitude
          link += `|label:${userReply.user}|${latitude},${longitude}`
          console.log({ link })
          console.log({
            length: Object.keys(locations).length,
            int: parseInt(maxUsers),
          })
          if (Object.keys(locations).length === parseInt(maxUsers)) {
            break
          }
        }
      }
      locations.link = link
      console.log({ locations, link })

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

const status = messageID => {
  const statuscall = APIService.getMessageStatus(
    messageID,
    'summary',
    '0',
    '1000'
  )
  return statuscall
}

export default StatusService
