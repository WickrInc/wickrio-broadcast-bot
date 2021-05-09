import State from '../state'

class Status {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/status'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const userEmail = this.messageService.userEmail
    let messagemeta = {}
    let reply

    this.genericService.resetIndexes()

    // TODO add a string of status as the second parameter to this command
    const entries = this.genericService.getMessageEntries(userEmail, false)
    const entriesString = this.genericService.getEntriesString(userEmail, false)

    if (!entries || entries.length === 0) {
      reply = entriesString
    } else {
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
      console.log('status: messagemeta:' + messagemetastring)

      reply = `${entriesString}Which message would you like to see the status of?`
    }

    if (entries.length > this.genericService.getEndIndex()) {
      const startindex=reply.length

      reply += '\nOr to see more messages reply more'

      const tcrow= {
        startindex: startindex,
        endindex: reply.length,
      }
      messagemeta.textcut.push(tcrow)
    }

    return {
      reply,
      state: State.WHICH_STATUS,
      messagemeta,
    }
  }
}

module.exports = Status
