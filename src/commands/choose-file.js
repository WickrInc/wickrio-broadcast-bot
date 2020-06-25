import logger from '../logger';
import State from '../state';

const fs = require('fs');

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
    const index = messageService.getMessage();
    let reply = null;
    let obj;
    const fileArr = this.sendService.getFileArr();
    const fileName = fileArr[parseInt(index, 10) - 1];
    if (this.checkFileBlank(fileName)) {
      reply = 'File selected is empty.';
      obj = {
        reply,
        state: State.CHOOSE_FILE,
      };
    } else if (!messageService.isInt() || index < 1 || index > fileArr.length) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${fileArr.length}`;
      obj = {
        reply,
        state: State.CHOOSE_FILE,
      };
    } else {
      // logger.debug('here is the other fileArr', fileArr, '\n');
      // TODO check for errors first!! return from send
      reply = 'Message sent to users from the file: ';
      // const fileName = fileArr[parseInt(index, 10) - 1];
      reply += fileName;
      // TODO should I set the fileName as a variable of sendService??
      this.sendService.sendToFile(fileName);
      obj = {
        reply,
        state: State.NONE,
      };
    }
    return obj;
  }

  // Function that checks if a file is blank.
  // eslint-disable-next-line class-methods-use-this
  checkFileBlank(fName) {
    const dir = `${process.cwd()}/files/`;
    const fPath = dir + fName;
    const theFile = fs.readFileSync(fPath, 'utf-8').trim();
    if (theFile.length === 0) {
      return true;
    }
    return false;
  }
}

export default ChooseFile;
