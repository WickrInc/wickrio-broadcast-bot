import { logger, LIMIT_FILE_ENTRIES, FILE_ENTRY_SIZE } from './constants'
import ButtonHelper from './button-helper'
import fs from 'fs'
import util from 'util'
import State from '../state'

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

  static checkFileUpload(
    fileService,
    filename,
    filePath,
    fileArr,
    fileAppend,
    userEmail
  ) {
    let reply
    let state
    let messagemeta = {}
    if (!filename.endsWith('.txt')) {
      reply = `File: ${filename} is not the proper format. File must be a text (.txt) file`
    } else if (FileHandler.checkFileBlank(filePath)) {
      // Make sure the file is not blank.
      reply = `File: ${filename} is empty. Please send a list of usernames`
      // If file already exists go to the overwrite check state
    } else if (FileHandler.checkFileSize(filePath)) {
      reply = `This user file has more than ${FILE_ENTRY_SIZE.value} entries. Please reduce the number of entries and try uploading it again.`
    } else if (fileArr.includes(`${filename}${fileAppend}`)) {
      fileService.setOverwriteFileType(fileAppend)
      reply =
        'Warning : File already exists in user directory.\nIf you continue you will overwrite the file.\nReply (yes/no) to continue or cancel.'
      messagemeta = ButtonHelper.makeYesNoButton()
      state = State.OVERWRITE_CHECK
      // Upload new file to the user directory
    } else {
      console.log('file actions user or hash, should copy file')
      const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`
      console.log({
        filePath,
        newFilePath,
        userEmail,
        fileName: filename.toString(),
        fileAppend,
      })

      const cp = FileHandler.copyFile(filePath, newFilePath)

      if (cp) {
        reply = `File named: ${filename} successfully saved to directory.`
      } else {
        reply = `Error: File named: ${filename} not saved to directory.`
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = FileHandler
