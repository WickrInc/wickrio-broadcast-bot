import State from '../state'
import logger from '../logger'
import FileHandler from '../helpers/file-handler'

/*
  This class is accessed when the user is trying to upload a file that already
  exists. If their reply is yes the file will be overwritten. If it is no the
  process is cancelled.
*/
class OverwriteCheck {
  constructor({ fileService, messageService }) {
    this.fileService = fileService
    this.messageService = messageService
    this.state = State.OVERWRITE_CHECK
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const userEmail = this.messageService.getUserEmail()
    const file = this.fileService.getFile()
    logger.debug(`Here is the file${file}`)
    const filename = this.fileService.getFilename()
    const fileAppend = this.fileService.getOverwriteFileType()
    let state = State.NONE
    let reply
    // Overwrite file.
    if (this.messageService.affirmativeReply()) {
      const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`
      logger.debug(`Here is file info${file}`)
      const cp = FileHandler.copyFile(file, newFilePath)
      logger.debug(`Here is cp:${cp}`)
      if (cp) {
        reply = `File named: ${filename} successfully saved to directory.`
      } else {
        reply = `Error: File named: ${filename} not saved to directory.`
      }
      // Cancel Overwriting file.
    } else if (this.messageService.negativeReply()) {
      reply = 'File upload cancelled.'
      // Invalid response. Return to beginning of this execute function.
    } else {
      reply = 'Invalid response.\nReply (yes/no) to continue or cancel.'
      state = State.OVERWRITE_CHECK
    }
    return {
      reply,
      state,
    }
  }
}

export default OverwriteCheck
