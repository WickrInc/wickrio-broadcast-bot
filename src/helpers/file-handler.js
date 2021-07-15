import { logger, LIMIT_FILE_ENTRIES, FILE_ENTRY_SIZE } from './constants'
import fs from 'fs'
import util from 'util'
const execSync = require('child_process').execSync

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
    if (theFile.length === 0) {
      return true
    }
    return false
  }

  static checkFileSize(filePath) {
    let lines = 0
    try {
      const results = execSync(`wc -l < ${filePath}`)
      lines = parseInt(results)
    } catch (err) {
      logger.error(err)
    }
    if (LIMIT_FILE_ENTRIES.value === 'yes') {
      console.log(lines)
      if (lines > parseInt(FILE_ENTRY_SIZE.value)) {
        return true
      }
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

module.exports = FileHandler
