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
const {petitionValitationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');
const {Issuer,Strategy,custom} = require('openid-client');
const routes= require('./routes/index');
const MockStrategy = require('passport-mock-strategy');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require("express-session");
const { generators } = require('openid-client');
const code_verifier = generators.codeVerifier();

// We set Cors options so that express can handle preflight requests containing cookies
let clients= {};
custom.setHttpOptionsDefaults({
  timeout: 20000,
});
var corsOptions = {
    origin:  process.env.OIDC_REACT,
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS,PUT",
    allowedHeaders: ['Origin','X-Requested-With','contentType','Content-Type','Accept','Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue:true
}


db.tenants.getInit().then(async tenants => {
  for (const tenant of tenants){
    await Issuer.discover(tenant.issuer_url).then((issuer)=>{
      //console.log(issuer.metadata);

      clients[tenant.name] = new issuer.Client({
        client_id: tenant.client_id,
        client_secret: tenant.client_secret,
        redirect_uris: process.env.REDIRECT_URI + tenant.name
      });
      clients[tenant.name].client_id = tenant.client_id;
      clients[tenant.name].client_secret = tenant.client_secret;
      clients[tenant.name].issuer_url = tenant.issuer_url;
    });
  }
}).catch(err => {console.log('Tenant initialization failed due to following error'); console.log(err);});






const app = express();

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
        delete req.user.role.actions;
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
    ignoreRoute: function (req, res) {if (req.url==='/agent/get_new_configurations'){return true}else{return false;}  } // optional: allows to skip some log messages based on request and/or response
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
