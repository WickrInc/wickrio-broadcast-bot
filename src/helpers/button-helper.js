// import { logger } from './constants'

class ButtonHelper {
  // TODO replace entries parameter with table
  static makeButtonList(
    tableName,
    colName,
    colAction,
    cutStartIndex,
    cutEndIndex,
    entries
  ) {
    const tablestring = JSON.stringify(entries)
    console.log('report: table:' + tablestring)
    let messageMeta = {}

    messageMeta = {
      table: {
        name: tableName,
        firstcolname: colName,
        actioncolname: colAction,
        rows: [],
      },
      textcut: [
        {
          startindex: cutStartIndex,
          endindex: cutEndIndex,
        },
      ],
    }
    for (let i = 0; i < entries.length; i++) {
      const response = i + 1
      const row = {
        firstcolvalue: entries[i],
        response: response.toString(),
      }
      messageMeta.table.rows.push(row)
    }

    const messageMetaString = JSON.stringify(messageMeta)
    console.log('report: messageMeta:' + messageMetaString)
    return messageMeta
  }

  static makeYesNoButton() {
    return {
      buttons: [
        {
          type: 'message',
          text: 'Yes',
          message: 'yes',
        },
        {
          type: 'message',
          text: 'No',
          message: 'no',
        },
        {
          type: 'message',
          text: 'Cancel',
          message: '/cancel',
        },
      ],
    }
  }

  static makeMessageButtons(buttonArray) {
    const buttons = []
    for (const button of buttonArray) {
      buttons.push({
        type: 'message',
        text: button,
        message: button,
      })
    }
    return { buttons }
  }

  static makeCancelButtons(buttonArray) {
    const buttons = []
    for (const button of buttonArray) {
      buttons.push({
        type: 'message',
        text: button,
        message: button,
      })
    }
    buttons.push({
      type: 'message',
      text: 'Cancel',
      message: '/cancel',
    })
    return { buttons }
  }
}

export default ButtonHelper
