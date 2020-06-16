import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import {
  BOT_PORT,
  WEB_APPLICATION,
  REST_APPLICATION,
  HTTPS_CHOICE,
  WEBAPP_PORT,
  WEBAPP_HOST
} from '../helpers/constants'
import useWebAndRoutes from './webapi';
import useRESTRoutes from './restapi';

// set upload destination for attachments sent to broadcast with multer 
const startServer = () => {
  const app = express();
  app.use(helmet()); //security http headers

  app.listen(BOT_PORT.value, () => {
    console.log('We are live on ' + BOT_PORT.value);
  });

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

  if (WEB_APPLICATION.value != 'false' && WEB_APPLICATION.value != 'no') {
    let host
    if (HTTPS_CHOICE.value == 'yes') {
      host = `https://${WEBAPP_HOST.value}`
    } else {
      host = `http://${WEBAPP_HOST.value}`
    }

    app.options("/*", (req, res, next) => {
      res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Origin', `${host}:9000`); // use for debuggging
      // res.header('Access-Control-Allow-Origin', `${host}:${WEBAPP_PORT.value}`);

      res.sendStatus(200)
    });

    app.all("/*", (req, res, next) => {
      res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Origin', `${host}:9000`); // use for debuggging
      // res.header('Access-Control-Allow-Origin', `${host}:${WEBAPP_PORT.value}`);

      next()
    });
    useWebAndRoutes(app)
  }
  if (REST_APPLICATION.value != 'false' && REST_APPLICATION.value != 'no') {
    useRESTRoutes(app)
  }


  // What to do for ALL requests for ALL Paths
  // that are not handled above
  app.all('*', (req, res) => {
    console.log('*** 404 ***');
    console.log('404 for url: ' + req.url);
    console.log('***********');
    return res.type('txt').status(404).send('Endpoint ' + req.url + ' not found');
  });

}


export default startServer
