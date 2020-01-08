const express = require('express');
const {db} = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');
const {Issuer,Strategy} = require('openid-client');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require("express-session");
// We set Cors options so that express can handle preflight requests containing cookies
var corsOptions = {
    origin: 'http://localhost:3000',
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    allowedHeaders: ['Origin','X-Requested-With','contentType','Content-Type','Accept','Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue:true
}
// Issuer and Passport Strategy initialization
Issuer.discover('https://aai-dev.egi.eu/oidc/').then((issuer)=>{
  console.log(issuer.metadata);
  const client = new issuer.Client({
    client_id: '966c3bcf-0a24-4874-80f0-822ef8c7a5be',
    client_secret: 'OvjiRGL-Aqs9b8PU4zBe-6Nl_DcgthtI4EzrpWhyXuR8W5Ty1uf8liaAbaaf_Gra18LnHaK52aSzFUMHTuwQ4w',
    redirect_uris: 'http://localhost:5000/callback'
  });
  const params = {
    client_id: '966c3bcf-0a24-4874-80f0-822ef8c7a5be',
    redirect_uri: 'http://localhost:5000/callback',
    scope: 'openid profile email',
  }
  const passReqToCallback = false;
  passport.use('oidc',new Strategy({client,params,passReqToCallback},(tokenset,userinfo,done)=>{
    console.log('tokenset', tokenset);
    console.log('access_token', tokenset.access_token);
    console.log('id_token', tokenset.id_token);
    console.log('claims', tokenset.claims);
    console.log('userinfo', userinfo);
    saveUser(userinfo);
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

function saveUser(userinfo){
  return db.task('user-check',async t=>{
    let user = await t.user_info.findBySub(userinfo.sub);
    if(!user) {
      await t.user_info.add(userinfo).then(async result=>{
        await t.user_edu_person_entitlement.add(userinfo.eduperson_assurance,result.id);
      });
    }
  });
}

function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.json({auth:false});
  }
}

// Login Route
app.get('/login',passport.authenticate('oidc', {
  successReturnToOrRedirect: "http://localhost:3000/"
}));
// Logout Route
app.get('/logout',checkAuthentication,(req,res)=>{
  req.logout();
  res.redirect('http://localhost:3000/');
});
// Check Authentication
app.get('/auth',checkAuthentication,(req,res)=>{
  res.json({auth:true});
});
// Get User User Info
app.get('/user',checkAuthentication, (req,res)=>{
  res.json({
    name:req.user.name
  });
});


// Callback Route
app.get('/callback', passport.authenticate('oidc', {
  callback: true,
  successReturnToOrRedirect: 'http://localhost:3000/',
  failureRedirect: 'http://localhost:3000/'
}));




// Find all clients/petitions from curtain user to create preview list
// Secured here
app.post('/clients/user',checkAuthentication,(req,res)=>{
      return db.task('find-clients', async t => {
        res.setHeader('Content-Type', 'application/json');
        let connections = await t.client_details.findByuserIdentifier(req.user.sub);
        if(connections.length<1){
          return res.end(JSON.stringify({
            success:false
          }));
        }
        return res.end(JSON.stringify({
          success:true,
          connections
        }));
      });
});




// Add a new client/petition
// Secured
app.post('/client',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
      return db.task('add-client', async t => {
          await t.client_details.findByClientId(req.body.client_id).then(async result=> {
            if(result){
              res.end(JSON.stringify({response:'client_id_exists'}));
            }
            else{
                await t.client_details.add(req.body,userinfo).then(async result=>{
                  await t.client_grant_type.add(req.body.grant_types,result.id).then(console.log());
                  await t.client_scope.add(req.body.scope,result.id);
                  await t.client_redirect_uri.add(req.body.redirect_uris,result.id);
                  await t.client_contact.add(req.body.contacts,result.id);
                  res.end(JSON.stringify({response:'success'}));
                }).catch(err=>{
                  console.log(err)
                  res.end(JSON.stringify({response:'error'}));
                })
            }});
      });
});









// It should return one connection with only the necessary data for the form
// Not secured
app.get('/getclient/:id',checkAuthentication,(req,res)=>{
      return db.task('find-clients',async t=>{
        await t.client_details.findConnectionByIdAndSub(req.user.sub,req.params.id).then(async connection=>{
          if(connection){
            const grant_types = await t.client_grant_type.findByConnectionId(req.params.id);
            const scopes = await t.client_scope.findByConnectionId(req.params.id);
            const redirect_uris = await t.client_redirect_uri.findByConnectionId(req.params.id);
            const contacts = await t.client_contact.findByConnectionId(req.params.id);
            connection = merge_data(connection,grant_types,'grant_types');
            connection = merge_data(connection,scopes,'scope');
            connection = merge_data(connection,redirect_uris,'redirect_uris');
            connection = merge_data(connection,contacts,'contacts');
            return res.json({
              success:true,
              connection
            });
          }
          else{
            return res.json({
              success:false
            });
          }
        });
      });
});









// I am not Using this
// It returns all connections for curtain user with Timestamps Flags Requester Reciever
app.get('/client/:RequesterId',(req,res)=>{
    items = [];
    return db.task('find-clients',async t=>{
        let connections = await t.client_details.findByRequesterId(req.params.RequesterId);
        if(connections.length<1){
          return res.json({
            success:false
          });
        }
          connections.map((item,index)=>{
           items.push(item.id)
          //connections[index].grant_types = await t.grant_types.findByConnectionId(connections)
        })
        const grant_types = await t.client_grant_type.findByConnectionId(items);
        const scopes = await t.client_scope.findByConnectionId(items);
        const redirect_uris = await t.client_redirect_uri.findByConnectionId(items);
        const contacts = await t.client_contact.findByConnectionId(items);
        connections = merge_data(connections,grant_types,'grant_types');
        connections = merge_data(connections,scopes,'scope');
        connections = merge_data(connections,redirect_uris,'redirect_uris');
        connections = merge_data(connections,contacts,'contacts');
        return res.json({
          success:true,
          connections
        });
    });
});



// Delete client/petition
// Not yet fully implemented
// Not secure
app.get('/client/delete/:id',(req,res)=>{
    return db.task('delete-client', async t => {
      res.setHeader('Content-Type', 'application/json');
      await t.client_details.findByClientId(req.params.id).then(async result=>{
        if(result){
          try{
            await t.client_grant_type.delete(result.id).then(response =>console.log(response));
            await t.client_scope.delete(result.id);
            await t.client_redirect_uri.delete(result.id);
            await t.client_contact.delete(result.id);
            await t.client_details.delete(result.id);
            res.end(JSON.stringify({response:'success'}));
          }
          catch{
            res.end(JSON.stringify({response:'error'}));
          }
        }
        else{
          res.end(JSON.stringify({response:'does_not_exist'}));
        }
      });
    });
})



// Generic GET handler;
function GET(url, handler) {
    app.get(url, async (req, res) => {
        try {
            const data = await handler(req);
            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.json({
                success: false,
                error: error.message || error
            });
        }
    });
}

const port = 5000;

app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
});
