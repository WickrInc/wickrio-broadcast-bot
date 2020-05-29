import State from '../state';


class Cancel {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/cancel') {
      return true;
    }
    return false;
  }

  static execute() {
    const reply = 'Previous command canceled, send a new command or enter /help for a list of commands.';
    const obj = {
      reply,
      state: State.NONE,
    };
    return obj;
  }
}

export default Cancel;
