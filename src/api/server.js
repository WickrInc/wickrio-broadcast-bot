import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import https from 'https'
import helmet from 'helmet';
import fs from 'fs'
import {
  BOT_PORT,
  WEB_APPLICATION,
  REST_APPLICATION,
  HTTPS_CHOICE,
  WEBAPP_PORT,
  WEBAPP_HOST,
  SSL_CRT_LOCATION,
  SSL_KEY_LOCATION,
  // SSL_CA_LOCATION
} from '../helpers/constants'
import useWebAndRoutes from './webapi';
import useRESTRoutes from './restapi';

// set upload destination for attachments sent to broadcast with multer 
const startServer = () => {
  const app = express();
  app.use(helmet()); //security http headers

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  app.use(bodyParser.json());
  app.use(cookieParser());

  app.use((error, req, res, next) => {

    if (error instanceof SyntaxError) {
      console.log('bodyParser:', error);
      res.statusCode = 400;
      res.type('txt').send(error.toString());
    } else {
      next();
    }
  });

  // add cors for development
  // TODO: set conditional for NODE_ENV to match and set the right origin host header - 8000 for dev, 4545 for prod

  // if webapplication or rest
  if (WEB_APPLICATION.value == 'yes' || REST_APPLICATION.value == 'yes') {
    let host
    app.options("/*", (req, res, next) => {
      res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Origin', `${host}:8000`); // use for debuggging
      // res.header('Access-Control-Allow-Origin', `${host}:${WEBAPP_PORT.value}`);
      res.sendStatus(200)
    });

    app.all("/*", (req, res, next) => {
      res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Origin', `${host}:8000`); // use for debuggging
      // res.header('Access-Control-Allow-Origin', `${host}:${WEBAPP_PORT.value}`);
      next()
    });

    if (HTTPS_CHOICE.value == 'yes') {
      host = `https://${WEBAPP_HOST.value}`
      https.createServer({
        key: fs.readFileSync(SSL_KEY_LOCATION.value, 'utf8'),
        ca: fs.readFileSync(SSL_CA_LOCATION.value, 'utf8'),
        cert: fs.readFileSync(SSL_CRT_LOCATION.value, 'utf8'),
      }, app)
        .listen(BOT_PORT.value, () => {
          console.log('https')
          console.log('We are live on ' + BOT_PORT.value);
        });
    } else {
      host = `http://${WEBAPP_HOST.value}`
      app.listen(BOT_PORT.value, () => {
        console.log('http')
        console.log('We are live on ' + BOT_PORT.value);
      });
    }
    if (WEB_APPLICATION.value == "yes") {
      useWebAndRoutes(app)
    }
    if (REST_APPLICATION.value == "yes") {
      useRESTRoutes(app)
    }
  }

  // What to do for ALL requests for ALL Paths
  // that are not handled above
  app.all('*', (req, res) => {
    console.log('*** 404 ***');
    console.log('404 for url: ' + req.url);
    console.log('***********');
    return res.type('txt').status(404).send('Endpoint ' + req.url + ' not found');
  });
  return app
}


export default startServer
