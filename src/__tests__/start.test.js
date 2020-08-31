import * as WickrIOBotAPI from 'wickrio-bot-api'
import BroadcastService from '../services/broadcast-service'
import { APIService, StatusService } from '../services'
import dotenv from 'dotenv'

dotenv.config()
// import path from 'path'

describe('Connecting', () => {
  const bot = new WickrIOBotAPI.WickrIOBot()
  it('should test the Bot object, ensuring the bot connects', async () => {
    const status = await bot.start(
      JSON.parse(process.env.tokens).WICKRIO_BOT_NAME.value
    )
    expect(status).toEqual(true)
  })
  it('should send a successful broadcast 1 to 1', async () => {
    // const bot = new WickrIOBotAPI.WickrIOBot()

    const apiService = APIService
    const broadcastService = new BroadcastService({
      messageService: { user: {} },
      apiService,
    })
    broadcastService.setMessage(
      'broadcast from jest test for the broadcast bot!'
    )
    broadcastService.setUserEmail('jest test')
    broadcastService.setVGroupID(
      '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c' // security group 6
    )
    broadcastService.setTTL('')
    broadcastService.setBOR('')
    broadcastService.setSentByFlag(true)

    const reply = broadcastService.broadcastMessage()
    expect(reply.pending).toEqual('Broadcast message in process of being sent')
  })
  it('should send a successful broadcast to a single Security Group ', async () => {
    const statusService = new StatusService()
    const broadcastService = new BroadcastService({
      messageService: { user: {} },
      apiService: APIService,
      statusService,
    })
    broadcastService.setMessage(
      'broadcast from jest test for the broadcast bot!'
    )
    broadcastService.setUserEmail('jest test')
    broadcastService.setUsers(
      // security group 6
      ['alane+largeroom@wickr.com']
    )
    broadcastService.setTTL('')
    broadcastService.setBOR('')
    broadcastService.setSentByFlag(true)
    const reply = broadcastService.broadcastMessage()
    expect(reply.pending).toEqual(
      'Broadcast message in process of being sent to list of users'
    )
  })
  // it('should send a successful broadcast to multiple Security Groups ', async () => {
  //   const apiService = new APIService()
  //   const statusService = new StatusService()
  //   const broadcastService = new BroadcastService({
  //     messageService: { user: {} },
  //     apiService,
  //     statusService,
  //   })
  //   broadcastService.setMessage(
  //     'broadcast from jest test for the broadcast bot!'
  //   )
  //   broadcastService.setUserEmail('jest test')
  //   broadcastService.setUsers(
  //     ['alane+largeroom@wickr.com'] // security group 6
  //   )
  //   broadcastService.setTTL('')
  //   broadcastService.setBOR('')
  //   broadcastService.setSentByFlag(true)
  //   const reply = broadcastService.broadcastMessage()
  //   expect(reply.pending).toEqual(
  //     'Broadcast message in process of being sent to list of users'
  //   )
  // })
  // it('should send a successful broadcast to the whole network', async () => {
  //   const apiService = new APIService()
  //   const statusService = new StatusService()
  //   const broadcastService = new BroadcastService({
  //     messageService: { user: {} },
  //     apiService,
  //     statusService,
  //   })
  //   broadcastService.setMessage(
  //     'broadcast from jest test for the broadcast bot!'
  //   )
  //   broadcastService.setUserEmail('jest test')
  //   broadcastService.setUsers(
  //     ['alane+largeroom@wickr.com'] // security group 6
  //   )
  //   broadcastService.setTTL('')
  //   broadcastService.setBOR('')
  //   broadcastService.setSentByFlag(true)
  //   const reply = broadcastService.broadcastMessage()
  //   expect(reply.pending).toEqual(
  //     'Broadcast message in process of being sent to list of users'
  //   )
  // })

  // get rid of .env if this is built
  // it('should test configuration', async () => {
  //   // set tokens needed for the app
  //   const tempbot = new BotAPI({ botName: 'tempbot' })
  //   const tokenConfig = [
  //     {
  //       token: 'WEB_INTERFACE',
  //       pattern: 'yes|no',
  //       type: 'string',
  //       description:
  //         'Do you want to setup the web interface (REST API or WEB Application) [yes/no]',
  //       message: 'Please enter either yes or no',
  //       required: true,
  //       default: 'no',
  //       list: [
  //         {
  //           token: 'WEB_APPLICATION',
  //           pattern: 'yes|no',
  //           type: 'string',
  //           description: 'Do you want to use the web application [yes/no]',
  //           message: 'Please enter either yes or no',
  //           required: true,
  //           default: 'no',
  //           list: [
  //             {
  //               token: 'WEBAPP_HOST',
  //               pattern: '',
  //               type: 'string',
  //               description:
  //                 'Please enter the host name or ip address to reach the web application',
  //               message: 'Cannot leave empty! Please enter a value',
  //               required: true,
  //               default: false,
  //             },
  //             {
  //               token: 'WEBAPP_PORT',
  //               pattern:
  //                 '^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$',
  //               type: 'number',
  //               description:
  //                 'Please enter the host port to use to reach the web application',
  //               message: 'Cannot leave empty! Please enter a value',
  //               required: true,
  //               default: false,
  //             },
  //           ],
  //         },
  //         {
  //           token: 'REST_APPLICATION',
  //           pattern: 'yes|no',
  //           type: 'string',
  //           description: 'Do you want to use the REST application [yes/no]',
  //           message: 'Please enter either yes or no',
  //           required: true,
  //           default: 'no',
  //         },
  //         {
  //           token: 'BOT_PORT',
  //           pattern:
  //             '^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$',
  //           type: 'number',
  //           description: "Please enter your client bot's port",
  //           message: 'Cannot leave empty! Please enter a value',
  //           required: false,
  //           default: false,
  //         },
  //         {
  //           token: 'BOT_KEY',
  //           pattern: '',
  //           type: 'string',
  //           description: "Please enter your client bot's API-Key",
  //           message: 'Cannot leave empty! Please enter a value',
  //           required: true,
  //           default: false,
  //         },
  //         {
  //           token: 'BOT_AUTH_TOKEN',
  //           pattern: '',
  //           type: 'string',
  //           description:
  //             'Please create an Web API Basic Authorization Token, we recommend an alphanumeric string with at least 24 characters',
  //           message: 'Cannot leave empty! Please enter a value',
  //           required: true,
  //           default: false,
  //         },
  //         {
  //           token: 'HTTPS_CHOICE',
  //           pattern: 'yes|no',
  //           type: 'string',
  //           description:
  //             'Do you want to set up an HTTPS connection with the Web API Interface, highly recommended [yes/no]',
  //           message: 'Please enter either yes or no',
  //           required: true,
  //           default: 'no',
  //           list: [
  //             {
  //               token: 'SSL_KEY_LOCATION',
  //               pattern: '',
  //               type: 'file',
  //               description:
  //                 'Please enter the name and location of your SSL .key file',
  //               message: 'Cannot find file!',
  //               required: true,
  //               default: false,
  //             },
  //             {
  //               token: 'SSL_CRT_LOCATION',
  //               pattern: '',
  //               type: 'file',
  //               description:
  //                 'Please enter the name and location of your SSL .crt file',
  //               message: 'Cannot find file!',
  //               required: true,
  //               default: false,
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //     {
  //       token: 'BOT_MAPS',
  //       pattern: 'yes|no',
  //       type: 'string',
  //       description:
  //         'Do you want to map users locations when you send broadcasts [yes/no]',
  //       message: 'Please enter either yes or no',
  //       required: true,
  //       default: 'no',
  //       list: [
  //         {
  //           token: 'BOT_GOOGLE_MAPS',
  //           pattern: '',
  //           type: 'string',
  //           description: 'Please enter your google maps api key',
  //           message: 'Cannot leave empty! Please enter a value',
  //           required: true,
  //           default: false,
  //         },
  //       ],
  //     },
  //   ]
  //   // set ecosystem file
  //   const processesFilePath = path.join(__dirname, '../../processes.json')
  //   // configure (provision, really).
  //   await tempbot.configure({
  //     tokenConfig,
  //     processesFilePath,
  //     supportAdministrators: true,
  //     supportVerification: true,
  //   })
  // })

  //
})
