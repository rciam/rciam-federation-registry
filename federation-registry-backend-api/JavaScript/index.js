var envPath = __dirname + "/.env";
var logPath = __dirname + "/logs/logs.log";
require('dotenv').config({path:envPath});
const express = require('express');
const {db} = require('./db');
var config = require('./config');
const cors = require('cors');
var CryptoJS = require("crypto-js");
var winston = require('winston');
var expressWinston = require('express-winston');
const {Issuer,custom} = require('openid-client');
const routes= require('./routes/index');
var cookieParser = require('cookie-parser');
const {outdatedNotificationsWorker} = require('./functions/outdated_notif.js');
const bannerAlertRoutes = require('./routes/banner_alerts.js');
const serviceTagRoutes = require('./routes/service_tags.js');
const notificationRoutes = require('./routes/notifications.js');
const utilRoutes = require('./routes/util_routes.js');





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


app.set('hash',hash);

db.tenants.getInit().then(async tenants => {
  for (const tenant of tenants){

    tenant_config[tenant.name] = {
      base_url:tenant.base_url
    }
    await Issuer.discover(tenant.issuer_url).then((issuer)=>{
      clients[tenant.name] = new issuer.Client({
        client_id: tenant.client_id,
        client_secret: tenant.client_secret,
        redirect_uris: process.env.REDIRECT_URI + tenant.name,
        logout_uri: issuer.end_session_endpoint + '?post_logout_redirect_uri=' + encodeURIComponent(tenant.base_url)+ '&redirect=' + encodeURIComponent(tenant.base_url)         
      });
      clients[tenant.name].client_id = tenant.client_id;
      clients[tenant.name].client_secret = tenant.client_secret;
      clients[tenant.name].issuer_url = tenant.issuer_url;
    })
  }
  app.set('clients',clients);
  global.tenant_config = tenant_config;
}).catch(err => {console.log('Tenant initialization failed due to following error'); console.log(err);});

// if(config.send_notifications_on_startup){
//   try{
//     db.user.getTechnicalContacts('egi').then(async users=>{
//       if(users){
//         for(const user of users){
//           await delay(400);
//           sendNotif({subject:'New portal for managing services in Check-in',tenant:'egi'},'introduction-to-fed.hbs',{name:user.name,email:user.email});
//         }
//       }
//     }).catch(err=>{
//       console.log('Failed to get users to push the notifications');
//     })

//   }
//   catch(err){
//       console.log('Error when trying to send notifications: '+ err);
//   }
// }





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
   res.status(500);
   if (err instanceof SyntaxError) {
    res.json({error:err.message});
  } else {
    res.json({ error: err.stack });
  }
   

});




const port = 5000;

// if(config.send_outdated_notifications){
//   outdatedNotificationsWorker(config.outdated_notifications_interval_seconds);
// }

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
