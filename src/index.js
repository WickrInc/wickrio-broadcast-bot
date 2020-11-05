import fs from 'fs'
import startServer from './api'
import {
  bot,
  logger,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WickrIOAPI,
  WEB_APPLICATION,
  REST_APPLICATION,
} from './helpers/constants'
import Factory from './factory'

if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}

if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`)
}
// bot.runHandlers()

async function main() {
  try {
    const status = await bot.start(WICKRIO_BOT_NAME.value)

    await bot.provision({
      status,
      setAdminOnly: false,
      attachLifeMinutes: '0',
      doreceive: 'true',
      duration: '0',
      readreceipt: 'true',
      cleardb: 'false',
      contactbackup: 'false',
      convobackup: 'false',
      verifyusers: VERIFY_USERS,
      // verifyusers = { encryption: false, value: 'automatic' },
    })

    bot.startListening(listen)

    if (WEB_APPLICATION?.value === 'yes' || REST_APPLICATION?.value === 'yes') {
      startServer()
    } else {
      console.log(
        'If you wanted a web or rest interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT'
      )
    }
  } catch (err) {
    console.log(err)
  }
}

async function listen(rawMessage) {
  try {
    const messageService = bot.messageService({ rawMessage })
    const {
      // time,
      // botName,
      // messageID,
      // users,
      // ttl,
      // bor,
      // control,
      // msgTS,
      // receiver,
      // filepath,
      // file,
      // filename,
      // message,
      // command,
      // argument,
      vGroupID,
      // convoType,
      msgType,
      user,
      userEmail,
      // isAdmin,
      // latitude,
      // longitude,
      // location,
      // isVoiceMemo,
      // voiceMemoDuration,
    } = messageService

    if (!fs.existsSync(`${process.cwd()}/files/${userEmail}`)) {
      fs.mkdirSync(`${process.cwd()}/files/${userEmail}`)
    }

    const factory = new Factory({
      messageService,
    })
    let cmdResult
    if (msgType !== 'location') {
      cmdResult = factory.execute()
    }

    if (cmdResult?.reply)
      WickrIOAPI.cmdSendRoomMessage(vGroupID, cmdResult.reply)

    if (cmdResult?.state || cmdResult?.state === 0) {
      // change to broacastservice?
      user.currentState = cmdResult.state
    }
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

main()
