require('dotenv').config();
const {clientValidationRules,validate} = require('../validator.js');
const {merge_data,merge_services_and_petitions} = require('../merge_data.js');
const {addToString,clearPetitionData,sendMail} = require('../functions/helpers.js');
const {db} = require('../db');
var diff = require('deep-diff').diff;
var router = require('express').Router();
var passport = require('passport');
var config = require('../config');
const customLogger = require('../loggers.js');
const petitionTables = ['service_petition_oidc_scopes','service_petition_oidc_grant_types','service_petition_oidc_redirect_uris'];
const serviceTables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris'];
const tables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris','service_contacts'];





// ----------------------------------------------------------
// ************************* Routes *************************
//
// router.get('/test',(req,res,next)=>{
//   try{
//     let updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:20,state:'failed'}];
//     db.service_state.updateMultiple(updateData).then(result=>{
//       if(result.success){
//         res.status(200);
//       }
//       else{
//          throw 'broken';
//       }
//     }).catch(next);
//   }
//   catch(err){
//     next(new Error(err));
//   }
// })



router.get('/auth/mock',checkTest, passport.authenticate('my-mock'));
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
  res.status(200).end();
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

// ams push subscription for deployment results
// needs Authentication
router.post('/service/state',(req,res,next)=>{
  let updateData=[];
  let ids=[];
  req.body.messages.forEach((message) => {
    let decoded_message=(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
    updateData.push(decoded_message);
    ids.push(decoded_message.id);
  });
  return db.task('deploymentResults', async t => {
    await t.service_state.updateMultiple(updateData).then(async result=>{
      if(result.success){
        res.sendStatus(200).end();
        await t.user.getServiceOwners(ids).then(data=>{
          if(data){
            data.forEach(email_data=>{
              sendMail({subject:'Service Deployment Result',service_name:email_data.service_name,state:email_data.state},'deployment-notification.html',[{name:email_data.name,email:email_data.email}]);
            })
          }
        }).catch(err=>{
          next('Could not sent deployment email.' + err);
        });
      }
      else{
        next(result.error);
      }
    }).catch(err=>{
      next(err);
    });
  });
});

// Route used for verifing push subscription
router.get('/ams_verification_hash',(req,res)=>{
  console.log('ams verification');
  res.setHeader('Content-type', 'plain/text');
  res.status(200).send('67647c730ced41b9c60ad4da4c06170bf3f1d3c9');
})

// ams-agent requests to set state to waiting development
router.put('/service/state',amsAgentAuth,(req,res,next)=>{
  try{
    db.service_state.updateMultiple(req.body).then(result=>{
      if(result.success){
        res.status(200).end();
      }
      else{
        next(result.error);
      }
    });
  }
  catch(err){
    next('Could not set state sent by ams agent'+ err);
  }
});

// ams-agent requests to get pending services
router.get('/service/pending',amsAgentAuth,(req,res,next)=>{
  try{
    db.service.getPending().then(services=>{
      if(services){
        res.status(200).json({services});
      }
    }).catch((err)=>{
      next(err);
    });
  }
  catch(err){
    next(err);
  }

})

// Find all clients/petitions from curtain user to create preview list
router.get('/service/list',checkAuthentication,(req,res,next)=>{
  try{

    db.task('find-services', async t => {
      let services;
      if (isAdmin(req)){ // If user is Admin we fetch all services
         await t.service_details.findAllForList().then(async response=>{
           if(response){
             services = response;
             await t.service_petition_details.findAllForList().then(petitions=>{
               services = merge_services_and_petitions(services,petitions);
             }).catch(err=>{next(err);});
           }
         }).catch(err=>{next(err);})
      }
      else {
        await t.service_details.findBySubForList(req.user.sub).then(async response=>{
           services = response;
           await t.service_petition_details.findBySubForList(req.user.sub).then(petitions=>{
             services = merge_services_and_petitions(services,petitions);
           }).catch(err=>{next(err);});
        }).catch(err=>{next(err);});
      }
      return res.status(200).json({services});
    });
  }
  catch(err){
    next(err);
  }
});

// It fetches a petition with form data
router.get('/petition/:id',checkAuthentication,(req,res,next)=>{
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
          return res.status(200).json({petition});
        }
      else{
        res.status(204);
        customLogger(req,res,'warn','Petition not found');
        res.end();
      }
    }).catch(err=>{next(err);});
  });
});

// Add a new client/petition
router.post('/petition',clientValidationRules(),validate,checkAuthentication,asyncPetitionValidation,(req,res,next)=>{
  res.setHeader('Content-Type', 'application/json');
  try{
    db.tx('add-service', async t => {
          await t.service.add(req.body,req.user.sub,'petition').then(async id=>{
            if(id){
              res.status(200).json({id:id});
              await t.user.getReviewers().then(users=>{
                sendMail({subject:'New Petition to Review',service_name:req.body.service_name},'reviewer-notification.html',users);
              }).catch(error=>{
                next('Could not sent email to reviewers:' + err);
              });
            }
          }).catch(err=>{next(err)});
    });
  }
  catch(err){
    res.status(500).json({error:'Error querying the database.'});
    next(err);
  }
});

// Delete Petition
router.delete('/petition/:id',checkAuthentication,(req,res,next)=>{

  return db.tx('delete-petition',async t =>{
    try{
      await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async belongs =>{
        if(belongs){
          const deleted = await t.service_petition_details.deletePetition(req.params.id);
          if(deleted){
              return res.status(200).end();
          }
          else{
            next('Cant delete Petition');
          }

        }
      }).catch(err=>{next(err);})
    }
    catch(error){
      next(err);
    }
  });
});

// Edit Petition
router.put('/petition/:id',clientValidationRules(),validate,checkAuthentication,asyncPetitionValidation,(req,res,next)=>{
  return db.task('update-petition',async t =>{
    try{

      await t.service.update(req.body,req.params.id,'petition').then(response=>{
        if(response.success){
          res.status(200).end();
        }
        else{
          if(response.error){
            next(response.error);
          }
        }
      }).catch(err=>{next(err)});
    }
    catch(err){
      next(err);
    }
  })
});

// It returns a service with form data
router.get('/service/:id',checkAuthentication,(req,res,next)=>{
      let requester;
      if(isAdmin(req)){
        requester = 'admin'
      }
      else {
        requester = req.user.sub
      }
      try{
        return db.task('find-service-data',async t=>{
          await t.service_details.belongsToRequester(req.params.id,requester).then(async exists=>{
            if(exists){
                const service = await t.service.get(req.params.id,'service').then(result=>{return result.service_data}).catch(err=>{next(err);});
                return res.status(200).json({service});
              }
            else{
              res.status(204).end();
            }
          }).catch(err=>{next(err);});;
        });
      }
      catch(err){
        next(err);
      }
});

// Create petition for service deletion
router.put('/petition/delete/:service_id',checkAuthentication,(req,res,next)=>{
   db.task('create-delete-petition',async t =>{
    try{
      await t.service_details.belongsToRequester(req.params.service_id,req.user.sub).then(async belongs =>{
        if(belongs&&(belongs.state==='deployed')){
          await t.service.get(req.params.service_id,'service').then(async service => {
            if (service) {
              service = service.service_data;
              service.service_id = req.params.service_id;
              service.type = 'delete';
              await t.service_petition_details.openPetition(req.params.service_id).then(async open_petition_id=>{
                if(open_petition_id){
                  await t.service.update(service,open_petition_id,'petition').then(resp=>{
                    if(resp.success){
                       res.status(200).json({id:open_petition_id});
                    }
                    else{
                      //  throw warning
                    }
                  });
                }
                else {
                  await t.service.add(service,req.user.sub,'petition').then(id=>{
                    if(id){
                      res.status(200).json({id});
                    }
                  });
                }
              })
            }
          }).catch(err=>{next(err);});
        }
        else{
          // counld not find petition for target user
          res.status(204).end();
        }
      }).catch(err=>{next(err)})
    }
    catch(err){
      next(err);
    }
  })
});

// Admin rejects petition
router.put('/petition/reject/:id',checkAuthentication,checkAdmin,(req,res,next)=>{
  try{
    db.task('reject-petition',async t =>{
      await t.service_petition_details.review(req.params.id,req.user.sub,'reject',req.body.comment).then(async results=>{
        if (results){
          await t.user.getPetitionOwner(req.params.id).then(email_data=>{
            if(email_data){
              sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'rejected'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
            }
          }).catch(err=>{next(err)});
         res.status(200).end();
        }
        else{
         res.status(204).end();
        }
      }).catch(err=>{next(err);});
    })
  }
  catch(error){next(error);}
});

// Leave Comment/Accept With Changes
router.put('/petition/changes/:id',checkAuthentication,checkAdmin,(req,res)=>{
  try{
    db.tx('approve-with-changes-petition',async t =>{
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
              await t.service_petition_details.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment).then(async result=>{
                if(result){
                  res.status(200).json({id});
                  await t.user.getPetitionOwner(req.params.id).then(email_data=>{
                    if(email_data){
                      sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'approved with changes'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
                    }
                  }).catch(err=>{next(err);});
                }
              }).catch(err=>{next(err);});
            }
          }).catch(err=>{next(err);});
        }
        else{
          res.status(204).end();
        }
      }).catch(err=>{next(err);});
    })
  }
  catch(error){next(error);}
});

// Approve petition
router.put('/petition/approve/:id',checkAuthentication,checkAdmin,(req,res,next)=>{
  try{
    db.tx('approve-petition',async t =>{
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
             }).catch(err=>{next(err);});
          }
          res.status(200).json({service_id});
          await t.user.getPetitionOwner(req.params.id).then(email_data=>{
            if(email_data){
              sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'aprroved'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
            }
          }).catch(err=>{next(err);})
         }
         else{
           res.status(204).end();
         }
       }).catch(err=>{next(err);})
     })
  }
  catch(error){
    next(error);
  }
});

// Get History For Service from Service id
router.get('/petition/history/:id',checkAuthentication,(req,res)=>{
  try{
    return db.task('find-petition-data',async t=>{
      await t.service_petition_details.belongsToRequesterHistory(req.params.id,req.user.sub).then(async belongs=>{
          if(belongs||isAdmin(req)){
            let petition = await t.service.get(req.params.id,'petition');
            petition = petition.service_data;
            return res.status(200).json({petition});
          }
          else{
            return res.status(204).end();
          }
      }).catch(err=>{next(err);});
    });
  }
  catch(err){
    next(err);
  }
});

// User owned or admin
router.get('/service/history/list/:id',checkAuthentication,(req,res)=>{
  try{
    return db.tx('get-history-for-petition', async t =>{
      if(isAdmin(req)){
        requester = 'admin'
      }
      else {
        requester = req.user.sub
      }
      await t.service_details.belongsToRequester(req.params.id,requester).then(async exists=>{
        if(exists){
          await t.service_petition_details.getHistory(req.params.id).then(async petition_list =>{
            return res.json({success:true,history:petition_list});
          }).catch(err=>{next(err)});
        }
        else {res.status(204).end();}
      }).catch(err=>{next(err)});
    });
  }
  catch(e){
    next(e);
  }
});

router.get('/petition/availability/:protocol/:id',checkAuthentication,(req,res,next)=>{
  db.tx('get-history-for-petition', async t =>{
    try{
      await isAvailable(t,req.params.id,req.params.protocol,0,0).then(available =>{
            res.status(200).json({available:available});

      }).catch(err=>{next(err)});
    }
    catch(err){
      next(err);
    }
  });
});

// ----------------------------------------------------------
// ******************** HELPER FUNCTIONS ********************
// ----------------------------------------------------------

// Authentication Middleware
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){next();}
  else{res.status(401).end();}
}
// bZwolIWwWH9AzCjKB60dLCG6bYCCVinx
function amsAgentAuth(req,res,next){
  if(req.header('X-Api-Key')===process.env.AMS_AGENT_KEY){
    next();
  }
  else{
    res.status(401)
    customLogger(req,res,'warn','Unauthenticated request');
    res.json({success:false,error:'Authentication failure'})
  }
}

function checkTest(req,res,next){
 if(process.env.NODE_ENV==='test-docker'||process.env.NODE_ENV==='test'){
    next();
  }
  else{
    res.status(403);
    customLogger(req,res,'warn','Forbidden resourse');
    res.json({error:'Mock auth only available in test mode'});
  }
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
            else {
              res.status(422);
              customLogger(req,res,'warn','Protocol id is not available');
              return res.end();};
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
                  await t.service_details.belongsToRequester(req.body.service_id,req.user.sub).then(async service =>{
                    if(service){
                      if(service.protocol===req.body.protocol){
                        if(service.state==='deployed'){
                          next();
                        }
                        else{
                          res.status(403);
                          customLogger(req,res,'warn','Tried to edit petition awaiting development.');
                          return res.end();}
                      }
                      else {
                        res.status(403);
                        customLogger(req,res,'warn','Tried to edit protocol petition.');
                        return res.end();

                      }
                    }
                    else {
                      res.status(403);
                      customLogger(req,res,'warn','Could not find service with id:'+req.body.service_id);
                      return res.end();
                    }
                  });
                }
                else {
                  res.status(422);
                  customLogger(req,res,'warn','Protocol id is not available');
                  return res.end();
                }
              });
            }
            else {
              res.status(403);
              customLogger(req,res,'warn','Cannot create new petition because there is an open petition existing for target service');
              return res.end();
            }
          });
        }
      }
      else if(req.route.methods.put){
        await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async petition => {
          if(petition){
            if(petition.protocol!==req.body.protocol){
              res.status(403);
              customLogger(req,res,'warn','Tried to edit protocol petition.');
              return res.end();
            }
            if(petition.type!=='delete'&&petition.type!==req.body.type){
              return res.json({success:false,error:'Type of request cannot be modified'});
            }
            if(req.body.type==='create'){
              await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,0]:[t,req.body.entity_id,'saml',req.params.id,0])).then(async available=>{
                if(available){
                  next();
                }
                else{
                  res.status(422);
                  customLogger(req,res,'warn','Protocol id is not available');
                  return res.end();
                }
              });
            }
            else{
              await t.service_petition_details.getServiceId(req.params.id).then(async service_id => {
                await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,service_id]:[t,req.body.entity_id,'saml',req.params.id,service_id])).then(async available=>{
                  if(available){
                    next();
                  }
                  else{
                    res.status(422);
                    customLogger(req,res,'warn','Protocol id is not available');
                    return res.end();
                  }
                });
              }).catch(err=>{next(err);})
            }
          }
          else {
            res.status(403);
            customLogger(req,res,'warn','Could not find service with id:'+req.body.service_id);
            return res.end();
          }
        }).catch(err=>{next(err);});
      }
    })
  }
  catch(err){
    next(err)
  }
}

//
function sendError(res,err,next){
  res.json({success:false,error:err});
  next(new Error(err));
}



// Edit request missing validation





module.exports = {
  router:router,
  saveUser:saveUser
}
