import State from '../state';
import logger from '../logger';
import FileHandler from '../helpers/file-handler';

class FileActions {
  static shouldExecute(messageService) {
    if (messageService.getCurrentState() === State.FILE_TYPE) {
      return true;
    }
    return false;
  }

  static async execute(messageService, file, filename) {
    const type = messageService.getMessage().toLowerCase();
    let fileAppend = '';
    // const file = messageService.getFile();
    let state;
    let reply;
    logger.debug(`Here is the filetype message${type}`);
    if (type === 'u' || type === 'user') {
      fileAppend = '.user';
    } else if (type === 'h' || type === 'hash') {
      fileAppend = '.hash';
    } else if (type === 's' || type === 'send') {
      logger.debug('Let\'s send that file!');
    } else {
      reply = 'Input not recognized please reply with (u)ser, (h)ash, or (s)end.';
      state = State.FILE_TYPE;
    }
    if (fileAppend) {
      logger.debug(`Here is file info${file}`);
      const cp = await FileHandler.copyFile(file.toString(), `${process.cwd()}/files/${filename.toString()}${fileAppend}`);
      logger.debug(`Here is cp:${cp}`);
      if (cp) {
        reply = `File named: ${filename} successfully saved to directory.`;
      } else {
        reply = `Error: File named: ${filename} not saved to directory.`;
      }
    }
    return {
      reply,
      state,
    };
  }
}

export default FileActions;
