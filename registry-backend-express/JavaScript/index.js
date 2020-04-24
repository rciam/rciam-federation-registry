var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const express = require('express');
const {db} = require('./db');
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
    sub: '4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',
    name: 'Andrew Koza',
    given_name: 'Andrew',
    family_name: 'Koza',
    email: 'koza-sparrow@hotmail.com',
    acr: 'https://aai.egi.eu/LoA#Low',
    eduperson_assurance: [ 'https://aai.egi.eu/LoA#Low' ]
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

const port = 5000;

app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
});

module.exports = app;
