var envPath = __dirname + "/.env";
var logPath = __dirname + "/logs/logs.log";
require('dotenv').config({path:envPath});
const express = require('express');
const {db} = require('./db');
var https = require('https');
var fs = require('fs');
const cors = require('cors');
var winston = require('winston');
var expressWinston = require('express-winston');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');
const {Issuer,Strategy} = require('openid-client');
const routes= require('./routes/index');
const MockStrategy = require('passport-mock-strategy');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require("express-session");
const { generators } = require('openid-client');
const code_verifier = generators.codeVerifier();

// We set Cors options so that express can handle preflight requests containing cookies
let clients= {};

var corsOptions = {
    origin:  process.env.OIDC_REACT,
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS,PUT",
    allowedHeaders: ['Origin','X-Requested-With','contentType','Content-Type','Accept','Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue:true
}


// Issuer and Passport Strategy initialization
Issuer.discover(process.env.ISSUER_BASE_URI).then((issuer)=>{
  //console.log(issuer.metadata);
   clients.egi = new issuer.Client({
    client_id: process.env.CLIENT_ID_EGI,
    client_secret: process.env.CLIENT_SECRET_EGI,
    redirect_uris: process.env.REDIRECT_URI_EGI
  });

  // client.callback('http://localhost:5000/callback/egi', params, { code_verifier }) // => Promise
  //   .then(function (tokenSet) {
  //     console.log('received and validated tokens %j', tokenSet);
  //     console.log('validated ID Token claims %j', tokenSet.claims());
  //   });

  // authUrls.egi = client.authorizationUrl({
  //   client_id:process.env.CLIENT_ID,
  //   scope: 'openid email profile eduperson_entitlement',
  //   redirect_uri: 'http://localhost:5000/callback/eosc',
  // });
  //const passReqToCallback = false;

});

Issuer.discover("https://aai.eosc-portal.eu/oidc/").then((issuer)=>{
  //console.log(issuer.metadata);
  const client = new issuer.Client({
    client_id: process.env.CLIENT_ID_EOSC,
    client_secret: process.env.CLIENT_SECRET_EOSC,
    redirect_uris: process.env.REDIRECT_URI_EOSC
  });

});

// Mock Strategy for Tests

// passport.use(new MockStrategy({
// 	name: 'my-mock',
// 	user: {
//     sub: '7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',
//     name: 'Andreas Kozadinos',
//     preferred_username: 'akozadinos',
//     given_name: 'Andreas',
//     family_name: 'Kozadinos',
//     email: 'andreaskoza@grnet.gr',
//     acr: 'https://aai.egi.eu/LoA#Substantial',
//     eduperson_entitlement: [
//      'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu',
//      'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=vm_operator#aai.egi.eu'
//     ],
//     edu_person_entitlements: [
//      'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu',
//      'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=vm_operator#aai.egi.eu'
//     ],
//     eduperson_assurance: [ 'https://aai.egi.eu/LoA#Substantial' ]
//   },
//   callback: process.env.OIDC_REACT
// }, (user, done) => {
//   routes.saveUser(user);
//   done(null, user);
// 	// Perform actions on user, call done once finished
// }));



const app = express();

// var level = "";
// if (res.statusCode >= 100) { level = "info"; }
// if (res.statusCode >= 400) { level = "warn"; }
// if (res.statusCode >= 500) { level = "error"; }
// // Ops is worried about hacking attempts so make Unauthorized and Forbidden critical
// if (res.statusCode == 401 || res.statusCode == 403) { level = "critical"; }
// // No one should be using the old path, so always warn for those
// if (req.path === "/v1" && level === "info") { level = "warn"; }
// return level;

app.use(expressWinston.logger({
      transports: [
        new(winston.transports.File)({filename:logPath}),
        new (winston.transports.Console)({'timestamp':true}),
      ],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: function (req,res) {
        return 'info';
      },
      baseMeta:null,
      metaField:null,
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      requestWhitelist: [],
      responseWhitelist: [],
      dynamicMeta: function(req, res) {
        const meta={};
        if(req.user&&req.user.sub&&req.user.role){
          meta.user = {};
          meta.user.sub= req.user ? req.user.sub : null;
          meta.user.role= req.user ? req.user.role : null;
        }
        meta.method= req.method;
        meta.status= res.statusCode;
        meta.url= req.url;
        meta.type='access_log';
        meta.responseTime= res.responseTime;
        return meta;
      },
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
    }));




app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.set('clients',clients);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/', routes.router);


app.use(expressWinston.errorLogger({
      transports: [
        new winston.transports.Console()
      ],
      format: winston.format.combine(
        winston.format.json()
      ),
      meta:true,
      metaField:null,
      dynamicMeta: function(req, res) {
        const meta={};
        meta.type='error_log';
        return meta;
      },
      requestWhitelist: ['url','method'],
      blacklistedMetaFields: ['error','exception','process','execPath','memoryUsage','os','trace','message'],
      msg:"{{err}}"
}));




app.use(function (err, req, res, next) {
  if (res.headersSent) {
     return next(err)
   }
   res.status(500)
   res.json({ error: err.stack })

});







const port = 5000;




var server = app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
  });
  function stop() {
    server.close();
}



function stop() {
  server.close();
}

module.exports = server;

module.exports.stop = stop;
