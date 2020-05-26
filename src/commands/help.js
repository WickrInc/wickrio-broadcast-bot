const state = require('../state');
const logger = require('../logger');

class Help {
  static shouldExecute(messageService) {
    logger.trace('Inside should execute');
    if (messageService.getCommand() === '/help') {
      return true;
    }
    return false;
  }

  static execute() {
    const reply = '*Messages Commands*\n'
      + '/send <Message> : To send a broadcast message to a given file of user hashes or usernames\n'
      + 'To save a file of usernames or user hashes - Click the + sign and share the file with the bot\n'
      + '/broadcast <Message> : To send a broadcast message to the network or security groups\n'
      + 'To broadcast a file - Click the + sign and share the file with the bot\n'
      + 'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n'
      + '/ack : To awknowledge a broadcast message \n'
      + '/messages : To get a text file of all the messages sent to the bot\n'
      + '/status : To get the status of a broadcast message\n'
      + '/report : To get a CSV file with the status of each user for a broadcast message\n\n'
      + '*Admin Commands*\n'
      + '%{adminHelp}\n'
      + '*Other Commands*\n'
      + '/help : Show help information\n'
      + '/version : Get the version of the integration\n'
      + '/cancel : To cancel the last operation and enter a new command\n'
      + '/files : To get a list of saved files available for the /send command';
    return {
      reply,
      state: state.NONE,
    };
  }
}


module.exports = Help;
