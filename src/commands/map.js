import { BOT_GOOGLE_MAPS } from '../helpers/constants'
import State from '../state'

class Map {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/map'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    let reply
    let state
    if (BOT_GOOGLE_MAPS.value === true) {
      const { userEmail } = this.messageService
      this.genericService.resetIndexes()
      const entries = this.genericService.getMessageEntries(userEmail, false)
      const entriesString = this.genericService.getEntriesString(
        userEmail,
        false
      )
      if (!entries || entries.length === 0) {
        reply = entriesString
      } else {
        reply = `${entriesString}Which message would you like to see the map of?`
      }
      if (entries.length > this.genericService.getEndIndex()) {
        reply += '\nOr to see more messages reply more'
      }
      state = State.WHICH_MAP
    } else {
      reply = 'Map is disabled, configure it with our google maps API key.'
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default Map
