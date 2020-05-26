
const WickrIOAPI = require('wickrio_addon');
const fs = require('fs');
const { exec, execSync, execFileSync } = require('child_process');
const logger = require('../logger');

// let whitelist;

class WhitelistRepository {

  constructor(fs) {
    logger.debug('Getting whitelist');
    const tokens = JSON.parse(process.env.tokens);
    if (tokens.WHITELISTED_USERS.encrypted) {
      this.whitelist = WickrIOAPI.cmdDecryptString(tokens.WHITELISTED_USERS.value);
    } else {
      this.whitelist = tokens.WHITELISTED_USERS.value;
    }
    logger.debug(`whitelist before split${this.whitelist}`);
    this.whitelist = this.whitelist.split(',');

    // Make sure there are no white spaces on the whitelisted users
    for (let i = 0; i < this.whitelist.length; i++) {
      this.whitelist[i] = this.whitelist[i].trim();
    }
    logger.debug(`whitelist in getwhitelist${this.whitelist.toString()}`);
  }

  getWhitelist() {
    return this.whitelist;
  }
  //    try {
  //      processes = fs.readFileSync('./processes.json', 'utf-8');
  //      if (!processes) {
  //        console.error("Error reading processes.json!")
  //        return;
  //      }
  //    } catch (err) {
  //      console.error(err);
  //      return;
  //    }
  //    var pjson = JSON.parse(processes);
  //    //let whitelistedUsers =
  //    return pjson.apps[0].env.tokens.WHITELISTED_USERS.value.split(',');

  updateWhitelist(wlUsers) {
    this.whitelist = wlUsers;
    let processes;
    try {
      processes = fs.readFileSync('./processes.json', 'utf-8');
      if (!processes) {
        logger.error('Error reading processes.json!');
        return;
      }
    } catch (err) {
      logger.error(err);
      return;
    }

    const pjson = JSON.parse(processes);
    logger.debug(pjson.apps[0].env.tokens.WHITELISTED_USERS.value);

    // var wlUsers = getWhitelistedUsers().join(','); // whitelisted_users.join(',');
    const usersString = wlUsers.join(',');

    if (pjson.apps[0].env.tokens.WHITELISTED_USERS.encrypted) {
      const wlUsersEncrypted = WickrIOAPI.cmdEncryptString(usersString);
      pjson.apps[0].env.tokens.WHITELISTED_USERS.value = wlUsersEncrypted;
    } else {
      pjson.apps[0].env.tokens.WHITELISTED_USERS.value = usersString;
    }

    logger.debug('pjson', pjson.apps[0].env.tokens.WHITELISTED_USERS.value);

    try {
      const cp = execSync('cp processes.json processes_backup.json');
      const ps = fs.writeFileSync('./processes.json', JSON.stringify(pjson, null, 2));
    } catch (err) {
      logger.error(err);
    }
  }
}

module.exports = WhitelistRepository;
