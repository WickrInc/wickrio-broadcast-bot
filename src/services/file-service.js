class FileService {
  constructor(user) {
    this.user = user;
    // this.user.fileServiceFile = '';
    // this.user.fileServiceFilename = '';
  }

  getFile() {
    return this.user.fileServiceFile;
  }

  getFilename() {
    return this.user.fileServiceFilename;
  }

  setFile(file) {
    this.user.fileServiceFile = file;
  }

  setFilename(filename) {
    this.user.fileServiceFilename = filename;
  }
}

export default FileService;
