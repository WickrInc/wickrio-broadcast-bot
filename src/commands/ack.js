import { NONE } from '../state';
import GenericService from '../services/generic-service';


class Ack {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/ack') {
      return true;
    }
    return false;
  }

  static execute(messageService) {
    GenericService.setMessageStatus('', messageService.getUserEmail(), '3', '');
    const reply = '';
    const obj = {
      reply,
      state: NONE,
    };
    return obj;
  }
}

export default Ack;
