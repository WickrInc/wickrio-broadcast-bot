import State from '../state'
import { logger } from '../helpers/logger'
import FileHandler from '../helpers/file-handler'
import ButtonHelper from '../helpers/button-helper.js'

/*
  This class is accessed when the user is trying to upload a file that already
  exists. If their reply is yes the file will be overwritten. If it is no the
  process is cancelled.
*/
class OverwriteCheck {
  constructor({ fileService, combinedService, messageService }) {
    this.fileService = fileService
    this.messageService = messageService
    this.combinedService = combinedService
    this.state = State.OVERWRITE_CHECK
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const userEmail = this.messageService.getUserEmail()
    const file = this.fileService.getFilePath()
    logger.debug(`Here is the file ${file}`)
    const filename = this.fileService.getFilename()
    const fileAppend = this.fileService.getOverwriteFileType()
    let state
    let reply
    let messagemeta
    if (file === undefined) {
      reply = `internal error: ${filename} NOT saved to directory.`
    } else {
      // Overwrite file.
      if (this.messageService.affirmativeReply()) {
        const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`
        logger.debug(`Here is file info${file}`)
        const cp = FileHandler.copyFile(file, newFilePath)
        logger.debug(`Here is cp:${cp}`)
        if (cp) {
          // reply = `File named: ${filename} successfully saved to directory.`
          if (this.combinedService.hasMessageOrFile()) {
            reply =
              'Would you like to ask the recipients for an acknowledgement?'
            messagemeta = ButtonHelper.makeYesNoButton()
            state = State.ASK_FOR_ACK
          } else {
            reply =
              'Great! Now type a message or upload the file (by clicking on the "+" sign) that you want to broadcast.'
            this.combinedService.setSendFile(`${filename}${fileAppend}`)
            state = State.CREATE_MESSAGE
          }
        } else {
          reply = `Error: File named: ${filename} not saved to directory.`
          // TODO what do we do if there's an error here?
        }
        // Cancel Overwriting file.
      } else if (this.messageService.negativeReply()) {
        reply = 'File upload cancelled.'
        // Invalid response. Return to beginning of this execute function.
        // TODO what state should we go to if they cancel?
      } else {
        reply = 'Invalid response.\nReply (yes/no) to continue or cancel.'
        messagemeta = ButtonHelper.makeYesNoButton()
        state = State.OVERWRITE_CHECK
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = OverwriteCheck
