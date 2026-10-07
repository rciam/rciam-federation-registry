var envPath = __dirname + "/.env";
var logPath = __dirname + "/logs/logs.log";
require('dotenv').config({path:envPath});
const express = require('express');
const {db} = require('./db');
const cors = require('cors');
var CryptoJS = require("crypto-js");
var winston = require('winston');
var expressWinston = require('express-winston');
var {oneLineJson} = require('./logFormat');
const log = require('./loggers.js');
const {Issuer,custom} = require('openid-client');
const routes= require('./routes/index');
var cookieParser = require('cookie-parser');
const {outdatedNotificationsWorker} = require('./functions/outdated_notif.js');
const bannerAlertRoutes = require('./routes/banner_alerts.js');
const serviceTagRoutes = require('./routes/service_tags.js');
const notificationRoutes = require('./routes/notifications.js');
const utilRoutes = require('./routes/util_routes.js');
const fs = require('fs');
const path = require('path'); 



let clients= {};
let tenant_config = {};
custom.setHttpOptionsDefaults({
  timeout: 20000,
});


var hash = CryptoJS.SHA256(process.env.TOKEN_KEY).toString(CryptoJS.enc.Base64);
let whitelist = process.env.CORS.split(' ');
var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS,PUT",
    allowedHeaders: ['Origin','X-Requested-With','contentType','Content-Type','Accept','Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue:true
}

const app = express();

app.disable('x-powered-by');
app.set('hash',hash);
db.tenants.getInit().then(async tenants => {
  
  for (const tenant of tenants){
    tenant_config[tenant.name] = {
      base_url:tenant.base_url
    }
    let filePath;
    if(process.env.NODE_ENV!=='test-docker'&&process.env.NODE_ENV!=='test'){
      filePath = path.join(__dirname, 'tenant_config', tenant.name + '.json');
    }
    else{
      filePath = path.join(__dirname, 'test', tenant.name + '.json');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        log.error('Error reading tenant configuration file: ' + (err.stack || err), { type: 'tenant_init', file: filePath });
        return;
      }
      try {
        // Parse the JSON data
        tenant_config[tenant.name] = {...tenant_config[tenant.name],...JSON.parse(data)};
        
      } catch (error) {
        log.error('Error parsing tenant configuration: ' + (error.stack || error), { type: 'tenant_init' });
      }
    });
    await Issuer.discover(tenant.issuer_url).then((issuer)=>{
      clients[tenant.name] = new issuer.Client({
        client_id: tenant.client_id,
        client_secret: tenant.client_secret,
        redirect_uris: process.env.REDIRECT_URI + tenant.name,
        logout_uri: issuer.end_session_endpoint + '?post_logout_redirect_uri=' + encodeURIComponent(tenant.base_url)
      });
      clients[tenant.name].client_id = tenant.client_id;
      clients[tenant.name].client_secret = tenant.client_secret;
      clients[tenant.name].issuer_url = tenant.issuer_url;
      clients[tenant.name].client_scopes = tenant_config[tenant.name].client_scopes;
     }).catch(error=>{
      if(process.env.NODE_ENV!=='test-docker'&&process.env.NODE_ENV!=='test'){     
        log.warn('Unable to Discover Tenant', { type: 'tenant_init', tenant: tenant.name });
      }
    })
  }
  app.set('clients',clients);
  global.tenant_config = tenant_config;
}).catch(err => {log.error('Tenant initialization failed due to following error: ' + (err.stack || err), { type: 'tenant_init' });});


function parseTrustProxy(val) {
  if (val === undefined || val === null || val === '' || val === 'false' || val === '0') {
    return false;
  }
  if (val === 'true') {
    return true;
  }
  const num = Number(val);
  if (!Number.isNaN(num)) {
    return num;
  }
  return val; // e.g. "loopback", "10.0.0.0/8", or comma-separated IPs
}

app.set('trust proxy', parseTrustProxy(process.env.EXPRESS_TRUST_PROXY));

app.use(expressWinston.logger({
    transports: [
      new(winston.transports.File)({filename:logPath}),
      new (winston.transports.Console)({'timestamp':true}),
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      oneLineJson
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
      meta.clientip = req.ip || req.socket.remoteAddress;
      if(req.user&&req.user.sub&&req.user.role){
        meta.user = {};
        delete req.user.role.actions;
        meta.user.sub= req.user ? req.user.sub : null;
        meta.user.role= req.user ? req.user.role : null;
      }
      meta.method= req.method;
      meta.status= res.statusCode;
      meta.url= req.url;
      meta.type='access';
      meta.responseTime= res.responseTime;
      return meta;
    },
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {if (req.url==='/agent/get_new_configurations'){return true}else{return false;}  } // optional: allows to skip some log messages based on request and/or response
  }));





app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({extended: true})); 
app.use(express.json({ limit: '50mb' }));

app.use('/tenants/:tenant/banner_alert', bannerAlertRoutes);
app.use('/tenants/:tenant/tags', serviceTagRoutes);
app.use('/tenants/:tenant/notifications',notificationRoutes);
app.use('/util',utilRoutes);

app.use('/', routes.router);


app.use(expressWinston.errorLogger({
      transports: [
        new winston.transports.Console()
      ],
      format: winston.format.combine(
        winston.format.timestamp(),
        oneLineJson
      ),
      meta:true,
      metaField:null,
      dynamicMeta: function(req, res) {
        const meta={};
        meta.type='exception';
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
   res.status(500);
   if (err instanceof SyntaxError) {
    res.json({error:err.message});
  } else {
    res.json({ error: err.stack });
  }
   

});




const port = 5000;


var server = app.listen(port, () => {
    log.info('Ready for GET requests on http://localhost:' + port);
  });
  function stop() {
    server.close();
}
server.keepAliveTimeout = 3700000;

function gracefulShutdown(signal) {
  log.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    log.info('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

function stop() {
  server.close();
}

module.exports = server;
module.exports.stop = stop;
