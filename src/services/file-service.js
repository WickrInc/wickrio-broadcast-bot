class FileService {
  constructor({ messageService }) {
    this.messageService = messageService
    // this.messageService.user.fileServiceFile = ''
    // this.messageService.user.fileServiceFilename = ''
  }

  getFile() {
    return this.messageService.user.fileServiceFile
  }

  getFilePath() {
    return this.messageService.user.fileServiceFilePath
  }

  getFilename() {
    return this.messageService.user.fileServiceFilename
  }

  getOverwriteFileType() {
    return this.messageService.user.fileServiceFileType
  }

  setFile(file) {
    this.messageService.user.fileServiceFile = file
  }

  setFilePath(filePath) {
    this.messageService.user.fileServiceFilePath = filePath
  }

  setFilename(filename) {
    this.messageService.user.fileServiceFilename = filename
  }

  // .user or .hash
  setOverwriteFileType(fileType) {
    this.messageService.user.fileServiceFileType = fileType
  }
}

export default FileService
