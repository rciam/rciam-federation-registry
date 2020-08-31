require('dotenv').config();
const {clientValidationRules,validate,postInvitationValidation} = require('../validator.js');
const qs = require('qs');
const {v1:uuidv1} = require('uuid');
const axios = require('axios').default;
const {merge_data,merge_services_and_petitions} = require('../merge_data.js');
const {addToString,clearPetitionData,sendMail,sendInvitationMail} = require('../functions/helpers.js');
const {db} = require('../db');
var diff = require('deep-diff').diff;
var router = require('express').Router();
var passport = require('passport');
var config = require('../config');
const customLogger = require('../loggers.js');
const petitionTables = ['service_petition_oidc_scopes','service_petition_oidc_grant_types','service_petition_oidc_redirect_uris'];
const serviceTables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris'];
const tables = ['service_oidc_scopes','service_oidc_grant_types','service_oidc_redirect_uris','service_contacts'];
const { generators } = require('openid-client');
const code_verifier = generators.codeVerifier();




// ----------------------------------------------------------
// ************************* Routes *************************
// ----------------------------------------------------------




// Route used to mock authentication during tests
//router.get('/auth/mock',checkTest, passport.authenticate('my-mock'));

router.get('/login',(req,res)=>{
  var clients = req.app.get('clients');
  res.redirect(clients.egi.authorizationUrl({
    client_id:process.env.CLIENT_ID_EGI,
    scope: 'openid email profile eduperson_entitlement',
    redirect_uri: process.env.REDIRECT_URI_EGI
  }));
})





// // Login Route
// router.get('/login/:tenant',function(req,res,next){passport.authenticate(req.params.tenant, {
//   successReturnToOrRedirect: process.env.OIDC_REACT
// })(req,res,next);});

// Callback Route
router.get('/callback/:tenant',(req,res,next)=>{
  var clients = req.app.get('clients');
  clients.egi.callback(process.env.REDIRECT_URI_EGI,{code:req.query.code}).then(async response => {
    let code = await db.tokens.addToken(response.access_token);
    clients.egi.userinfo(response.access_token).then(usr_info=>{
      saveUser(usr_info);
    }); // => Promise
    res.redirect(process.env.OIDC_REACT+'/code/' + code.code);
  });
});

router.get('/token/:code',(req,res,next)=>{
  try{
    db.task('deploymentResults', async t => {
      await t.tokens.getToken(req.params.code).then(async response=>{
        if(res){
          await t.tokens.deleteToken(req.params.code).then(deleted=>{
            if(deleted){
              res.status(200).json({token:response.token});
            }
          }).catch(err=>{next(err);})
        }
      }).catch(err=>{next(err);})
    })
  }
  catch(err){
    next(err)
  }
});


// Check Authentication
router.get('/auth',authenticate,(req,res,next)=>{
  if(req.user){
    res.status(200).end();
  }
  else{
    res.status(401).end();
  }
});

// Get User User Info
router.get('/user',authenticate,(req,res)=>{
  var clients = req.app.get('clients');
  TokenArray = req.headers.authorization.split(" ");
  clients.egi.userinfo(TokenArray[1]) // => Promise
  .then(function (userinfo) {
    let user = userinfo;
    // if(req.user.role.actions.includes('review_own_petition')){
      user.admin = true;
    // }
    user.role = req.user.role.name;
    res.end(JSON.stringify({
      user
    }));
  });

});



// ams push subscription for deployment results
// needs Authentication
router.post('/service/state',(req,res,next)=>{
  // Decode messages
  let updateData=[];
  let ids=[];
  req.body.messages.forEach((message) => {
    let decoded_message=(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
    updateData.push(decoded_message);
    ids.push(decoded_message.id);
  });

  return db.task('deploymentResults', async t => {
    // update state
    await t.service_state.updateMultiple(updateData).then(async result=>{
      if(result.success){
        // send acknowledgement regardless if notification are successfully sent
        res.sendStatus(200).end();
        // get service owner user info to send email notifications
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
router.get('/service/list',authenticate,(req,res,next)=>{
  try{
      if(req.user.role.actions.includes('get_services')&&req.user.role.actions.includes('get_petitions')){
        db.service_list.getAll(req.user.sub).then(response =>{
            return res.status(200).json({services:response});

        }).catch(err=>{next(err);});
      }
      else if(req.user.role.actions.includes('get_own_services')&&req.user.role.actions.includes('get_own_petitions')){
        db.service_list.getOwn(req.user.sub).then(response =>{
          return res.status(200).json({services:response});
        }).catch(err=>{next(err);});
      }
      else{
        res.status(401).json({err:'Requested action not authorised'})
      }
  }
  catch(err){
    next(err);
  }
});

// It fetches a petition with form data
router.get('/petition/:id',authenticate,(req,res,next)=>{
     db.task('find-petition-data',async t=>{
     if(req.user.role.actions.includes('get_petition')){
       await t.petition.get(req.params.id).then(result=>{return result.service_data}).then(petition => {
          if(petition){
             res.status(200).json({petition});
          }
          else {
            res.status(204);
            customLogger(req,res,'warn','Petition not found');
            res.end();
          }
        }).catch(err=>{next(err);});
      }
      else if(req.user.role.actions.includes('get_own_petition')){
        await t.petition.getOwn(req.params.id,req.user.sub).then(result=>{return result.service_data}).then(petition => {
          if(petition){
             res.status(200).json({petition});
          }
          else {
            res.status(204);
            customLogger(req,res,'warn','Petition not found');
            res.end();
          }
        }).catch(err=>{next(err);});
      }
      else {
        res.status(401).json({err:'Requested action not authorised'})
      }
    });
});


// Add a new client/petition
router.post('/petition',clientValidationRules(),validate,authenticate,asyncPetitionValidation,(req,res,next)=>{
  res.setHeader('Content-Type', 'application/json');
  if(req.user.role.actions.includes('add_own_petition')){
    try{
      db.tx('add-service', async t => {
        await t.petition.add(req.body,req.user.sub).then(async id=>{
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
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});

// Delete Petition
router.delete('/petition/:id',authenticate,(req,res,next)=>{
  if(req.user.role.actions.includes('delete_own_petition')){
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
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});

// Edit Petition
router.put('/petition/:id',clientValidationRules(),validate,authenticate,asyncPetitionValidation,(req,res,next)=>{
  if(req.user.role.actions.includes('update_own_petition')){
    return db.task('update-petition',async t =>{
      try{
        await t.petition.update(req.body,req.params.id).then(response=>{
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
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});

// It returns a service with form data
router.get('/service/:id',authenticate,(req,res,next)=>{
  if(req.user.role.actions.includes('get_own_service')){
    try{
      if(req.user.role.actions.includes('get_service')){
        db.service.get(req.params.id,'service').then(result=>{
          if(result){
            res.status(200).json({service:result.service_data});
          }
          else {
            res.status(204).end();
          }
        }).catch(err=>{next(err);})
      }
      else{
        return db.task('find-service-data',async t=>{
          await t.service_details.getProtocol(req.params.id,req.user.sub).then(async exists=>{
            if(exists){
              await t.service.get(req.params.id,'service').then(result=>{
                if(result){
                  res.status(200).json({service:result.service_data});
                }
                else {
                  res.status(204).end();
                }
              }).catch(err=>{next(err);})
            }
            else{
              res.status(204).end();
            }
          }).catch(err=>{next(err);});;
        });
      }
    }
    catch(err){
      next(err);
    }
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});

// Create petition for service deletion
router.put('/petition/delete/:service_id',authenticate,(req,res,next)=>{
  if(req.user.role.actions.includes('add_own_petition')&&req.user.role.actions.includes('update_own_petition')){
    db.task('create-delete-petition',async t =>{
      try{
        await t.service_details.getProtocol(req.params.service_id,req.user.sub).then(async belongs =>{
          if(belongs){
            await t.service.get(req.params.service_id,'service').then(async service => {
              if (service) {
                service = service.service_data;
                service.service_id = req.params.service_id;
                service.type = 'delete';
                await t.service_petition_details.openPetition(req.params.service_id).then(async open_petition_id=>{
                  if(open_petition_id){
                    await t.petition.update(service,open_petition_id).then(resp=>{
                      if(resp.success){
                        res.status(200).json({id:open_petition_id});
                      }
                      else{
                        //  throw warning
                      }
                    });
                  }
                  else {
                    await t.petition.add(service,req.user.sub).then(id=>{
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
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});

// Admin rejects petition
router.put('/petition/reject/:id',authenticate,canReview,(req,res,next)=>{
    try{
        db.task('reject-petition',async t =>{
          await t.service_petition_details.review(req.params.id,req.user.sub,'reject',req.body.comment).then(async results=>{
            if (results){
              await t.user.getPetitionOwners(req.params.id).then(data=>{
                if(data){
                  data.forEach(email_data=>{
                    sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'rejected'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
                  })
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
router.put('/petition/changes/:id',authenticate,canReview,(req,res)=>{
    try{
      db.tx('approve-with-changes-petition',async t =>{
        await t.petition.get(req.params.id).then(async petition =>{
          if(petition){
            petition.service_data.type = petition.meta_data.type;
            petition.service_data.service_id = petition.meta_data.service_id;
            petition.service_data.requester = petition.meta_data.requester;
            petition = petition.service_data;
            petition.comment = req.body.comment;
            petition.status = 'pending';
            await t.petition.add(petition,petition.requester).then(async id=>{
              if(id){
                await t.service_petition_details.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment).then(async result=>{
                  if(result){
                    res.status(200).json({id});
                    await t.user.getPetitionOwners(req.params.id).then(data=>{
                      if(data){
                        data.forEach(email_data=>{
                          sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'approved with changes'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
                        })
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
router.put('/petition/approve/:id',authenticate,canReview,(req,res,next)=>{
    try{
      db.tx('approve-petition',async t =>{
        let service_id;
        await t.petition.get(req.params.id).then(async petition =>{
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
                t.service.update(petition.service_data,petition.meta_data.service_id),
                t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment)
              ]);
            }
            else if(petition.meta_data.type==='create'){
              await t.service.add(petition.service_data,petition.meta_data.requester,petition.meta_data.group_id).then(async id=>{
                if(id){
                  service_id = id;
                  await t.service_petition_details.approveCreation(req.params.id,req.user.sub,'approved',req.body.comment,id);
                }
              }).catch(err=>{next(err);});
            }
            res.status(200).json({service_id});
            await t.user.getPetitionOwners(req.params.id).then(data=>{
              if(data){
                data.forEach(email_data=>{
                  sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'approved'},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
                })
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
router.get('/petition/history/:id',authenticate,(req,res)=>{
    try{
      if(req.user.role.actions.includes('get_petition')){
        db.petition.getOld(req.params.id,req.user.sub).then(petition =>{
          if(petition){
            res.status(200).json({petition:petition.service_data});
          }
          else{
            return res.status(204).end();
          }
        }).catch(err=>{next(err)});
      }
      else if (req.user.role.actions.includes('get_own_petition')){
        db.petition.getOwnOld(req.params.id,req.user.sub).then(petition =>{
          if(petition){
            res.status(200).json({petition:petition.service_data});
          }
          else{
            return res.status(204).end();
          }
        }).catch(err=>{next(err)});
      }
      else{
        res.status(401).json({err:'Requested action not authorised'})
      }
    }
    catch(err){
      next(err);
    }
});

// User owned or admin
router.get('/service/history/list/:id',authenticate,(req,res)=>{

    try{
      return db.tx('get-history-for-petition', async t =>{
        if(req.user.role.actions.includes('get_petitions')){
          await t.service_petition_details.getHistory(req.params.id).then(petition_list =>{
            return res.status(200).json({history:petition_list});
          }).catch(err=>{next(err)});
        }
        else if(req.user.role.actions.includes('get_own_petitions')){
          await t.service_petition_details.getProtocol(req.params.id).then(async service=>{
            if(service){
              await t.service_petition_details.getHistory(req.params.id).then(petition_list =>{
                return res.status(200).json({history:petition_list});
              }).catch(err=>{next(err)});
            }
          }).catch(err =>{next(err)});
        }
        else {
          res.status(401).json({err:'Requested action not authorised'});
        }

      });
    }
    catch(e){
      next(e);
    }


});

router.get('/petition/availability/:protocol/:id',authenticate,(req,res,next)=>{
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
// ********************** DEVELOPMENT ***********************
// ----------------------------------------------------------



router.post('/invitation',authenticate,postInvitationValidation(),validate,is_group_manager, (req,res,next)=>{
  try{
    req.body.code = uuidv1();
    req.body.invited_by = req.user.email;
    sendInvitationMail(req.body)
    db.invitation.add(req.body).then((response)=>{

      if(response){
        res.status(200).end();
      }
      else{
        res.status(204).end();
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
});


router.put('/group/remove_member',authenticate,is_group_manager,(req,res,next)=>{
  try{
    db.group.deleteSub(req.body.sub,req.body.group_id).then(response=>{
      if(response){
        res.status(200).end();
      }
      else{
        res.status(204).end();
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
})

router.put('/invitation/cancel/:id',authenticate,is_group_manager,(req,res,next)=>{
  try{
    db.invitation.delete(req.params.id).then(response=>{
      if(response){
        res.status(200).end();
      }
      else{
        res.status(204).end();
      }
    }).catch(err=>{next(err);})
  }
  catch(err){
      next(err);
  }
});

router.put('/invitation/:action/:invite_id',authenticate,(req,res,next)=>{
  try{
    if(req.params.action==='accept'){
      db.tx('accept-invite',async t =>{
        await t.invitation.getOne(req.params.invite_id,req.user.sub).then(async invitation_data=>{
          if(invitation_data){
            let done = await t.batch([
              t.group.addMember(invitation_data),
              t.invitation.reject(req.params.invite_id,req.user.sub)
            ]).catch(err=>{next(err)});
            res.status(200).end();
          }
          else{
            throw 'No invitation was found';
          }
        }).catch(err=>{next(err)})
      })
    }
    else if(req.params.action==='decline'){
      db.invitation.reject(req.params.invite_id,req.user.sub).then(response=>{
        if(response){
          res.status(200).end();
        }
        else{
          res.status(204).end();
        }
      }).catch(err=>{next(err);})
    }
    else{
      throw 'Invalid invitation response type';
    }
  }
  catch(err){
    next(err);
  }
})

router.get('/invitation',authenticate,(req,res,next)=>{
  try{
    db.invitation.get(req.user.sub).then((response)=>{
      if(response){
        res.status(200).json(response);
      }
      else{
        res.status(204).end()
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
});

router.get('/group/:group_id',authenticate,view_group,(req,res,next)=>{
  try{
    db.group.getMembers(req.params.group_id).then(group_members =>{
      if(group_members){
        res.status(200).json({group_members});
      }
      else{
        throw 'No group meber could be found';
      }
    })
  }
  catch(err){next(err);}
})

router.put('/invitation',authenticate,(req,res,next)=>{
  try{
    db.invitation.setUser(req.body.code,req.user.sub,req.user.email).then(success=>{
      if(success){
        res.status(200).send('Success');
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
})




// ----------------------------------------------------------
// ******************** HELPER FUNCTIONS ********************
// ----------------------------------------------------------

function is_group_manager(req,res,next){

  try{
//    req.body.group_id
    db.group.isGroupManager(req.user.sub,req.body.group_id).then(result=>{
      if(result){
        next();
      }
      else{
        throw "Can't access this resource";
      }
    }).catch(err=>{next(err)});
  }
  catch(err){
    next(err);
  }
}

function view_group(req,res,next){
  try{
    if(req.user.role.actions.includes('view_groups')){
      next();
    }
    else{
      db.group.isGroupManager(req.user.sub,req.params.group_id).then(result=>{
        if(result){
          next();
        }
        else{
          throw "Can't access this resource";
        }
      }).catch(err=>{next(err)});
    }
  }
  catch(err){
      next(err);
  }
}

// Authentication Middleware
function authenticate(req,res,next){
  try{
    if(process.env.NODE_ENV==='test-docker'||process.env.NODE_ENV==='test'){
      req.user ={};
      req.user.edu_person_entitlement = ['urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu','urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=vm_operator#aai.egi.eu'];
      req.user.sub =  "7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu";
      db.user_role.getRoleActions(req.user.edu_person_entitlement,1).then(role=>{
        if(role.success){
          req.user.role = role.role;
          next();
        }
      }).catch(err=>{next(err)});
    }
    else{
      const data = {'client_secret':process.env.CLIENT_SECRET_EGI}
      if(req.headers.authorization){
        TokenArray = req.headers.authorization.split(" ");
        axios({
          method:'post',
          url: 'https://aai-dev.egi.eu/oidc/introspect',
          params: {
            client_id:process.env.CLIENT_ID_EGI,
            token:TokenArray[1]
          },
          headers: {
            'Content-Type':'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          data: qs.stringify(data)
        }).then(result => {
          req.user = {};
          req.user.sub = result.data.sub;
          req.user.edu_person_entitlement = result.data.eduperson_entitlement;
          req.user.iss = result.data.iss;
          req.user.email = result.data.email;
          db.user_role.getRoleActions(req.user.edu_person_entitlement,1).then(role=>{
            if(role.success){
              req.user.role = role.role;
              next();
            }
            else{
              next(role.err);
            }
          }).catch((err)=> {
            next(err);
          });


        }, (error) =>{
          next(error)
        })
      }
      else{
        res.status(401).end();
      }
    }

  }
  catch(err){
    next(err);
  }

}

// Authenticating AmsAgent
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


// Checking Review Permitions
function canReview(req,res,next){
  if(req.user.role.actions.includes('review_petition')){
    next();
  }
  else if (true||req.user.role.actions.includes('review_own_petition')) {
    db.petition.canReviewOwn(req.params.id,req.user.sub).then(canReview=>{
      if(canReview){
        next();
      }
      else{
        res.status(401).json({err:'Requested action not authorised'});
      }
    })
  }
  else{
    res.status(401).json({err:'Requested action not authorised'});
  }
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
                  await t.service_details.getProtocol(req.body.service_id,req.user.sub).then(async service =>{
                    if(service.protocol){
                      if(service.protocol===req.body.protocol){
                          next();
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
        if(req.body.type==='create'){
          await t.service_petition_details.belongsToRequester(req.params.id,req.user.sub).then(async petition => {
            if(petition){
              if(petition.protocol!==req.body.protocol){
                res.status(403);
                customLogger(req,res,'warn','Tried to edit protocol petition.');
                return res.end();
              }
              if(petition.type!==req.body.type){
                return res.json({success:false,error:'Type of request cannot be modified'});
              }
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
            else {
              res.status(403);
              customLogger(req,res,'warn','Could not find petition with id:'+req.params.id);
              return res.end();
            }
          }).catch(err=>{next(err);});
        }
        else if (req.body.type==='edit'){
          await t.service_details.getProtocol(req.body.service_id,req.user.sub).then(async service => {
            if(service.protocol){
              if(service.protocol!==req.body.protocol){
                res.status(403);
                customLogger(req,res,'warn','Tried to edit protocol petition.');
                return res.end();
              }
              else{
                await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,req.body.service_id]:[t,req.body.entity_id,'saml',req.params.id,req.body.service_id])).then(async available=>{
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
            }
            else {
              res.status(403);
              customLogger(req,res,'warn','Could not find service with id:'+req.body.service_id);
              return res.end();
            }
          });
        }
        else if (req.body.type==='delete'){
            throw 'delete error';
        }
      }
    })
  }
  catch(err){
    next(err)
  }
}







module.exports = {
  router:router
}
