require('dotenv').config();
const {clientValidationRules,validate,editClientValidationRules} = require('../validator.js');
const {merge_data} = require('../merge_data.js');
const {db} = require('../db');
var router = require('express').Router();
var passport = require('passport');
var config = require('../config');



// ----------------------------------------------------------
// ******************** HELPER FUNCTIONS ********************
// ----------------------------------------------------------

// Validation Middleware
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){next();}
  else{res.json({auth:false});}
}

// Admin Validation Middleware
function checkAdmin(req,res,next){
  if(isAdmin(req)){
    next();
  }else{
    res.json({
      success:false,
      error:"User not authorized"
    })
  }
}

// Checks Entitlements and returns Super Admin status
function isAdmin(req){
  let admin=false;
  if(req.user.eduperson_entitlement){
    config.super_admin_entitlements.forEach((item)=>{

      if(req.user.eduperson_entitlement.includes(item)){

        admin = true;
      }
    })
  }

  return admin;
}


// Save new User to db
const saveUser=(userinfo)=>{

  return db.task('user-check',async t=>{
    await t.user_info.findBySub(userinfo.sub).then(async user=>{
      if(!user) {
        await t.user_info.add(userinfo).then(async result=>{
          if(userinfo.eduperson_entitlement){
            await t.user_edu_person_entitlement.add(userinfo.eduperson_entitlement,result.id);
          }
        });
      }
    })

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
router.get('/user',checkAuthentication,(req,res)=>{
  let user = req.user;
  user.admin = isAdmin(req);
  res.end(JSON.stringify({
    user
  }));
});
// Callback Route
router.get('/callback', passport.authenticate('oidc', {
  callback: true,
  successReturnToOrRedirect: process.env.OIDC_REACT,
  failureRedirect: process.env.OIDC_REACT
}));
// Find all clients/petitions from curtain user to create preview list
// Super user implementation
// If super user find all clients
router.get('/clients/user',checkAuthentication,(req,res)=>{

      return db.task('find-clients', async t => {
        res.setHeader('Content-Type', 'application/json');
        let connections;

        if (isAdmin(req)){
          console.log('second');
           connections = await t.client_details.findAll();
        }
        else {
           connections = await t.client_details.findByuserIdentifier(req.user.sub);
        }

        if(connections.length<1){
          return res.end(JSON.stringify({
            success:true,
            connections:null

          }));
        }
        return res.end(JSON.stringify({
          success:true,
          admin:req.admin,
          connections
        }));
      });
});

// Add a new client/petition
router.post('/client/create',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
  console.log("step1");

  res.setHeader('Content-Type', 'application/json');
      return db.task('add-client', async t => {
          await t.client_details.findByClientId(req.body.client_id).then(async result=> {
            if(result){
              console.log("step2");
              console.log(result);
              res.end(JSON.stringify({response:'client_id_exists'}));
            }
            else{
              console.log("step3");
                await t.client_details.add(req.body,req.user.sub,null,0).then(async result=>{
                  console.log("step4");
                  console.log(result);
                  await t.client_general.add('client_grant_type',req.body.grant_types,result.id).then(async res=>{
                    await t.client_general.add('client_scope',req.body.scope,result.id).then(async res=>{
                      await t.client_general.add('client_redirect_uri',req.body.redirect_uris,result.id).then(async res=>{
                          await t.client_contact.add(req.body.contacts,result.id)
                      })
                    })
                  })



                  console.log("step5");
                  res.end(JSON.stringify({success:true}));
                }).catch(err=>{
                  console.log(err);
                  console.log('point-error');
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
        await t.client_details.findConnectionById(req.params.id).then(async connection=>{
          if(connection){
            if(connection.requester==req.user.sub||isAdmin(req)){
              const grant_types = await t.client_general.findByConnectionId('client_grant_type',req.params.id);
              const scopes = await t.client_general.findByConnectionId('client_scope',req.params.id);
              const redirect_uris = await t.client_general.findByConnectionId('client_redirect_uri',req.params.id);
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
          }
          else{
            return res.json({
              success:false
            });
          }
        });
      });
});

// checking if clientId is available
router.get('/client/availability/:client_id',checkAuthentication,(req,res)=>{
  return db.task('check-client-exists', async t => {
    try{
      await t.client_details.findByClientId(req.params.client_id).then(async result=> {
        if(result){
          res.json({
            success:true,
            available:false
          })
        }
        else {
          res.json({
            success:true,
            available:true
          })
        }
      })
    }
    catch(error){
      console.log(error);
      res.json({
        success:false,
        error:'Error while querying the database'
      })
    }
  })
})


// Approval of pettion
router.put('/client/approve/:id',checkAuthentication,checkAdmin,(req,res)=>{

  return db.task('approve-client',async t =>{
    await t.client_details.findConnectionForEdit(req.params.id).then(async client=>{
      if(client){
        try {
            const w = await t.client_details.approve(req.params.id,req.user.sub);
            const s = await t.client_details.add(client,client.requester,client.revision,client.id);

          return res.json({
            success:true,
          });
        }
        catch(error){
          return res.json({
            success:false,
            error:'Error while querying the database'
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
        error:"Error while querying the database"
      })
    }
  })
})

// Edit request missing validation
router.post('/client/edit/:id',editClientValidationRules(),validate,checkAuthentication,(req,res)=>{

  return db.task('update-client',async t =>{
    await t.client_details.findConnectionForEdit(req.params.id).then(async client=>{
      console.log(req.body);
      if(client&&client.requester==req.user.sub){
        try {
          if(Object.keys(req.body.details).length !== 0){
            const w = await t.client_details.update(req.body.details,client.revision,client.id,req.user.sub);
            const s = await t.client_details.add(client,req.user.sub,client.revision,client.id);
          }
          for (var key in req.body.add){
            console.log(key);

            if(key==='client_contact') { const e = await t.client_contact.add(req.body.add[key],req.params.id);}
            else {const m = await t.client_general.add(key,req.body.add[key],req.params.id);}

          }
          for (var key in req.body.dlt){
            console.log(key);
            if(key==='client_contact'){const e = await t.client_contact.delete_one_or_many(req.body.dlt[key],req.params.id);}
            else {const n = await t.client_general.delete_one_or_many(key,req.body.dlt[key],req.params.id);}

          }
          return res.json({success:true});
        }
        catch(error){
          console.log('error');
          console.log(error);
          return res.json({
            success:false,
            error:'Error while querying the database'
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
