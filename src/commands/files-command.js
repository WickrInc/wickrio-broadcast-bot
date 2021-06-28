import State from '../state'

// TODO add the ability to preview the contents of the file/ length of file??
class FileCommand {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/files'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    let reply = 'Here is a list of the files to which you can send a message:\n'
    let state = State.NONE
    let messagemeta = {}
    const userEmail = this.messageService.userEmail

    // TODO add a more function to this
    const fileArr = this.sendService.getFiles(userEmail)
    if (!fileArr || fileArr.length === 0) {
      reply =
        "There aren't any files available for sending, please upload a file of usernames or hashes first."
    } else {
      const basereplylength = reply.length

      messagemeta = {
        table: {
          name: 'List of files',
          firstcolname: 'Name',
          secondcolname: 'Type',
          actioncolname: 'Select',
          rows: [],
        },
      }
      // const length = Math.min(fileArr.length, 10)
      const length = fileArr.length

      for (let index = 0; index < length; index += 1) {
        let fileName = fileArr[index]
        let fileType
        if (fileName.endsWith('.user')) {
          fileType = 'User file'
          fileName = fileName.slice(0, -5)
        } else if (fileName.endsWith('.hash')) {
          fileType = 'Hash file'
          fileName = fileName.slice(0, -5)
        }
        reply += `(${index + 1}) ${fileName}\n`

        const response = index + 1
        const row = {
          firstcolvalue: fileName,
          secondcolvalue: fileType,
          response: response.toString(),
        }
        messagemeta.table.rows.push(row)
      }

      // Add the area of text to cut for clients that handle lists
      messagemeta.textcut = [
        {
          startindex: basereplylength - 1,
          endindex: reply.length,
        },
      ]

      state = State.SEND_USER_FILE
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = FileCommand
