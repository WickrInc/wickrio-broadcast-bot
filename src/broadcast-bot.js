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
import writer from './helpers/message-writer.js'
import Factory from './factory'
import GenericService from './services/generic-service'

let verifyUsersMode

// STANDARDIZE BELOW -----------
process.stdin.resume() // so the program will not close instantly

process.stdin.resume() // so the program will not close instantly

if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}

if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`)
}

async function exitHandler(options, err) {
  try {
    await bot.close()
    if (err || options.exit) {
      logger.error('Exit reason:', err)
      process.exit()
    } else if (options.pid) {
      process.kill(process.pid)
    }
  } catch (err) {
    logger.error(err)
  }
}

// catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

// TODO clear these values!
// TODO make these user variables??

// catches uncaught exceptions
// TODO make this more robust of a catch

process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
// STANDARDIZE ABOVE -----------

async function main() {
  try {
    const status = await bot.start(WICKRIO_BOT_NAME.value)

    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      })
    }

    // TODO set to true and send from a non admin and see what happens
    bot.setAdminOnly(false)

    // set the verification mode to true
    if (VERIFY_USERS.encrypted) {
      verifyUsersMode = WickrIOAPI.cmdDecryptString(VERIFY_USERS.value)
    } else {
      verifyUsersMode = VERIFY_USERS.value
    }

    bot.setVerificationMode(verifyUsersMode)

    WickrIOAPI.cmdSetControl('cleardb', 'true')
    WickrIOAPI.cmdSetControl('contactbackup', 'false')
    WickrIOAPI.cmdSetControl('convobackup', 'false')
    WickrIOAPI.cmdSetControl('readreceipt', 'true')

    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen)

    if (WEB_APPLICATION.value === 'yes' || REST_APPLICATION.value === 'yes') {
      // run server
      startServer()
    } else {
      console.log(
        'If you wanted a web or rest interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT'
      )
    }
    // await bot.startListening(listen); //Passes a callback function that will receive incoming messages into the bot client
  } catch (err) {
    console.log(err)
  }
}

async function listen(rawMessage) {
  try {
    console.log({ rawMessage })
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
      message,
      // command,
      // argument,
      vGroupID,
      // convoType,
      msgType,
      user,
      userEmail,
      isAdmin,
      latitude,
      longitude,
      // location,
      // isVoiceMemo,
      // voiceMemoDuration,
    } = messageService.getMessageData()

    if (!fs.existsSync(`${process.cwd()}/files/${userEmail}`)) {
      fs.mkdirSync(`${process.cwd()}/files/${userEmail}`)
    }

    // acknowledges all messages sent to user
    // move to factory?
    if (msgType === 'location') {
      const obj = {
        location: {
          latitude: latitude,
          longitude: longitude,
        },
      }
      const statusMessage = JSON.stringify(obj)
      const genericService = new GenericService(10, user)
      genericService.setMessageStatus('', `${userEmail}`, '3', statusMessage)
      // user.currentState = State.NONE

      return
    }

    // Go back to dev toolkit and fix
    /*
      if (!parsedMessage) {
        // why are we writing?
        await writer.writeFile(rawMessage)
        return
      }
    if(convoType === 'personal') {
      personalVGroupID = vGroupID;
    } else {
      writer.writeFile(message);
      return;
    }
    */

    const factory = new Factory({ messageService })

    // Send the location as an acknowledgement
    // TODO create a pre-admin factory method with all the commands that are pre-admin

    // if (command === '/ack') {
    //   const userEmailString = `${userEmail}`
    //   genericService.setMessageStatus('', userEmailString, '3', '')
    //   user.currentState = State.NONE
    //   return
    // }

    if (!isAdmin) {
      const reply = `Hey this bot is just for announcements and can't respond to you personally, or ${userEmail} is not authorized to use this bot. If you have a question, please get a hold of us a support@wickr.com or visit us a support.wickr.com. Thanks, Team Wickr`
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      logger.debug({ sMessage })
      writer.writeFile(message)
      return
    }

    // TODO is this JSON.stringify necessary??
    // How to deal with duplicate files??
    // TODO parse argument better??
    const cmdResult = factory.execute()

    if (cmdResult?.reply) {
      console.log({ vGroupID, reply: cmdResult.reply })
      WickrIOAPI.cmdSendRoomMessage(vGroupID, cmdResult.reply)
    }
    if (cmdResult?.state) user.currentState = cmdResult.state
    // messageService.updateUserStateInDB({ currentState: cmdResult.state })
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

main()
