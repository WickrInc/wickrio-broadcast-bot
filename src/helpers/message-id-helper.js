
const fs = require('fs');
const logger = require('../logger');

function updateLastID() {
  try {
    let id;
    // TODO user file-handler instead??
    if (fs.existsSync('last_id.json')) {
      const data = fs.readFileSync('last_id.json');
      logger.debug(`is the data okay: ${data}`);
      const lastID = JSON.parse(data);
      id = Number(lastID) + 1;
    } else {
      id = '1';
    }
    logger.debug(`This is the id: ${id}`);
    const idToWrite = JSON.stringify(id, null, 2);
    fs.writeFileSync('last_id.json', idToWrite, (err) => {
      // Fix this
      if (err) throw err;
      logger.debug('Current Message ID saved in file');
    });
    return id.toString();
  } catch (err) {
    logger.error(err);
    return null;
  }
}

module.exports = updateLastID;
