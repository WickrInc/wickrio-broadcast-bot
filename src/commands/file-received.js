import State from '../state';

// TODO add a delete file command??
class FileReceived {
  constructor(fileService) {
    this.fileService = fileService;
  }

  shouldExecute(messageService) {
    console.log(this.fileService);
    // if (messageService.getFile().length !== 0 && messageService.getFile() !== '') {
    const file = messageService.getFile();
    console.log(`GILE${messageService.getFile()}`);
    console.log(`GILE2${file}`);
    // if (
    //   messageService.getFile() !== undefined
    //   && messageService.getFile().length !== 0
    //   && messageService.getFile() !== ''
    // ) {
    if (file) {
      console.log(`Am i insane?${file}`);
      return true;
    }
    return false;
  }

  execute(messageService) {
    this.fileService.setFile(messageService.getFile());
    this.fileService.setFilename(messageService.getFilename());
    const reply = 'Would you like to broadcast this file, send this file to a list, or is it a file of usernames or hashes? Please respond with (b)roadcast, (s)end, (u)ser, or (h)ash';
    const obj = {
      reply,
      state: State.FILE_TYPE,
    };
    return obj;
  }
}

export default FileReceived;
