require('dotenv').config();
const {clientValidationRules,validate,editClientValidationRules} = require('../validator.js');
const {merge_data,merge_services_and_petitions} = require('../merge_data.js');
const {addToString} = require('../functions/helpers.js');
const {db} = require('../db');
var diff = require('deep-diff').diff;
var router = require('express').Router();
var passport = require('passport');
var config = require('../config');

const petitionTables = ['client_petition_scope','client_petition_grant_type','client_petition_redirect_uri'];
const serviceTables = ['client_service_scope','client_service_grant_type','client_service_redirect_uri'];
const tables = ['client_scope','client_grant_type','client_redirect_uri','client_contact'];



// ----------------------------------------------------------
// ************************* Routes *************************
// ----------------------------------------------------------

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
router.get('/services/user',checkAuthentication,(req,res)=>{
    return db.task('find-services', async t => {
      let services = [];
      if (isAdmin(req)){ // If user is Admin we fetch all services
         await t.client_services.findAllForList().then(async response=>{
           services = response;
           await t.client_petitions.findAllForList().then(petitions=>{
            services = merge_services_and_petitions(services,petitions);
           })
         })
      }
      else {
        await t.client_services.findBySubForList(req.user.sub).then(async response=>{
           services = response;
           await t.client_petitions.findBySubForList(req.user.sub).then(petitions=>{
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


// Add a new client/petition
router.post('/petition/create',clientValidationRules(),validate,checkAuthentication,checkClientId,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');

  return db.tx('add-client', async t => {
    try{
      await asyncValidation(t,req.body.client_id,req.body.service_id,req.user.sub,req.body.type).then(async valid_request=>{
        if (valid_request){
          await t.client_petitions.add(req.body,req.user.sub).then(async result=>{
            if(result){
              t.batch([
                t.client_general.add('client_petition_grant_type',req.body.grant_types,result.id),
                t.client_general.add('client_petition_scope',req.body.scope,result.id),
                t.client_general.add('client_petition_redirect_uri',req.body.redirect_uris,result.id),
                t.client_contact.add('client_petition_contact',req.body.contacts,result.id)
              ]);

              res.end(JSON.stringify({
                success:true,
                id:result.id
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
          let error;
          if(req.body.type==='create'){
            error = "Client Id is Already in Use"
          }
          else{
            error = "The Service that was targeted by this edit isn't accesible by you."
          }
          res.end(JSON.stringify({
            success:false,
            error:error
          }))
        }
      })
    }
    catch{
      res.end(JSON.stringify({
        success:false,
        error:'Error querying the database.'
      }))
    }
  });
});

// checking if clientId is available
router.get('/client/availability/:client_id',checkAuthentication,(req,res)=>{
  return db.task('check-client-exists', async t => {
    try{
      await isAvailable(t,req.params.client_id).then(available=>{
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

// It returns a service with form data
router.get('/getservice/:id',checkAuthentication,(req,res)=>{

      return db.task('find-service-data',async t=>{
        await t.client_services.findServiceDataById(req.params.id).then(async service=>{
          if(service){
            if(service.requester==req.user.sub||isAdmin(req)){
              delete service.requester;
              const grant_types = await t.client_general.findDataById('client_service_grant_type',req.params.id);
              const scopes = await t.client_general.findDataById('client_service_scope',req.params.id);
              const redirect_uris = await t.client_general.findDataById('client_service_redirect_uri',req.params.id);
              const contacts = await t.client_contact.findDataById('client_service_contact',req.params.id);
              service = merge_data(service,grant_types,'grant_types');
              service = merge_data(service,scopes,'scope');
              service = merge_data(service,redirect_uris,'redirect_uris');
              service = merge_data(service,contacts,'contacts');
              return res.json({
                success:true,
                service
              });
            }
            else{
              return res.json({
                success:false,
                error:'Permition Denied.'
              });
            }
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
        await t.client_petitions.findPetitionDataById(req.params.id).then(async petition=>{
          if(petition){
            if(petition.requester==req.user.sub||isAdmin(req)){
              delete petition.requester;
              const grant_types = await t.client_general.findDataById('client_petition_grant_type',req.params.id);
              const scopes = await t.client_general.findDataById('client_petition_scope',req.params.id);
              const redirect_uris = await t.client_general.findDataById('client_petition_redirect_uri',req.params.id);
              const contacts = await t.client_contact.findDataById('client_petition_contact',req.params.id);
              petition = merge_data(petition,grant_types,'grant_types');
              petition = merge_data(petition,scopes,'scope');
              petition = merge_data(petition,redirect_uris,'redirect_uris');
              petition = merge_data(petition,contacts,'contacts');
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

// Edit Petition
router.post('/petition/edit/:id',editClientValidationRules(),validate,checkAuthentication,checkClientId,(req,res)=>{

  return db.task('update-petition',async t =>{
    await t.client_petitions.petitionType(req.params.id,req.user.sub).then(async type=>{
      if(type){
        try {
          const l = await t.client_petitions.setPending(req.params.id);
          if(Object.keys(req.body.petition_details).length !== 0){
            const w = await t.client_petitions.update(req.body.petition_details,req.params.id,type);
          }
          for (var key in req.body.add){

            if(key==='client_contact') { const e = await t.client_contact.add('client_petition_contact',req.body.add[key],req.params.id);}
            else {const m = await t.client_general.add(addToString(key,'petition'),req.body.add[key],req.params.id);}
          }
          for (var key in req.body.dlt){

            if(key==='client_contact'){const e = await t.client_contact.delete_one_or_many(addToString(key,'petition'),req.body.dlt[key],req.params.id);}
            else {const n = await t.client_general.delete_one_or_many(addToString(key,'petition'),req.body.dlt[key],req.params.id);}
          }
          return res.json({
            success:true,
            id:req.params.id
          });
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

// Create petition for service deletion
router.put('/service/delete/:id',checkAuthentication,(req,res)=>{
  return db.task('create-delete-petition',async t =>{
    try{
      await t.client_services.belongsToRequester(req.params.id,req.user.sub).then(async belongs =>{
        if(belongs){
          await t.client_petitions.deleteService(req.params.id,req.user.sub).then(async result=>{
            return res.json({
              success:true,
              id:result.id
            })
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
})

// Delete Petition
router.put('/petition/delete/:id',checkAuthentication,(req,res)=>{
  return db.tx('delete-petition',async t =>{
    try{
      await t.client_petitions.belongsToRequester(req.params.id,req.user.sub).then(async belongs =>{
        if(belongs){
          await t.batch([
            t.client_general.delete('client_petition_redirect_uri',req.params.id),
            t.client_general.delete('client_petition_scope',req.params.id),
            t.client_general.delete('client_petition_grant_type',req.params.id),
            t.client_contact.delete('client_petition_contact',req.params.id),
            t.client_petitions.deletePetition(req.params.id)
          ]);
        }
        return res.json({
          success:true
        })
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



// Not yet implemented
//        ||
//        ||
//        ||
//      \\||//
//        \/


// Approve petition
router.put('/petition/approve/:id',checkAuthentication,checkAdmin,(req,res)=>{
  return db.tx('approve-petition',async t =>{
    try{
      await t.client_petitions.getPetition(req.params.id).then(async petition =>{
        if(petition){
          if(petition.type==='delete'){
            await t.batch([
              t.client_general.delete('client_service_redirect_uri',petition.service_id),
              t.client_general.delete('client_service_scope',petition.service_id),
              t.client_general.delete('client_service_grant_type',petition.service_id),
              t.client_contact.delete('client_service_contact',petition.service_id),
              t.client_services.delete(petition.service_id),
              t.client_petitions.review(petition.id,req.user.sub,'approve',req.body.comment)
            ]);
          }
          else if(petition.type==='edit'){
            // Edit Service
            const service = await t.client_services.update(petition,petition.service_id,petition.requester);
            for(const item of tables){
              let repo = 'client_general';
              if(item==='client_contact'){
                repo = 'client_contact';
              }
              const petition_details = await t[repo].findDataById(addToString(item,'petition'),petition.id);
              const service_details = await t[repo].findDataById(addToString(item,'service'),petition.service_id);
              const pet_val =[];
              const serv_val =[];
              if(repo==='client_contact'){
                petition_details.forEach(item=>{
                  pet_val.push(item.value+' '+item.type);
                })
                service_details.forEach(item=>{
                  serv_val.push(item.value+' '+item.type);
                })
              }
              else {
                petition_details.forEach(item=>{
                  pet_val.push(item.value);
                })
                service_details.forEach(item=>{
                  serv_val.push(item.value);
                })
              }
              let add = pet_val.filter(x=>!serv_val.includes(x));
              let dlt = serv_val.filter(x=>!pet_val.includes(x));
              if(repo==='client_contact'){
                add.forEach((item,index)=>{
                  items = item.split(' ');
                  add[index]= {email:items[0],type:items[1]};
                });
                dlt.forEach((item,index)=>{
                  items = item.split(' ');
                  dlt[index]= {email:items[0],type:items[1]};
                })
               }
               await t.batch([
                 t[repo].add(addToString(item,'service'),add,petition.service_id),
                 t[repo].delete_one_or_many(addToString(item,'service'),dlt,petition.service_id)
               ]);
             }
             await t.client_petitions.review(req.params.id,req.user.sub,'approved',req.body.comment);

           }
           else if(petition.type==='create'){
             await t.client_services.add(petition,petition.requester).then(async result=>{
               if(result){
                 for(const item of tables){
                   let repo = 'client_general';
                   if(item==='client_contact'){
                     repo = 'client_contact';
                   }
                   await t[repo].findDataById(addToString(item,'petition'),petition.id).then(async details=>{

                     if(details){
                       let data = [];
                       if(repo==='client_contact'){
                         details.forEach(item=>{
                           data.push({email:item.value,type:item.type});
                         })
                       }
                       else{
                         details.forEach(item=>{
                           data.push(item.value);
                         })
                       }
                       await t[repo].add(addToString(item,'service'),data,result.id);
                     }
                   })
                 }

               }
               await t.client_petitions.review(req.params.id,req.user.sub,'approved',req.body.comment);

             }).catch(err=>{
               console.log(err);
               console.log('point-error');
               res.end(JSON.stringify({
                 success:false,
                 error:err,
               }));
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
})

//
router.put('/petition/reject/:id',checkAuthentication,checkAdmin,(req,res)=>{
  return db.task('reject-petition',async t =>{
    try{
      await t.client_petitions.review(req.params.id,req.user.sub,'reject',req.body.comment);
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
      await t.client_petitions.getPetition(req.params.id).then(async petition =>{
        if(petition){
          petition.comment = req.body.comment;
          petition.status = 'approved_with_changes';
          await t.client_petitions.add(petition,petition.requester).then(async result=>{
            if(result){
              for(const item of tables){
                let repo = 'client_general';
                if(item==='client_contact'){
                  repo = 'client_contact';
                }
                await t[repo].findDataById(addToString(item,'petition'),petition.id).then(async details=>{

                  if(details){
                    let data = [];
                    if(repo==='client_contact'){
                      details.forEach(item=>{
                        data.push({email:item.value,type:item.type});
                      })
                    }
                    else{
                      details.forEach(item=>{
                        data.push(item.value);
                      })
                    }
                    await t[repo].add(addToString(item,'petition'),data,result.id);
                  }
                })
              }

            }
            await t.client_petitions.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment);
            res.end(JSON.stringify({
              success:true,
              message:'Request has been succesfully reviewed'
            }))

          }).catch(err=>{
            console.log(err);
            console.log('point-error');
            res.end(JSON.stringify({
              success:false,
              error:err,
            }));
          })
       }
     }
     )}
     catch(error){
       console.log(error);
       return res.json({
         success:false,
         error:"Error while querying the database"
       })
     }
  })
})
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
  if(req.user.eduperson_entitlement){
    config.super_admin_entitlements.forEach((item)=>{
      if(req.user.eduperson_entitlement.includes(item)){
        admin = true;
      }
    })
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
const isAvailable=(t,id)=>{
  return t.client_services.clientIdIsAvailable(id).then(available=> {
      if (available){
        return t.client_petitions.clientIdIsAvailable(id);
      }
      else{return available}
  })
}

// Checking if user can create a petition for service with id = service_id
const asyncValidation = (t,client_id,service_id,sub,type) => {
  if(type==='create'){
    return isAvailable(t,client_id);
  }
  else{
    return t.client_services.belongsToRequester(service_id,sub);
  }
}



/// Here is where i am
function checkClientId(req,res,next){
  db.tx('clientId-check',async t=>{
      let client_id;
      if(req.body.client_id){
        client_id = req.body.client_id;
      }
      else{
        client_id = req.body.petition_details.client_id;
      }
      const valid1 = await t.client_petitions.checkClientId(client_id).then(async id =>{
        if(id){
          id =  id.id.toString();
          if(req.params.id===id){
            return true
          }else{

            return false
          }
        }
        else{
          return true
        }
      });
      const valid2 = await t.client_services.checkClientId(client_id).then(async id =>{
        if(id){
          if(req.body.service_id){ // if type of request === create
            if(req.body.service_id===id.id){return true}else{return false}
          }
          else{ // if type of request === edit
            const service_id = await t.client_petitions.getServiceId(req.params.id);
            id =  id.id.toString();
            if(service_id.service_id===id){return true}
            return false
          }
        }
        else{return true}
      });

      if(valid1&&valid2){
        next();
      }
      else{
        res.json({
          success:false,
          error:"Client id already used"
        })
      }
    });
}












// Edit request missing validation





module.exports = {
  router:router,
  saveUser:saveUser
}
