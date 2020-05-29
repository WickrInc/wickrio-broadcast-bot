import State from '../state';

// TODO add a delete file command??
class FileReceived {
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
  }

  shouldExecute() {

  }

  execute() {
    const reply = 'Would you like to send this file or is it a file of usernames or hashes? (Please respond with s(end), u(ser), or h(ash)';
    const obj = {
      reply,
      state: State.FILE_TYPE,
    };
    return obj;
  }
}

module.exports = FileReceived;
