class FileService {
  constructor() {
    this.file = '';
    this.filename = '';
  }

  getFile() {
    return this.file;
  }

  getFilename() {
    return this.filename;
  }

  setFile(file) {
    this.file = file;
  }

  setFilename(filename) {
    this.filename = filename;
  }
}

export default FileService;
