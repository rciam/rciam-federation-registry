require('dotenv').config();
const {clientValidationRules,validate} = require('../validator.js');
const {merge_data} = require('../merge_data.js');
const {db} = require('../db');
var router = require('express').Router();
var passport = require('passport');

// Check validation status of requests
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.json({auth:false});
  }
}
// Save new User to db
const saveUser=(userinfo)=>{
  return db.task('user-check',async t=>{
    let user = await t.user_info.findBySub(userinfo.sub);
    if(!user) {
      await t.user_info.add(userinfo).then(async result=>{
        await t.user_edu_person_entitlement.add(userinfo.eduperson_assurance,result.id);
      });
    }
  });
}
// Login Route
router.get('/login',passport.authenticate('oidc', {
  successReturnToOrRedirect: process.env.OIDC_REACT
}));
// Logout Route
router.get('/logout',checkAuthentication,(req,res)=>{
  req.logout();
  res.redirect(process.env.OIDC_REACT);
});
// Check Authentication
router.get('/auth',checkAuthentication,(req,res)=>{
  res.json({auth:true});
});
// Get User User Info
router.get('/user',checkAuthentication, (req,res)=>{
  res.json({
    name:req.user.name
  });
});
// Callback Route
router.get('/callback', passport.authenticate('oidc', {
  callback: true,
  successReturnToOrRedirect: process.env.OIDC_REACT,
  failureRedirect: process.env.OIDC_REACT
}));
// Find all clients/petitions from curtain user to create preview list
router.post('/clients/user',checkAuthentication,(req,res)=>{
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
router.post('/client',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
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
// It returns one connection with only the necessary data for the form
router.get('/getclient/:id',checkAuthentication,(req,res)=>{
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



module.exports = {
  router:router,
  saveUser:saveUser
}
