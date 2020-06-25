import State from '../state';
import { logger } from '../helpers/constants';

// TODO add a delete file command??
// TODO add the ability to preview the contents of the file/ length of file??
class FileCommand {
  constructor(sendService) {
    this.sendService = sendService;
    this.commandString = '/files';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    let reply = 'Here is a list of the files to which you can send a message:\n';
    const userEmail = messageService.getUserEmail();
    // TODO add a more function to this
    const fileArr = this.sendService.getFiles(userEmail);
    if (!fileArr || fileArr.length === 0) {
      reply = 'There aren\'t any files available for sending, please upload a file of usernames or hashes first.';
    } else {
      const length = Math.min(fileArr.length, 10);
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
    }
    return {
      reply,
      state: State.NONE,
    };
  }
}

export default FileCommand;
