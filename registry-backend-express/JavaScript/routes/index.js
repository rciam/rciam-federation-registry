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
router.get(('/test'),(req,res)=>{
  return res.end(JSON.stringify({
    success:true,
    services:'yesd'
  }));
});

router.post(('/newpetition/create/test'),checkAuthentication,(req,res)=>{

  return res.end(JSON.stringify({
    success:true,
    services:'yesd'
  }));
});

router.get(('/test/auth'),checkAuthentication,(req,res)=>{

  return res.end(JSON.stringify({
    success:true,
    services:'yesd'
  }));
});

router.get('/auth/mock', passport.authenticate('my-mock'));
// Login Route

router.get('/login',passport.authenticate('my-mock', {
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
router.get('/services/user',checkAuthentication,(req,res)=>{

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

// checking if clientId is available
router.get('/service/availability/oidc/:client_id',checkAuthentication,(req,res)=>{
  return db.task('check-client_id-exists', async t => {
    try{
      await isAvailable(t,req.params.client_id,'oidc').then(available=>{
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
router.get('/service/availability/saml/:entity_id',checkAuthentication,(req,res)=>{
  return db.task('check-entity_id-exists', async t => {
    try{
      await isAvailable(t,req.params.entity_id,'saml').then(available=>{
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

// Add a new client/petition
router.post('/newpetition/create',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
  return db.tx('add-service', async t => {
    try{
      if(req.body.type==='create'){
        await t.service.add(req.body,req.user.sub,'petition').then(id=>{
          if(id){
            return res.json({
              id:id,
              success:true
            })
          }
        });
      }
      else{
        throw "Wrong request type";
      }
    }
    catch(err){
      console.log(err);
      res.end(JSON.stringify({
        success:false,
        error:'Error querying the database.'
      }))
    }
  });
});

// Edit Requests
router.post('/newpetition/edit',clientValidationRules(),validate,checkAuthentication,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
  return db.tx('add-client', async t => {
    try{
      await t.service_details.belongsToRequester(req.body.service_id,req.user.sub).then(async protocol =>{
        if(protocol){
          if(protocol===req.body.protocol){
            await t.service.add(req.body,req.user.sub,'petition').then(resp=>{
              if(resp){
                return res.json({
                  success:true
                })
              }
            });
          }
          else {
            return res.json({
              success:false,
              error:'Protocol can not be modified.'
            })
          }
        }
      });
    }
    catch(err){
      console.log(err);
      res.end(JSON.stringify({
        success:false,
        error:'Error querying the database.'
      }))
    }
  });
});

// It returns a service with form data
router.get('/getservice/:id',checkAuthentication,(req,res)=>{
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

// It fetches a petition with form data
router.get('/getpetition/:id',checkAuthentication,(req,res)=>{
  return db.task('find-petition-data',async t=>{
    console.log(req.params.id);
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

// Edit Petition
router.post('/petition/edit/:id',clientValidationRules(),validate,checkAuthentication,(req,res)=>{

  return db.task('create-delete-petition',async t =>{
    try{
      await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async protocol =>{
        if(protocol){
          if(protocol===req.body.protocol){
            await t.service.update(req.body,req.params.id,'petition').then(resp=>{
              if(resp){
                return res.json({
                  success:true,
                  id:req.params.id
                })
              }
            });
          }
          else{
            return res.json({
              success:false,
              error:'Protocol can not be modified.'
            })
          }
        }
        else{
          throw 'no petition was found with id: '+req.params.id+" for user: " + req.user.sub;
        }
      });
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
                        success:true
                      })
                    }
                  });
                }
                else {
                  await t.service.add(service,req.user.sub,'petition').then(resp=>{
                    if(resp){
                      return res.json({
                        success:true
                      })
                    }
                  });
                }
              })
            }
          });
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

// Delete Petition
router.put('/petition/delete/:id',checkAuthentication,(req,res)=>{
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
})

// Leave Comment/Accept With Changes
router.put('/petition/approve/changes/:id',checkAuthentication,checkAdmin,(req,res)=>{
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
          await t.service.add(petition,petition.requester,'petition').then(async result=>{
            if(result){
              await t.service_petition_details.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment);
              res.end(JSON.stringify({
                success:true,
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
      await t.service.get(req.params.id,'petition').then(async petition =>{
        if(petition){
          if(petition.meta_data.type==='delete'){
            await t.batch([
              t.service_details.delete(petition.meta_data.service_id),
              t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment)
            ]);
          }
          else if(petition.meta_data.type==='edit'){
            // Edit Service
            await t.batch([
               t.service.update(petition.service_data,petition.meta_data.service_id,'service'),
               t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment)
            ]);
           }
           else if(petition.meta_data.type==='create'){
             await t.service.add(petition.service_data,petition.meta_data.requester,'service').then(async id=>{
               if(id){
                 await t.service_petition_details.approveCreation(req.params.id,req.user.sub,'approved',req.body.comment,id);
               }
             })
          }
           return res.json({
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
// Checking Availability of Client Id
const isAvailable=(t,id,protocol)=>{
  if(protocol==='oidc'){
    return t.service_details_protocol.checkClientId(id,0,0);
  }
  else if (protocol==='saml'){
    return t.service_details_protocol.checkEntityId(id,0,0);
  }
}


















// Edit request missing validation





module.exports = {
  router:router,
  saveUser:saveUser
}
