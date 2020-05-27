const state = require('../state');
const pkgjson = require('../../package.json');

class Version {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/version') {
      return true;
    }
    return false;
  }

  static execute() {
    let json = require('../../node_modules/wickrio_addon/package.json');
    const addonVersion = json.version;
    json = require('../../node_modules/wickrio-bot-api/package.json');
    const apiVersion = json.version;
    const reply = `*Versions*\nIntegration: ${process.env.npm_package_version}\n`
      + `WickrIO Addon: ${addonVersion}\n`
      + `WickrIO API: ${apiVersion}`;
    return {
      reply,
      state: state.NONE,
    };
  }
}

module.exports = Version;
