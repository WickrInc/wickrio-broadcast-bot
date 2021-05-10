import { BOT_MAPS } from '../helpers/constants'
import State from '../state'
const mapEnabled = BOT_MAPS.value === 'yes'

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
    let messagemeta = {}

    if (mapEnabled === true) {
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

        messagemeta = {
          table: {
            name: 'List of Sent Broadcasts',
            firstcolname: 'Message',
            actioncolname: 'Select',
            rows: [],
          },
          textcut: [
            {
              startindex: 0,
              endindex: entriesString.length - 1,
            },
          ],
        }
        for (let i = 0; i < entries.length; i++) {
          const response = i + 1
          const row = {
            firstcolvalue: entries[i].message,
            response: response.toString(),
          }
          messagemeta.table.rows.push(row)
        }
      }

      // If the number of messages is greater than the end index
      // then let the user know about the "more" command
      if (entries.length > this.genericService.getEndIndex()) {
        const startindex = reply.length

        reply += '\nOr to see more messages reply more'

        const tcrow = {
          startindex: startindex,
          endindex: reply.length,
        }
        messagemeta.textcut.push(tcrow)
      }

      state = State.WHICH_MAP
    } else {
      reply = 'Map is disabled, configure it with our google maps API key.'
      state = State.NONE
    }

    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = Map
