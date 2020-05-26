const logger = require('../logger');
const state = require('../state');

// TODO add a delete file command??
// TODO add the ability to preview the contents of the file/ length of file??
// TODO this command should return the files that are saved
class FileCommand {
  // TODO is this the proper way? or should should execute be static?
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
    this.commandString = '/files';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute() {
    let reply = 'Here is a list of the files to which you can send a message:\n';
    const fileArr = this.broadcastService.getFiles();
    const length = Math.min(fileArr.length, 5);
    for (let index = 0; index < length; index += 1) {
      reply += `(${index + 1}) ${fileArr[index]}\n`;
    }
    const obj = {
      reply,
      state: state.NONE,
    };
    return obj;
  }
}

module.exports = FileCommand;
