import State from '../state';
import logger from '../logger';
import FileHandler from '../helpers/file-handler';

class FileActions {
  constructor(fileService, broadcastService, sendService) {
    this.fileService = fileService;
    this.broadcastService = broadcastService;
    this.sendService = sendService;
    this.state = State.FILE_TYPE;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    const file = this.fileService.getFile();
    logger.debug(`Here is the file${file}`);
    const filename = this.fileService.getFilename();
    const type = messageService.getMessage().toLowerCase();
    const userEmail = messageService.getUserEmail();
    let fileAppend = '';
    let state = State.NONE;
    let reply;
    if (type === 'u' || type === 'user') {
      fileAppend = '.user';
    } else if (type === 'h' || type === 'hash') {
      fileAppend = '.hash';
    } else if (type === 's' || type === 'send') {
      this.sendService.setFile(file);
      this.sendService.setDisplay(filename);
      this.sendService.setMessage(messageService.getArgument());
      this.sendService.setUserEmail(messageService.getUserEmail());
      this.sendService.setVGroupID(messageService.getVGroupID());
      this.sendService.setTTL('');
      this.sendService.setBOR('');
      reply = 'To which list would you like to send your message:\n';
      const fileArr = this.sendService.getFiles(userEmail);
      const length = Math.min(fileArr.length, 10);
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
      state = State.CHOOSE_FILE;
    } else if (type === 'b' || type === 'broadcast') {
      this.broadcastService.setFile(file);
      this.broadcastService.setDisplay(filename);
      this.broadcastService.setMessage(messageService.getArgument());
      this.broadcastService.setUserEmail(messageService.getUserEmail());
      this.broadcastService.setVGroupID(messageService.getVGroupID());
      this.broadcastService.setTTL('');
      this.broadcastService.setBOR('');
      this.broadcastService.setSentByFlag(true);
      reply = 'Would you like to ask the recipients for an acknowledgement?';
      state = State.ASK_FOR_ACK;
    } else {
      reply = 'Input not recognized, please reply with (b)roadcast, (s)end, (u)ser, or (h)ash';
      state = State.FILE_TYPE;
    }
    logger.debug(`fileAppend:${fileAppend}`);
    if (fileAppend === '.user' || fileAppend === '.hash') {
      const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`;
      if (FileHandler.checkFileBlank(file)) {
        reply = `File: ${filename} is empty. Please send a list of usernames or hashes`;
      } else {
        logger.debug(`Here is file info${file}`);
        const cp = FileHandler.copyFile(file, newFilePath);
        logger.debug(`Here is cp:${cp}`);
        if (cp) {
          reply = `File named: ${filename} successfully saved to directory.`;
        } else {
          reply = `Error: File named: ${filename} not saved to directory.`;
        }
      }
    }
    return {
      reply,
      state,
    };
  }
}

export default FileActions;
