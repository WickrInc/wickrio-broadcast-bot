import logger from '../logger';
import State from '../state';
import FileHandler from '../helpers/file-handler';

class ChooseFile {
  constructor(sendService) {
    this.sendService = sendService;
    this.state = State.CHOOSE_FILE;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  // TODO add more function here as well
  execute(messageService) {
    const userEmail = messageService.getUserEmail();
    const index = messageService.getMessage();
    let reply = null;
    let obj;
    const fileArr = this.sendService.getFiles(userEmail);
    // const length = Math.min(fileArr.length, 5);
    if (!messageService.isInt() || index < 1 || index > fileArr.length) {
      reply = `Index: ${index} is out of range. Please enter an integer between 1 and ${fileArr.length}`;
      return {
        reply,
        state: State.CHOOSE_FILE,
      };
    }
    // Subtract one to account for 0 based indexing
    const fileName = fileArr[parseInt(index, 10) - 1];
    if (FileHandler.checkFileBlank(fileName)) {
      reply = 'File selected is empty.';
      obj = {
        reply,
        state: State.CHOOSE_FILE,
      };
    } else {
      // TODO check for errors first!! return from send
      // TODO should the fileName be a variable of sendService??
      this.sendService.sendToFile(fileName);
      reply = `Message sent to users from the file: ${fileName}`;
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }
}

export default ChooseFile;
