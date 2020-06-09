import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer'
import {
  BOT_PORT,
  WEBAPP_PORT,
  WEB_APPLICATION
} from '../helpers/constants'
import useWebAndRoutes from './webapi';
import useRESTRoutes from './restapi';

// set upload destination for attachments sent to broadcast with multer 
const startServer = () => {
  const app = express();
  app.use(helmet()); //security http headers

  app.listen(WEBAPP_PORT.value, () => {
    console.log('We are live on ' + WEBAPP_PORT.value);
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
  app.options("/*", (req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');

    res.sendStatus(200)
  });

  app.all("/*", (req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    next()
  });

  if (WEB_APPLICATION) {
    useWebAndRoutes(app)
  }
  useRESTRoutes(app)


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
