// import { logger } from './constants'

class ButtonHelper {
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
}

export default ButtonHelper
