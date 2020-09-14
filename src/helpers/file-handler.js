import { logger } from './constants'
import fs from 'fs'
import util from 'util'

util.promisify(fs.copyFile)

class FileHandler {
  static listFiles(path) {
    console.log('File Handler list files')
    console.log({ path })
    console.log({ 'list files': fs.readdirSync(path) })
    return fs.readdirSync(path)
    // return readdir(path);
  }

  // TODO this should be Aysnc
  static async copyFile(originalPath, newPath) {
    try {
      // await copyFileAsync(originalPath, newPath);
      fs.copyFileSync(originalPath, newPath)
      logger.debug(`${originalPath} copied to ${newPath}`)
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  }

  // Function that checks if a file is blank.
  static checkFileBlank(filePath) {
    const theFile = fs.readFileSync(filePath, 'utf-8').trim()
    console.log({ theFile })
    if (theFile.length === 0) {
      return true
    }
    return false
  }

  // Funtion to delete a user or hash file.
  static deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  }
}

export default FileHandler
