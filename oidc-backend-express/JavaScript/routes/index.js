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
    user:req.user,
  });
});
// Callback Route
router.get('/callback', passport.authenticate('oidc', {
  callback: true,
  successReturnToOrRedirect: process.env.OIDC_REACT,
  failureRedirect: process.env.OIDC_REACT
}));
// Find all clients/petitions from curtain user to create preview list
router.get('/clients/user',checkAuthentication,(req,res)=>{
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
router.post('/client/create',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
      return db.task('add-client', async t => {
          await t.client_details.findByClientId(req.body.client_id).then(async result=> {
            if(result){
              res.end(JSON.stringify({response:'client_id_exists'}));
            }
            else{
                await t.client_details.add(req.body,req.user.sub,null,0).then(async result=>{
                  await t.client_general.add('client_grant_type',req.body.grant_types,result.id);
                  await t.client_general.add('client_scope',req.body.scope,result.id);
                  await t.client_general.add('client_redirect_uri',req.body.redirect_uris,result.id);
                  await t.client_general.add('client_contact',req.body.contacts,result.id);
                  res.end(JSON.stringify({success:true}));
                }).catch(err=>{
                  res.end(JSON.stringify({
                    success:false,
                    error:err,
                  }));
                })
            }});
      });
});
// It returns one connection with only the necessary data for the form
router.get('/getclient/:id',checkAuthentication,(req,res)=>{
      return db.task('find-clients',async t=>{
        await t.client_details.findConnectionByIdAndSub(req.user.sub,req.params.id).then(async connection=>{
          if(connection){
            const grant_types = await t.client_general.findByConnectionId('client_grant_type',req.params.id);
            const scopes = await t.client_general.findByConnectionId('client_scope',req.params.id);
            const redirect_uris = await t.client_general.findByConnectionId('client_redirect_uri',req.params.id);
            const contacts = await t.client_general.findByConnectionId('client_contact',req.params.id);
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

router.put('/client/delete/:id',checkAuthentication,(req,res)=>{
  return db.task('delete-clients',async t =>{
    try{
      await t.client_details.delete(req.user.sub,req.params.id).then(async details =>{
        const grant_types = await t.client_general.delete('client_contact',req.params.id);
        const scopes = await t.client_general.delete('client_scope',req.params.id);
        const redirect_uris = await t.client_general.delete('client_redirect_uri',req.params.id);
        const contacts = await t.client_general.delete('client_grant_type',req.params.id);
        return res.json({
          success:true
        })

      })
    }
    catch(error){
      return res.json({
        success:false,
        error:error
      })
    }
  })
})

router.post('/client/edit/:id',checkAuthentication,(req,res)=>{
  return db.task('update-client',async t =>{
    await t.client_details.findConnectionForEdit(req.user.sub,req.params.id).then(async client=>{
      if(client){
        try {

          if(Object.keys(req.body.details).length !== 0){

            const w = await t.client_details.update(req.body.details,client.revision,client.id);
            const s = await t.client_details.add(client,client.revision,client.id);
          }
          for (var key in req.body.add){
            const m = await t.client_general.add(key,req.body.add[key],req.params.id);
          }
          for (var key in req.body.dlt){
            const n = await t.client_general.delete_one_or_many(key,req.body.dlt[key],req.params.id);
          }
          return res.json({
            success:true,
          });
        }
        catch(error){
          return res.json({
            success:false,
            error:error
          });
        }
      }
      else{
        return res.json({
          success:false,
          error:'Client was not found'
        });
      }
    })
  })
})




module.exports = {
  router:router,
  saveUser:saveUser
}
