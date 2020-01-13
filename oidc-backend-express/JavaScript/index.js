require('dotenv').config();
const express = require('express');
const {db} = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');
const {Issuer,Strategy} = require('openid-client');
const routes= require('./routes/index');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require("express-session");

// We set Cors options so that express can handle preflight requests containing cookies
var corsOptions = {
    origin:  process.env.OIDC_REACT,
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    allowedHeaders: ['Origin','X-Requested-With','contentType','Content-Type','Accept','Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue:true
}
// Issuer and Passport Strategy initialization
Issuer.discover(process.env.ISSUER_BASE_URI).then((issuer)=>{
  console.log(issuer.metadata);
  const client = new issuer.Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: process.env.REDIRECT_URI
  });
  const params = {
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile email',
  }
  const passReqToCallback = false;
  passport.use('oidc',new Strategy({client,params,passReqToCallback},(tokenset,userinfo,done)=>{
    console.log('tokenset', tokenset);
    console.log('access_token', tokenset.access_token);
    console.log('id_token', tokenset.id_token);
    console.log('claims', tokenset.claims);
    console.log('userinfo', userinfo);
    routes.saveUser(userinfo);
    return done(null, userinfo)
  }));
});

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
  secret: 'secret squirrel',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/', routes.router);

















//
//
// // I am not Using this
// // It returns all connections for curtain user with Timestamps Flags Requester Reciever
// app.get('/client/:RequesterId',(req,res)=>{
//     items = [];
//     return db.task('find-clients',async t=>{
//         let connections = await t.client_details.findByRequesterId(req.params.RequesterId);
//         if(connections.length<1){
//           return res.json({
//             success:false
//           });
//         }
//           connections.map((item,index)=>{
//            items.push(item.id)
//           //connections[index].grant_types = await t.grant_types.findByConnectionId(connections)
//         })
//         const grant_types = await t.client_grant_type.findByConnectionId(items);
//         const scopes = await t.client_scope.findByConnectionId(items);
//         const redirect_uris = await t.client_redirect_uri.findByConnectionId(items);
//         const contacts = await t.client_contact.findByConnectionId(items);
//         connections = merge_data(connections,grant_types,'grant_types');
//         connections = merge_data(connections,scopes,'scope');
//         connections = merge_data(connections,redirect_uris,'redirect_uris');
//         connections = merge_data(connections,contacts,'contacts');
//         return res.json({
//           success:true,
//           connections
//         });
//     });
// });
//
//
//
// // Delete client/petition
// // Not yet fully implemented
// // Not secure
// app.get('/client/delete/:id',(req,res)=>{
//     return db.task('delete-client', async t => {
//       res.setHeader('Content-Type', 'application/json');
//       await t.client_details.findByClientId(req.params.id).then(async result=>{
//         if(result){
//           try{
//             await t.client_grant_type.delete(result.id).then(response =>console.log(response));
//             await t.client_scope.delete(result.id);
//             await t.client_redirect_uri.delete(result.id);
//             await t.client_contact.delete(result.id);
//             await t.client_details.delete(result.id);
//             res.end(JSON.stringify({response:'success'}));
//           }
//           catch{
//             res.end(JSON.stringify({response:'error'}));
//           }
//         }
//         else{
//           res.end(JSON.stringify({response:'does_not_exist'}));
//         }
//       });
//     });
// })
//
//
//
// // Generic GET handler;
// function GET(url, handler) {
//     app.get(url, async (req, res) => {
//         try {
//             const data = await handler(req);
//             res.json({
//                 success: true,
//                 data
//             });
//         } catch (error) {
//             res.json({
//                 success: false,
//                 error: error.message || error
//             });
//         }
//     });
// }

const port = 5000;

app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
});
