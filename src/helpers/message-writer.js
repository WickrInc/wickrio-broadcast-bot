'use strict'

import fs from 'fs'
import { logger } from './constants'

const writeFile = message => {
  const path = process.cwd() + '/attachments/messages.txt'
  fs.appendFile(path, message + '\n', function (err) {
    if (err) {
      return logger.error(err)
    }
    // logger.verbose("The file was saved!");
  })
}

export default writeFile
