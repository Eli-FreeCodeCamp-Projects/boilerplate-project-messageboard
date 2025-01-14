'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const helmet = require('helmet');
const mongoose = require('mongoose');
const app = express();

//-> Set up helmet
app.use(helmet({
  frameguard: {         // configure
    action: 'deny'
  },
  contentSecurityPolicy: {    // enable and configure
    directives: {
      defaultSrc: ["'none'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'", 'code.jquery.com'],
      imgSrc: ["'self'", 'cdn.freecodecamp.org'],
      FormAction: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'", "replit.com"],
      connectSrc: ["'self'"],
    }
  },
  dnsPrefetchControl: { allow: false },     // disable,
  xFrameOptions: { action: "sameorigin" },
  strictTransportSecurity: {
    includeSubDomains: true,
    force: true,
  },
  referrerPolicy:{
    policy: "same-origin"
  }
}));
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});
//-> Connect to mongo db
mongoose.connect(
  process.env['MONGO_URI'])
    .then(()=>{
      console.log("We are connected to mongo db")
    })
    .catch((err) => {
      console.log("Error unable to connect to mongo db", err);
    });

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
