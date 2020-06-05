import State from '../state';

// TODO add a delete file command??
class FileReceived {
  static shouldExecute() {
  }

  static execute() {
    const reply = 'Would you like to broadcast this file, send this file to a list, or is it a file of usernames or hashes? Please respond with (b)roadcast, (s)end, (u)ser, or (h)ash';
    const obj = {
      reply,
      state: State.FILE_TYPE,
    };
    return obj;
  }
}

module.exports = FileReceived;
