import State from '../state'
import logger from '../helpers/logger'

class Report {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/report'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  async execute() {
    const userEmail = this.messageService.userEmail
    this.genericService.resetIndexes()
    const entriesString = await this.genericService.getEntriesString(userEmail)
    const entries = await this.genericService.getMessageEntries(userEmail, false)
    let reply
    let messagemeta = {}
    if (!entries || entries.length === 0) {
      reply = entriesString
    } else {
      reply = `${entriesString}To get started, select the broadcast for which you would like to generate a report`

      const tablestring = JSON.stringify(entries)
      logger.verbose('report: table:' + tablestring)

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

      const messagemetastring = JSON.stringify(messagemeta)
      logger.verbose('report: messagemeta:' + messagemetastring)
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

    return {
      reply,
      state: State.WHICH_REPORT,
      messagemeta,
    }
  }
}

module.exports = Report
