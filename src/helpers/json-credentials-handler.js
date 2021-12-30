import fs from 'fs'
import logger from './logger'

class JSONCredentialsHandler {
  constructor(defaultData, credentialFile) {
    this.defaultData = defaultData
    this.credentialFile = credentialFile
  }

  readCredentials = () => {
    // TODO improve this!
    if (fs.existsSync(this.credentialFile)) {
      try {
        const rawCreds = fs.readFileSync(this.credentialFile, (err, data) => {
          // TODO need more error handling here!
          if (err) {
            logger.error({ err })
            throw err
          } else if (data.length === 0) {
            logger.warn(`${this.credentialFile} is empty`)
            return this.writeDefaultFile()
          } else if (data) {
            return data
          }
        })
        const parsedCreds = JSON.parse(rawCreds)
        return parsedCreds
      } catch (err) {
        logger.error(err)
        logger.warn('Credential file could not be read')
      }
    }
    return this.writeDefaultFile()
  }

  writeDefaultFile() {
    try {
      fs.writeFile(
        this.credentialFile,
        JSON.stringify(this.defaultData),
        err => {
          if (err) {
            logger.error({ err })
          }
          logger.debug('creating credenitals.json')
        }
      )
      logger.debug({ defaultData: this.defaultData })
      return this.defaultData
    } catch (err) {
      logger.error(`Failed to write to ${this.credentialFile}`)
    }
  }

  saveData(writeObject) {
    fs.writeFile(this.credentialFile, JSON.stringify(writeObject), err => {
      if (err) return logger.debug(err)
      logger.verbose('Current data saved in file')
    })
  }
}

export default JSONCredentialsHandler
