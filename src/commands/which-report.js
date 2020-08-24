import State from '../state'

// TODO combine which report and which status
class WhichReport {
  constructor({ genericService, reportService, messageService }) {
    this.genericService = genericService
    this.reportService = reportService
    this.messageService = messageService
    this.state = State.WHICH_REPORT
  }

  shouldExecute() {
    const { userEmail } = this.messageService.getMessageData()

    const userCurrentState = this.messageService.getUserCurrentState({
      userEmail,
    })
    if (userCurrentState === this.state) {
      return true
    }
    return false
  }

  execute() {
    let reply
    let state
    const userEmail = this.messageService.getUserEmail()
    const currentEntries = this.genericService.getMessageEntries(
      userEmail,
      false
    )
    const index = this.messageService.getMessage()
    const endIndex = this.genericService.getEndIndex()
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = this.genericService.getEntriesString(userEmail)
      if (currentEntries.length > this.genericService.getEndIndex()) {
        reply += 'Or to see more messages reply more'
      }
      state = this.state
    } else if (!this.messageService.isInt() || index < 1 || index > endIndex) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${endIndex}`
      state = this.state
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`
      const csvArray = this.reportService.getReport(
        messageID,
        this.messageService.getVGroupID()
      )
      state = State.NONE
      if (!csvArray || csvArray.length === 0) {
        reply =
          'Message is still preparing to send please try the report command again later'
      }
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichReport
