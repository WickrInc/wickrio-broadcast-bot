const logger = require('../logger');
const State = require('../state');

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

  execute(messageService) {
    const index = messageService.getMessage();
    let reply = null;
    let obj;
    const fileArr = this.sendService.getFileArr();
    const length = Math.min(fileArr.length, 5);
    if (!messageService.isInt() || index < 1 || index > length) {
      reply = `Index: ${index} is out of range. Please enter a number between 1 and ${length}`;
      obj = {
        reply,
        state: State.CHOOSE_FILE,
      };
    } else {
      // logger.debug('here is the other fileArr', fileArr, '\n');
      // TODO check for errors first!! return from send
      reply = 'Message sent to users from the file: ';
      const fileName = fileArr[parseInt(index, 10) - 1];
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
}

module.exports = ChooseFile;
