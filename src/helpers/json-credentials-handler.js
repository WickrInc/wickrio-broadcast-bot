import fs from 'fs'
import logger from '../logger'

class JSONCredentialsHandler {
  constructor(defaultData, credentialFile) {
    this.defaultData = defaultData
    this.credentialFile = credentialFile
  }

  readCredentials = () => {
    // TODO improve this!
    if (!fs.existsSync(this.credentialFile)) {
      fs.writeFile(
        this.credentialFile,
        JSON.stringify(this.defaultData),
        err => {
          if (err) logger.error({ err })
          logger.debug('creating credenitals.json')
        }
      )
      console.log({ defaultData: this.defaultData })
      return this.defaultData
    }
    const rawcreds = fs.readFileSync(this.credentialFile, (err, data) => {
      // TODO need more error handling here!
      if (err) {
        console.log({ err })
      } else if (data) {
        return data
      }
    })
    const parsedCreds = JSON.parse(rawcreds)
    return parsedCreds
  }

  saveData(writeObject) {
    fs.writeFile(this.credentialFile, JSON.stringify(writeObject), err => {
      if (err) return console.log(err)
      logger.trace('Current data saved in file')
    })
  }
}

export default JSONCredentialsHandler
