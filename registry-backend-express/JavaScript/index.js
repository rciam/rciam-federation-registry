var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const express = require('express');
const {db} = require('./db');
var https = require('https');
var fs = require('fs');
const cors = require('cors');
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

// We set Cors options so that express can handle preflight requests containing cookies


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
  const client = new issuer.Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: process.env.REDIRECT_URI
  });
  const params = {
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile email eduperson_entitlement',
  }
  const passReqToCallback = false;
  passport.use('oidc',new Strategy({client,params,passReqToCallback},(tokenset,userinfo,done)=>{
  //  console.log('tokenset', tokenset);
    //console.log('access_token', tokenset.access_token);
    //console.log('id_token', tokenset.id_token);
    //console.log('claims', tokenset.claims);
    //console.log('userinfo', userinfo);
    routes.saveUser(userinfo);
    return done(null, userinfo)
  }));
});

// Test Strategy

passport.use(new MockStrategy({
	name: 'my-mock',
	user: {
    sub: '7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',
    name: 'Andreas Kozadinos',
    preferred_username: 'akozadinos',
    given_name: 'Andreas',
    family_name: 'Kozadinos',
    email: 'andreaskoza@grnet.gr',
    acr: 'https://aai.egi.eu/LoA#Substantial',
    eduperson_entitlement: [
     'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu',
     'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=vm_operator#aai.egi.eu'
    ],
    edu_person_entitlements: [
     'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu',
     'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=vm_operator#aai.egi.eu'
    ],
    eduperson_assurance: [ 'https://aai.egi.eu/LoA#Substantial' ]
  },
  callback: process.env.OIDC_REACT
}, (user, done) => {
  done(null, user);
	// Perform actions on user, call done once finished
}));



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  /*
   Example: if only a user identifier is stored in the session, this is where
   the full set could be retrieved, e.g. from a database, and passed to the next step
 */
  done(null, obj);
});

const app = express();


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/', routes.router);



// setInterval(Updater,500);
// function Updater() {
//     console.log('test');
// }




const port = 5000;


var server;

if(process.env.NODE_ENV==='test'||process.env.NODE_ENV==='test-docker'){
  server = app.listen(port, () => {
     console.log('\nReady for GET requests on http://localhost:' + port);
  });
  function stop() {
    server.close();
  }
}
else{
  server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/snf-871007.vm.okeanos.grnet.gr/privkey.pem','utf-8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/snf-871007.vm.okeanos.grnet.gr/fullchain.pem','utf-8')
  }, app)
  .listen(port, function () {
    console.log('Example app listening on https://localhost:'+port);
  });
}



function stop() {
  server.close();
}


module.exports = server;

module.exports.stop = stop;
