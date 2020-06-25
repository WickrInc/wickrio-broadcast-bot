import State from '../state';
import { logger } from '../helpers/constants';

// This class is used to select which file the user wants to delete.

class DeleteFileCommand {
  constructor(sendService) {
    this.sendService = sendService;
    this.commandString = '/delete';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    let reply = 'Here is a list of the files that you can delete:\n';
    let state = State.NONE;
    const userEmail = messageService.getUserEmail();
    // TODO add a more function to this
    const fileArr = this.sendService.getFiles(userEmail);
    if (!fileArr || fileArr.length === 0) {
      reply = 'There are no files to delete.';
    } else {
      const length = Math.min(fileArr.length, 10);
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`;
      }
      state = State.DELETE_FILE;
    }
    return {
      reply,
      state,
    };
  }
}

export default DeleteFileCommand;
