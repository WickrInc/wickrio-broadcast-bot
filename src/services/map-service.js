import { BOT_GOOGLE_MAPS } from '../helpers/constants'

class MapService {
  constructor({ apiService }) {
    this.apiService = apiService
  }

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
        return 'No location information available for this broadcast.'
        // APIService.sendRoomMessage(
        //   vGroupID,
        //   'no location for the replied users'
        // )
      }
    }
  }

  getMap(messageID, maxUsers) {
    // get status to check if acknowledged messages exists, and then, if they include the status_message that is added to the repo
    let link
    try {
      const messageStatus = JSON.parse(
        this.apiService.getMessageStatus(
          String(messageID),
          'full',
          String(0),
          '2000'
        ) // get all dynamically
      )

      link = this.buildMapLink({ messageStatus, maxUsers })
      return link
    } catch (e) {
      console.error(e)
      return 'No location information available for this broadcast.'
    }
  }
}

export default MapService
