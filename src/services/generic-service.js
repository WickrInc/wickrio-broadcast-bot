// import APIfrom './api-service'

const maxStringLength = 50
// TODO put this in the constructor??
const inc = 10

class GenericService {
  constructor({ endIndex, messageService, apiService }) {
    // this.user = user
    this.messageService = messageService
    this.apiService = apiService
    this.messageService.defaultEndIndex = endIndex
  }

  setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    const reply = this.apiService.setMessageStatus(
      messageID,
      userID,
      statusNumber,
      statusMessage
    )
    const userArray = [userID]
    this.apiService.send1to1Message(userArray, reply, '', '', '')
    return reply
  }

  cancelMessageID(messageID) {
    return this.apiService.cancelMessageID(messageID)
  }

  getEntriesString(userEmail, abort) {
    const currentEntries = this.getMessageEntries(userEmail, abort)
    let reply
    if (
      currentEntries.length < 1 ||
      this.messageService.startIndex >= this.messageService.endIndex
    ) {
      if (abort) {
        reply = 'There are no active messages to display'
      } else {
        reply = 'There are no previous messages to display'
      }
    } else {
      let contentData
      let index = 1
      let messageString = ''
      // TODO fix extra \n in more functionality
      for (
        let i = this.messageService.startIndex;
        i < this.messageService.endIndex;
        i += 1
      ) {
        contentData = this.getMessageEntry(currentEntries[i].message_id)
        const contentParsed = JSON.parse(contentData)
        const messageDisplayed = this.truncate(
          contentParsed.message,
          maxStringLength
        )
        messageString += `(${
          this.messageService.startIndex + index
        }) ${messageDisplayed}\n`
        index += 1
      }
      reply =
        `Here are the past ${this.messageService.endIndex} broadcast message(s):\n` +
        `${messageString}`
    }
    return reply
  }

  getMessageEntries(userEmail, abort) {
    let pageNum = 0
    const pageSize = 1000
    const messageEntries = []
    while (true) {
      const tableDataRaw = this.apiService.getMessageIDTable(
        `${pageNum}`,
        `${pageSize}`,
        userEmail
      )
      const messageIDData = JSON.parse(tableDataRaw)
      const tableData = messageIDData.list
      // for (let i = tableData.length - 1; i >= 0; i -= 1) {
      for (let i = 0; i < tableData.length; i += 1) {
        const entry = tableData[i]
        if (entry.sender === userEmail) {
          // logger.debug(`Here is the entry: ${entry.status}`)
          if (abort) {
            // TODO find out what the statuses should be
            if (
              entry.status === 'sending' ||
              entry.status === 'created' ||
              entry.status === 'preparing'
            ) {
              messageEntries.push(entry)
            }
          } else {
            messageEntries.push(entry)
          }
        }
      }
      if (tableData.length < pageSize) {
        break
      }
      pageNum += 1
    }
    this.messageService.endIndex = Math.min(
      this.messageService.endIndex,
      messageEntries.length
    )
    return messageEntries
  }

  getMessageEntry(messageID) {
    return this.apiService.getMessageIDEntry(messageID)
  }

  // TODO should we trim white space too?
  truncate(str, n) {
    return str.length > n ? `${str.substr(0, n - 1)}...` : str
  }

  getEndIndex() {
    return this.messageService.endIndex
  }

  incrementIndexes() {
    this.messageService.startIndex += inc
    this.messageService.endIndex += inc
  }

  resetIndexes() {
    this.messageService.startIndex = 0
    this.messageService.endIndex = this.messageService.defaultEndIndex
  }
}

export default GenericService
