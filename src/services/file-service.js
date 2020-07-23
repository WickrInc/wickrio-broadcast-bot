class FileService {
  constructor(user) {
    this.user = user
    // this.user.fileServiceFile = '';
    // this.user.fileServiceFilename = '';
  }

  getFile() {
    return this.user.fileServiceFile
  }

  getFilename() {
    return this.user.fileServiceFilename
  }

  getOverwriteFileType() {
    return this.user.fileServiceFileType
  }

  setFile(file) {
    this.user.fileServiceFile = file
  }

  setFilename(filename) {
    this.user.fileServiceFilename = filename
  }

  // .user or .hash
  setOverwriteFileType(fileType) {
    this.user.fileServiceFileType = fileType
  }
}

export default FileService
