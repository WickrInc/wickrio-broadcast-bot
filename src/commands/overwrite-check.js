import State from '../state';
import logger from '../logger';
import FileHandler from '../helpers/file-handler';

/*
  This class is accessed when the user is trying to upload a file that already
  exists. If their reply is yes the file will be overwritten. If it is no the
  process is cancelled.
*/
class OverwriteCheck {
  constructor(fileService) {
    this.fileService = fileService;
    this.state = State.OVERWRITE_CHECK;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    const userEmail = messageService.getUserEmail();
    const type = messageService.getMessage().toLowerCase();
    const file = this.fileService.getFile();
    logger.debug(`Here is the file${file}`);
    const filename = this.fileService.getFilename();
    const fileAppend = this.fileService.getOverwriteFileType();
    let state = State.NONE;
    let reply;
    // Overwrite file.
    if (type === 'yes' || type === 'y') {
      const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`;
      logger.debug(`Here is file info${file}`);
      const cp = FileHandler.copyFile(file, newFilePath);
      logger.debug(`Here is cp:${cp}`);
      if (cp) {
        reply = `File named: ${filename} successfully saved to directory.`;
      } else {
        reply = `Error: File named: ${filename} not saved to directory.`;
      }
    // Cancel Overwriting file.
    } else if (type === 'no' || type === 'n') {
      reply = 'File upload cancelled.';
    // Invalid response. Return to beginning of this execute function.
    } else {
      reply = 'Invalid response.\nReply (yes/no) to continue or cancel.';
      state = State.OVERWRITE_CHECK;
    }
    const obj = {
      reply,
      state,
    };
    return obj;
  }
}

export default OverwriteCheck;
