import jwt from 'jsonwebtoken'
import {
  bot,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
} from '../helpers/constants'

const checkAuth = (req, res, next) => {
  res.set('Authorization', 'Basic base64_auth_token')
  res.set('Content-Type', 'application/json')

  // Gather the jwt access token from the request header
  // const authHeader = req.get('Authorization');
  const authHeader = req.headers.authorization

  const token = authHeader && authHeader.split(' ')[1]

  if (token == null)
    return res
      .status(401)
      .send(
        'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic jwt"'
      ) // if there isn't any token

  jwt.verify(token, BOT_AUTH_TOKEN.value, (err, user) => {
    if (err) {
      logger.error(err)
      logger.error('err: ' + err.message)
      return res.status(403).send(err.message)
    }

    const adminUser = bot.myAdmins.getAdmin(user.email)
    if (adminUser === undefined) {
      return res
        .status(401)
        .send(
          'Access denied: ' + user.email + ' is not authorized to broadcast!'
        )
    }

    // Check if the authCode is valid for the input user
    const dictAuthCode = client_auth_codes[user.email]
    if (dictAuthCode === undefined || user.session !== dictAuthCode) {
      return res
        .status(401)
        .send('Access denied: invalid user authentication code.')
    }
    logger.debug({ user })
    req.user = user
    next()
  })
}

export default checkAuth
