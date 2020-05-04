require('dotenv').config();
const {clientValidationRules,validate} = require('../validator.js');
const {merge_data,merge_services_and_petitions} = require('../merge_data.js');
const {addToString,clearPetitionData} = require('../functions/helpers.js');
const {db} = require('../db');
var diff = require('deep-diff').diff;
var router = require('express').Router();
var passport = require('passport');
var config = require('../config');


const petitionTables = ['service_petition_oidc_scopes','service_petition_oidc_grant_types','service_petition_oidc_redirect_uris'];
const serviceTables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris'];
const tables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris','service_contacts'];







// ----------------------------------------------------------
// ************************* Routes *************************
//

router.get('/auth/mock', passport.authenticate('my-mock'));
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
router.get('/servicelist',checkAuthentication,(req,res)=>{

    return db.task('find-services', async t => {
      let services = [];
      if (isAdmin(req)){ // If user is Admin we fetch all services
         await t.service_details.findAllForList().then(async response=>{
           services = response;
           await t.service_petition_details.findAllForList().then(petitions=>{
            services = merge_services_and_petitions(services,petitions);
           })
         })
      }
      else {
        await t.service_details.findBySubForList(req.user.sub).then(async response=>{
           services = response;
           await t.service_petition_details.findBySubForList(req.user.sub).then(petitions=>{
             services = merge_services_and_petitions(services,petitions);
           });
        });
      }
      if(services.length<1){
        return res.end(JSON.stringify({
          success:true,
          services:null
        }));
      }
      return res.end(JSON.stringify({
        success:true,
        services
      }));
    });
});



// It fetches a petition with form data
router.get('/petition/:id',checkAuthentication,(req,res)=>{
  return db.task('find-petition-data',async t=>{

    let requester;
    if(isAdmin(req)){
      requester = 'admin'
    }
    else {
      requester = req.user.sub
    }
    await t.service_petition_details.belongsToRequester(req.params.id,requester).then(async protocol=>{
      if(protocol){
        let petition = await t.service.get(req.params.id,'petition').then(result=>{return result.service_data})
          return res.json({
            success:true,
            petition
          });
        }
      else{
        return res.json({
          success:false,
          error:'Petition could not be found.'
        });
      }
    });
  });
});

// Add a new client/petition
router.post('/petition',clientValidationRules(),validate,checkAuthentication,asyncPetitionValidation,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
  return db.tx('add-service', async t => {
    try{
        await t.service.add(req.body,req.user.sub,'petition').then(id=>{
          if(id){
            return res.json({
              id:id,
              success:true
            });
          }
        });
    }
    catch(err){
      res.end(JSON.stringify({
        success:false,
        error:'Error querying the database.'
      }));
    }
  });
});

// Delete Petition
router.delete('/petition/:id',checkAuthentication,(req,res)=>{
  return db.tx('delete-petition',async t =>{
    try{
      await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async belongs =>{
        if(belongs){
          const deleted = await t.service_petition_details.deletePetition(req.params.id);
          return res.json({
            success:true,
            deleted:deleted
          })
        }
      })
    }
    catch(error){
      console.log(error);
      return res.json({
        success:false,
        error:"Error while querying the database"
      })
    }
  })
});



// Edit Petition
router.put('/petition/:id',clientValidationRules(),validate,checkAuthentication,asyncPetitionValidation,(req,res)=>{
  return db.task('create-delete-petition',async t =>{
    try{
      await t.service.update(req.body,req.params.id,'petition').then(resp=>{
        if(resp){
          return res.json({
            success:true,
            id:req.params.id
          })
        }
      });
    }
    catch(error){
      console.log(error);
      return res.json({
        success:false,
        error:error
      })
    }
  })
});

// It returns a service with form data
router.get('/service/:id',checkAuthentication,(req,res)=>{
      let requester;
      if(isAdmin(req)){
        requester = 'admin'
      }
      else {
        requester = req.user.sub
      }
      return db.task('find-service-data',async t=>{
        await t.service_details.belongsToRequester(req.params.id,requester).then(async protocol=>{
          if(protocol){
              const service = await t.service.get(req.params.id,'service').then(result=>{return result.service_data})
              return res.json({
                success:true,
                service
              });
            }
          else{
            return res.json({
              success:false,
              error:'Service with id: ' +req.params.id + ' could not be found.'
            });
          }
        });
      });
});

// Create petition for service deletion
router.put('/service/delete/:service_id',checkAuthentication,(req,res)=>{
  return db.task('create-delete-petition',async t =>{
    try{
      await t.service_details.belongsToRequester(req.params.service_id,req.user.sub).then(async belongs =>{
        if(belongs){
          await t.service.get(req.params.service_id,'service').then(async service => {
            if (service) {
              service = service.service_data;
              service.service_id = req.params.service_id;
              service.type = 'delete';
              await t.service_petition_details.openPetition(req.params.service_id).then(async open_petition_id=>{
                if(open_petition_id){
                  await t.service.update(service,open_petition_id,'petition').then(resp=>{
                    if(resp){
                      return res.json({
                        id:open_petition_id,
                        success:true
                      })
                    }
                  });
                }
                else {
                  await t.service.add(service,req.user.sub,'petition').then(id=>{
                    if(id){
                      return res.json({
                        id:id,
                        success:true
                      })
                    }
                  });
                }
              })
            }
          });
        }
        else{
          throw 'Not authorized for deletion.'
        }
      })
    }
    catch(error){
      console.log(error);
      return res.json({
        success:false,
        error:"Error while querying the database"
      })
    }
  })
});

// checking if clientId is available
router.get('/availability/oidc/:client_id',checkAuthentication,(req,res)=>{
  return db.task('check-client_id-exists', async t => {
    try{
      await isAvailable(t,req.params.client_id,'oidc',0,0).then(available=>{
        res.json({
          success:true,
          available:available
        })
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
});

// check entity_id is available
router.get('/availability/saml/:entity_id',checkAuthentication,(req,res)=>{
  return db.task('check-entity_id-exists', async t => {
    try{
      await isAvailable(t,req.params.entity_id,'saml',0,0).then(available=>{
        res.json({
          success:true,
          available:available
        })
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
});


// Admin rejects petition
router.put('/petition/reject/:id',checkAuthentication,checkAdmin,(req,res)=>{
  return db.task('reject-petition',async t =>{
    try{
      await t.service_petition_details.review(req.params.id,req.user.sub,'reject',req.body.comment);
        return res.json({
          success:true,
          message:'Request has been succesfully rejected'
        })

    }
    catch(error){
      console.log(error);
      return res.json({
        success:false,
        error:"Error while querying the database"
      })
    }
  })
});

// Leave Comment/Accept With Changes
router.put('/petition/changes/:id',checkAuthentication,checkAdmin,(req,res)=>{
  return db.tx('approve-with-changes-petition',async t =>{
    try{
      await t.service.get(req.params.id,'petition').then(async petition =>{
        if(petition){
          petition.service_data.type = petition.meta_data.type;
          petition.service_data.service_id = petition.meta_data.service_id;
          petition.service_data.requester = petition.meta_data.requester;
          petition = petition.service_data;
          petition.comment = req.body.comment;
          petition.status = 'pending';
          await t.service.add(petition,petition.requester,'petition').then(async id=>{
            if(id){
              await t.service_petition_details.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment);
              res.end(JSON.stringify({
                success:true,
                id:id,
                message:'Request has been succesfully reviewed'
              }));
            }
          }).catch(err=>{
            console.log(err);
            console.log('point-error');
            res.end(JSON.stringify({
              success:false,
              error:err,
            }));
          })
        }
        else{
          throw 'Petition not found';
        }
      })
      }
     catch(error){
       console.log(error);
       return res.json({
         success:false,
         error:"Error while querying the database"
       })
     }
  })
});

// Approve petition
router.put('/petition/approve/:id',checkAuthentication,checkAdmin,(req,res)=>{
  return db.tx('approve-petition',async t =>{
    try{
      let service_id;
      await t.service.get(req.params.id,'petition').then(async petition =>{
        if(petition){
          if(petition.meta_data.type==='delete'){
            service_id = petition.meta_data.service_id;
            await t.batch([
              t.service_details.delete(petition.meta_data.service_id),
              t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment)
            ]);
          }
          else if(petition.meta_data.type==='edit'){
            // Edit Service
            service_id = petition.meta_data.service_id;
            await t.batch([
               t.service.update(petition.service_data,petition.meta_data.service_id,'service'),
               t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment)
            ]);
           }
           else if(petition.meta_data.type==='create'){
             await t.service.add(petition.service_data,petition.meta_data.requester,'service').then(async id=>{
               if(id){
                 service_id = id;
                 await t.service_petition_details.approveCreation(req.params.id,req.user.sub,'approved',req.body.comment,id);
               }
             })
          }
           return res.json({
             service_id:service_id,
             success:true
           })
         }
         else{
           return res.json({
             success:false,
             error:"No Petition was found!"
           })
         }
       })
     }
     catch(error){
       console.log(error);
       return res.json({
         success:false,
         error:"Error while querying the database"
       })
     }
  })
});

// Get History For Service from Service id
router.get('/petition/history/:id',checkAuthentication,(req,res)=>{
  return db.task('find-petition-data',async t=>{
    await t.service_petition_details.belongsToRequesterHistory(req.params.id,req.user.sub).then(async belongs=>{
      if(belongs!== null){
        if(belongs||isAdmin(req)){
          let petition = await t.service.get(req.params.id,'petition');
          petition = petition.service_data;
          return res.json({
            success:true,
            petition
          });
        }
        else{
          return res.json({
            success:false,
            error:1
          });
        }
      }
      else{
        return res.json({
          success:false,
          error:2
        });
      }
    });
  });
});

// User owned or admin
router.get('/petition/history/list/:id',checkAuthentication,(req,res)=>{
  return db.tx('get-history-for-petition', async t =>{
    await t.service_details.belongsToRequester(req.params.id,req.user.sub).then(async is_owner=>{
      if(is_owner||isAdmin(req)){
        await t.service_petition_details.getHistory(req.params.id).then(async petition_list =>{
          if(petition_list){
            return res.json({
              success:true,
              history:petition_list
            });
          }
          else{
            return res.json({
              success:false,
              error:"Error while querying the database"
            });
          }
        });
      }
    });
  });
});


// ----------------------------------------------------------
// ******************** HELPER FUNCTIONS ********************
// ----------------------------------------------------------

// Authentication Middleware
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){next();}
  else{res.json({auth:false});}
}



// Admin Authenctication Middleware
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

// Checks Entitlements of user and returns Super Admin status
function isAdmin(req){
  let admin=false;
  if(req.user){
    if(req.user.eduperson_entitlement){
      config.super_admin_entitlements.forEach((item)=>{
        if(req.user.eduperson_entitlement.includes(item)){
          admin = true;
        }
      })
    }
  }
  return admin;
}

// Save new User to db. Gets called on Authentication
const saveUser=(userinfo)=>{
  return db.tx('user-check',async t=>{
    return t.user_info.findBySub(userinfo.sub).then(async user=>{
      if(!user) {
        return t.user_info.add(userinfo).then(async result=>{
          if(result){
              return t.user_edu_person_entitlement.add(userinfo.eduperson_entitlement,result.id);
          }
        });
      }
    })

  });
}

// Checking Availability of Client Id/Entity Id
const isAvailable=(t,id,protocol,petition_id,service_id)=>{
  if(protocol==='oidc'){
    return t.service_details_protocol.checkClientId(id,service_id,petition_id);
  }
  else if (protocol==='saml'){
    return t.service_details_protocol.checkEntityId(id,service_id,petition_id);
  }
}


// This validation is for the POST,PUT /petition
function asyncPetitionValidation(req,res,next){
  // for all petitions we need to check for Client Id/Entity Id availability
  try{

    return db.tx('user-check',async t=>{
      // For the post
      if(req.route.methods.post){

        if(req.body.type==='create'){
          await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',0,0]:[t,req.body.entity_id,'saml',0,0])).then(async available=>{
            if(available){
              next();
            }
            else {throw 'Id is not available'};
          });
        }
        else{
          // Here we handle petitons of edit type
          // First we need to make sure there aren't any open petitions for target service
          await t.service_petition_details.openPetition(req.body.service_id).then(async open_petition_id =>{
            if(!open_petition_id){
              // Checking if client_id/entity_id is available
              await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',0,req.body.service_id]:[t,req.body.entity_id,'saml',0,req.body.service_id])).then(async available=>{
                if(available){
                  await t.service_details.belongsToRequester(req.body.service_id,req.user.sub).then(async protocol =>{
                    if(protocol){
                      if(protocol===req.body.protocol){
                        next();
                      }
                      else {throw 'Protocol cannot be modified';}
                    }
                  });
                }
                else {throw 'Id is not available';}
              });
            }
            else {throw 'A petition already exists for target service';}
          });
        }
      }
      else if(req.route.methods.put){
        await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async petition => {
          if(petition){
            if(petition.protocol!==req.body.protocol){
              throw 'Protocol can not be modified.';
            }
            if(petition.type!==req.body.type){
              throw 'Type of request cannot be modified';
            }
            if(req.body.type==='create'){
              await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,0]:[t,req.body.entity_id,'saml',req.params.id,0])).then(async available=>{
                if(available){
                  next();
                }
                else{
                   throw 'Id is not available'}
              });
            }
            else{
              await t.service_petition_details.getServiceId(req.params.id).then(async service_id => {
                await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,service_id]:[t,req.body.entity_id,'saml',req.params.id,service_id])).then(async available=>{
                  if(available){
                    next();
                  }
                  else{ throw 'Id is not available'}
                });
              })
            }
          }
          else {throw 'Petition not found';}
        });
      }
    })
  }
  catch(err){
    console.log(err);
    return res.json({
      success:false,
      error:err
    });
  }
}


















// Edit request missing validation





module.exports = {
  router:router,
  saveUser:saveUser
}
