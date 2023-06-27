require('dotenv').config();
const {petitionValidationRules,validate,validateInternal,tenantValidation,formatPetition,getServiceListValidation,postInvitationValidation,serviceValidationRules,putAgentValidation,postAgentValidation,decodeAms,amsIngestValidation,reFormatPetition,getServicesValidation,formatServiceBooleanForValidation} = require('../validator.js');
const qs = require('qs');
const {v1:uuidv1} = require('uuid');
const axios = require('axios').default;
const {sendMail,sendInvitationMail,sendMultipleInvitations,sendDeploymentMail,delay} = require('../functions/helpers.js');
const {db} = require('../db');
var router = require('express').Router();
var config = require('../config');
var requested_attributes = require('../tenant_config/requested_attributes.json')
const customLogger = require('../loggers.js');
const {rejectPetition,approvePetition,changesPetition,getPetition,getOpenPetition,requestReviewPetition} = require('../controllers/main.js');
const {adminAuth,authenticate,clearCookies} = require('./authentication.js'); 
var CryptoJS = require("crypto-js");



// ----------------------------------------------------------
// ************************* Routes *************************
// ----------------------------------------------------------




function getData(req,res,next) {
  db.service.getAll(req.params.tenant,{},true).then(services=>{
    req.body = services;
    req.outdated_errors = [];
    //console.log(services);
    next();
  });
}

router.post('/tenants/:tenant/organizations',authenticate,(req,res,next)=>{
  try{
    db.organizations.add(req.body).then(response=>{
      if(response.exists){
        res.status(200).send({organization_id:response.organization_id});
      }
      else{
        res.status(409).send({organization_id:response.organization_id});
      }
    })
  }
  catch(err){
    next(err);
  }
});

router.get('/tenants/:tenant/organizations',authenticate,(req,res,next)=>{
  try{
    db.organizations.get(req.query.search_string,req.query.ror).then(organizations=>{
      if(organizations){
        res.status(200).send({organizations:organizations});
      }
    })
  }
  catch(err){
    next(err);
  }
});

router.put('/tenants/:tenant/services/validate',adminAuth,getData,serviceValidationRules({optional:true,tenant_param:true,check_available:false,sanitize:true,null_client_id:false}),validateInternal,(req,res,next)=>{
  try{
    // Initialized with O in case there are no new outdated services
    let outdated_ids = [];
    req.body.forEach((service,index)=>{
      if(service.outdated){
        outdated_ids.push(parseInt(service.id));
      };
    });
    db.service_state.updateOutdated(outdated_ids).then(result=>{
      res.status(200).send("Success, " + result.services_turned_outdated+ ' Services where flagged as outdated and '+ result.services_turned_up_to_date + " Services where unflagged.")
    }).catch(err=> {
      next(err);
    });
  }catch(err){
    next(err);
  }
});


// GET ALL SERVICES
router.get('/tenants/:tenant/services',getServicesValidation(),validate,authenticate_allow_unauthorised, (req,res,next)=>{
  try{
    if(req.query.tags){
      req.query.tags = req.query.tags.split(',');
    }
    if(req.query.exclude_tags){
      req.query.exclude_tags = req.query.exclude_tags.split(',');      
    }
    let authorised = !!(req.user && req.user.role && req.user.role.actions.includes('get_services'));
    if(req.query.outdated==='true'){
      db.service_state.getOutdatedServices(req.params.tenant).then(async outdated_services=>{
        if(outdated_services){
          res.status(200).send(outdated_services?outdated_services:[]);
          }
        else{
          res.status(200).send([]);
        }
      });
    }
    else {
      db.service.getAll(req.params.tenant,req.query,authorised).then(result=>{
        res.status(200).send(result?result:[]);
      }).catch(err=> {
        next(err);
      });
        
    }
  }
  catch(err){
    next(err);
  }
});






// Endpoint used to bootstrap a teant or generaly to import multiple services
// Add changeContacts to alter contacts
router.post('/tenants/:tenant/services',adminAuth,tenantValidation(),validate,formatServiceBooleanForValidation,serviceValidationRules({optional:true,tenant_param:true,check_available:true,sanitize:true,null_client_id:false}),validate,(req,res,next)=> {
  let services = req.body;
  // Populate json objects with all necessary fields
  services.forEach((service,index) => {
    services[index].tenant = req.params.tenant
    config.service_fields.forEach(field=>{
      if(!services[index].hasOwnProperty(field)){
        services[index][field] = null;
      }
    })
  })
  try{
    db.tx('addMultipleServices', async t => {
      await t.group.createMultiple(services).then(async ids=> {
        if(ids){
          services.forEach((service,index)=>{
            services[index].group_id = ids[index].id;
          });
          await t.service_details.addMultiple(services).then(async services =>{
            if(services){
              let contacts = [];
              let grant_types = [];
              let redirect_uris = [];
              let post_logout_redirect_uris = [];
              let scopes = [];
              let queries = [];
              let service_state = [];
              let invitations = [];
              let requested_attributes = [];
              services.forEach((service,index)=> {
                service_state.push({id:service.id,state:'deployed',outdated:(service.outdated?true:false)});
                if(service.contacts && service.contacts.length>0){
                  service.contacts.forEach(contact=>{
                    if(contact.type==='technical'){
                      invitations.push({tenant:req.params.tenant,email:contact.email,group_manager:true,code:uuidv1(),group_id:service.group_id});
                    }
                    contacts.push({owner_id:service.id,value:contact.email,type:contact.type});
                  });
                }
                if(service.protocol==='oidc'){
                  if(service.grant_types && service.grant_types.length>0){
                    service.grant_types.forEach(grant_type => {
                      grant_types.push({owner_id:service.id,value:grant_type});
                    });
                  }
                  if(service.scope && service.scope.length>0){
                    service.scope.forEach(scope => {
                      scopes.push({owner_id:service.id,value:scope});
                    });
                  }
                  if(service.redirect_uris && service.redirect_uris.length>0){
                    service.redirect_uris.forEach(redirect_uri => {
                      redirect_uris.push({owner_id:service.id,value:redirect_uri});
                    });
                  }
                  if(service.post_logout_redirect_uris && service.post_logout_redirect_uris.length>0){
                    service.post_logout_redirect_uris.forEach(post_logout_redirect_uri => {
                      post_logout_redirect_uris.push({owner_id:service.id,value:post_logout_redirect_uri});
                    });
                  }
                }
                if(service.protocol==='saml'){
                  if(service.requested_attributes&&service.requested_attributes.length>0){
                    service.requested_attributes.forEach(attribute=>{
                      requested_attributes.push({owner_id:service.id,...attribute})
                    });
                  }
                } 
              });
              queries.push(t.service_state.addMultiple(service_state));
              queries.push(t.service_details_protocol.addMultiple(services));
              if(contacts.length>0){
                queries.push(t.service_contacts.addMultiple(contacts));
              }
              if(grant_types.length>0){
                queries.push(t.service_multi_valued.addMultiple(grant_types,'service_oidc_grant_types'));
              }
              if(scopes.length>0){
                queries.push(t.service_multi_valued.addMultiple(scopes,'service_oidc_scopes'));
              }
              if(redirect_uris.length>0){
                queries.push(t.service_multi_valued.addMultiple(redirect_uris,'service_oidc_redirect_uris'));
              }
              if(post_logout_redirect_uris.length>0){
                queries.push(t.service_multi_valued.addMultiple(post_logout_redirect_uris,'service_oidc_post_logout_redirect_uris'));
              }
              if(requested_attributes&&requested_attributes.length>0){
                queries.push(t.service_multi_valued.addSamlAttributesMultiple(requested_attributes,'service_saml_attributes'));
              }
              await t.batch(queries).then(done=>{
                if(done){
                  if(invitations.length>0){
                      sendMultipleInvitations(invitations,t);
                    }
                    res.status(200).end();
                  }
              }).catch(err=>{
                res.status(422).send(err);
              });
            }
          }).catch(err=>{console.log(err);});
        }
      }).catch(err => {console.log(err); throw err})
    }).catch(err => {console.log(err); throw err})
  }
  catch(err){
    next(err);
  }
});


// Get tenant info and configuration for form fields
router.get('/tenants/:tenant',(req,res,next)=>{
  try{
    var clients = req.app.get('clients');
    db.tenants.getTheme(req.params.tenant).then(tenant=>{
      if(tenant){
        if(config[req.params.tenant].form){
          tenant.form_config = config[req.params.tenant].form;
        }
        if(config[req.params.tenant]){
          tenant.config = config[req.params.tenant];
        }
        if(config[req.params.tenant].restricted_env){
          tenant.restricted_environments = config[req.params.tenant].restricted_env;
        }
        tenant.form_config.requested_attributes = requested_attributes.filter(x=> config[req.params.tenant].form.supported_attributes.includes(x.friendly_name));
        tenant.logout_uri = clients[req.params.tenant].logout_uri;
        res.status(200).json(tenant).end();
      }
      else{
        res.status(404).end()
      }
    }).catch(err=>{throw err})
  }
  catch(err){
    next(err);
  }
});


// Get available tenants in the federation registry
router.get('/tenants',(req,res,next)=> {
  try{
    db.tenants.getInit().then(tenants => {
      if(tenants){
        res.status(200).json(tenants).end();
      }
      else {
        res.status(404).end()
      }
    })
  }
  catch(err){
    next(err);
  }
})


//   Used to redirect users to authentication proxy
router.get('/tenants/:tenant/login',(req,res)=>{
  var clients = req.app.get('clients');
  if(clients[req.params.tenant]){
    res.redirect(clients[req.params.tenant].authorizationUrl({
      client_id:clients[req.params.tenant].client_id,
      scope: 'openid email profile eduperson_entitlement',
      redirect_uri: process.env.REDIRECT_URI+req.params.tenant
    }));
  }else{
    res.redirect(tenant_config[Object.keys(tenant_config)[0]].base_url.split("/"+Object.keys(tenant_config)[0])[0]+'/404');
  }
});


// Callback Route
router.get('/callback/:tenant',(req,res,next)=>{
  var clients = req.app.get('clients');
  clients[req.params.tenant].callback(process.env.REDIRECT_URI+req.params.tenant,{code:req.query.code}).then(async response => {
    let code = await db.tokens.addToken(response.access_token,response.id_token);
    clients[req.params.tenant].userinfo(response.access_token).then(usr_info=>{
    console.log(usr_info);
    saveUser(usr_info,req.params.tenant);
  }); // => Promise
    res.redirect(tenant_config[req.params.tenant].base_url+'/code/' + code.code);
  });
});




// One time code to get access token during login
router.get('/tokens/:code',(req,res,next)=>{
  try{
    db.task('deploymentTasks', async t => {
      await t.tokens.getToken(req.params.code).then(async response=>{
        if(res){
          await t.tokens.deleteToken(req.params.code).then(deleted=>{
            if(deleted){
              let hash = req.app.get('hash');
              let federation_authtoken_encrypted  = CryptoJS.AES.encrypt(response.token, hash).toString();
              try{
                res.cookie('federation_authtoken',federation_authtoken_encrypted, {path:'/',domain:req.headers.host.replace( /:[0-9]{0,4}.*/, '' ),sameSite:'Strict',secure:true,httpOnly:true });
                res.cookie('federation_logoutkey',response.id_token, {path:'/',domain:req.headers.host.replace( /:[0-9]{0,4}.*/, '' ),sameSite:'Strict',secure:true});
              }
              catch(err){
                console.log(err);
              }
              res.status(200).json({token:response.token,federation_logoutkey:response.id_token});
            }
          }).catch(err=>{
            console.log(err);
            next(err);})
        }
      }).catch(err=>{next(err);})
    })
  }
  catch(err){
    next(err)
  }
});


// Route used for verifing push subscription
router.get('/ams/ams_verification_hash',(req,res)=>{
  console.log('ams verification');
  res.setHeader('Content-type', 'plain/text');
  res.status(200).send(process.env.AMS_VER_HASH);
})


router.get('/tenants/:tenant/services/:id/error',authenticate,(req,res,next)=>{
  try{
    if(req.user.role.actions.includes('view_errors')){

      db.service_errors.getErrorByServiceId(req.params.id).then(response=>{
        if(response){
          return res.status(200).json({error:response});
        }
        else{
          return res.status(404).end();
        }
      });
    }
  }
  catch(err){
    next(err);
  }
});

// Handle Deployment Error
router.put('/tenants/:tenant/services/:id/deployment',authenticate,(req,res,next)=> {
  try{
    if(req.user.role.actions.includes('error_action')){
      if(req.query.action==='resend'){
        db.tx('accept-invite',async t =>{
              let done = await t.batch([
                t.service_state.resend(req.params.id),
                t.deployment_tasks.resolveAllTasks(req.params.id),
                t.service_errors.archive(req.params.id),
              ]).catch(err=>{next(err)});
              res.status(200).end();
        }).catch(err=>{next(err)})
      }
      else{
        res.status(400).send('Unsupported Action');
      }
    }
    else{
      res.status(403).end();
    }
  }
  catch(err){
    next(err);
  }
})



// Get User User Endpoint
router.get('/tenants/:tenant/user',authenticate,(req,res,next)=>{
  try{
    var clients = req.app.get('clients');

    let federation_authtoken = req.cookies.federation_authtoken||req.headers.authorization.split(" ")[1]
    clients[req.params.tenant].userinfo(federation_authtoken) // => Promise
    .then(function (userinfo) {
      let user = userinfo;
      user = generatePreferredUsername(user);
      if(req.user.role.actions.includes('review_own_petition')||req.user.role.actions.includes('review_petition')){
        user.review = true;
      }
      if(req.user.role.actions.includes('get_service')){
        user.view_all = true;
      }
      else{
        user.view_all = false;
      }
      if(req.user.role.actions.includes('view_errors')){
        user.view_errors = true;
      }
      // Check if user has restricted access
      if(req.user.role.actions.includes('review_restricted')){
        user.review_restricted = true;
      }
      else{
        user.review_restricted = false;
      }
      user.actions = req.user.role.actions;
      user.role = req.user.role.name;
      res.end(JSON.stringify({user}));
    }).catch(err=>{
      res = clearCookies(res,req.headers.host);
      next(err)});
  }
  catch(err){
    res = clearCookies(res,req.headers.host);
    next(err)
  }
});

const format_error_email_data = (service_info,error_info,admins) => {
  email_data = [];
  error_info.forEach(error=>{
    let service_data = error;
    let admin_data = [];
    service_info.forEach(service=>{
      if(service.id===error.service_id){
        service_data.service_name = service.service_name;
        service_data.tenant = service.tenant;
        service_data.deployment_type = service.deployment_type;
        service_data.integration_environment = service.integration_environment;
      }
      // {name:email_data.name,email:email_data.email}
    });
    admins.forEach(admin=>{
      if(service_data.tenant===admin.tenant){
        admin_data.push(admin)
      }
    });
    email_data.push({service_data:service_data,admin_data:admin_data});
  });
  return email_data;
} 
// Push endpoint for recieving deployment result messages
router.post('/ams/ingest',checkCertificate,decodeAms,amsIngestValidation(),validate,(req,res,next)=>{
  // Decode messages
  try{
    return db.task('deploymentTasks', async t => {
      // update state
      await t.service_state.deploymentUpdate(req.body.decoded_messages).then(async response=>{
        let ids = response.deployed_ids;
        let errors = response.errors;
        if(ids){
          res.status(200).end();
          if(ids.length>0){
            await t.user.getServiceOwners(ids).then(async data=>{
              if(data){
                await t.service_petition_details.getTicketInfo(ids).then(async ticket_data=>{
                  if(ticket_data){
                    sendDeploymentMail(ticket_data);
                  }
                  if(errors.length>0){
                    await t.user.getUsersByAction('error_action').then(users=>{
                      let error_services = format_error_email_data(data,errors,users);
                      error_services.forEach(async error_data=>{
                        await delay(400);
                        sendMail({subject:'Deployment Error',url:"/services/"+error_data.service_data.service_id, ...error_data.service_data},'deployment-error-admin-notif.hbs',error_data.admin_data);
                      })
                      
                    }).catch(error=>{
                      next('Could not sent email to reviewers:' + error);
                    });
                  }
                  if(ids.length>0){
                    data.forEach(email_data=>{
                      sendMail({subject:'Service Deployment Result',service_name:email_data.service_name,state:email_data.state,tenant:email_data.tenant,deployment_type:email_data.deployment_type},'deployment-notification.hbs',[{name:email_data.name,email:email_data.email}]);
                    });
                  }
                });
              }
            }).catch(err=>{
              next('Could not sent deployment email.' + err);
            });
          }
        }
        else{
          next('Deployment Failed');
        }
      }).catch(err=>{
        console.log(err);
        res.status(200).send("Invalid Message");
      });
    });
  }
  catch(err){
    next(err);
  }
});



// ams-agent requests to set state to waiting development
// updateData = [{id:1,state:'deployed',tenant:'egi',protocol:'oidc'},{id:2,state:'deployed',tenant:'egi',protocol:'saml'},{id:3,state:'failed',tenant:'eosc',protocol:'oidc'}];
router.put('/agent/set_services_state',amsAgentAuth,(req,res,next)=>{
  try{
    return db.task('set_state_and_agents',async t=>{
      let service_pending_agents = [];
      await t.service_state.updateMultiple(req.body).then(async result=>{
        if(result){
          await t.deployer_agents.getAll().then(async agents => {
            if(agents){
              req.body.forEach(service=> {
                agents.forEach(agent => {
                  if(agent.tenant===service.tenant && agent.entity_protocol===service.protocol  && agent.entity_type==='service' && agent.integration_environment===service.integration_environment ){
                    service_pending_agents.push({agent_id:agent.id,service_id:service.id,deployer_name:agent.deployer_name});
                    
                  }
                })
              });
              await t.deployment_tasks.setDeploymentTasks(service_pending_agents).then(success=> {
                if(success){
                  res.status(200).end();
                }
                else{
                  next('Could not set pending deployers')
                }
              });
            }
            else{
              next('Failed to get deployer agents')
            }
          })
        }
        else{
          next('Failed to update state')
        }
      }).catch(err=>{console.log(err);});
    });
  }
  catch(err){next(err);}
});


// GET servicelist endpoint
// Find all clients/petitions from curtain user to create preview list
router.get('/tenants/:tenant/services/list', getServiceListValidation(),validate,authenticate,(req,res,next)=>{
  try{
      if(req.user.role.actions.includes('get_services')&&req.user.role.actions.includes('get_petitions')){
        db.service_list.get(req).then(response =>{
            if(response.length===0){
              response.push({
                list_items : [],
                full_count : 0
              })

            }
            return res.status(200).send(response[0]);
        }).catch(err=>{
          console.log(err);
          return res.status(416).send('Out of range');
        });
      }
      else if(req.user.role.actions.includes('get_own_services')&&req.user.role.actions.includes('get_own_petitions')){
        req.query.owned=true;
        db.service_list.get(req).then(response =>{
          if(response.length===0){
            response.push({
              list_items : [],
              full_count : 0
            })
          }
          return res.status(200).send(response[0]);
        }).catch(err=>{
          console.log(err)
          return res.status(416).send('Out of range');
        });
      }
      else{
        res.status(401).json({err:'Requested action not authorised'})
      }
  }
  catch(err){
    next(err);
  }
});


// ams-agent requests
router.get('/agent/get_new_configurations',amsAgentAuth,(req,res,next)=>{
//router.get('/agent/get_new_configurations',(req,res,next)=>{
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


// It returns a service with form data
// GET SERVICE Endpoint
router.get('/tenants/:tenant/services/:id',authenticate,(req,res,next)=>{
  if(req.user.role.actions.includes('get_own_service')){
    try{
      return db.task('find-service-data',async t=>{
        await t.service_details.getProtocol(req.params.id,req.user.sub,req.params.tenant).then(async exists=>{
          if(exists||req.user.role.actions.includes('get_service')){
            await t.service.get(req.params.id,req.params.tenant).then(async service=>{
              if(service){
                await t.service_state.getState(req.params.id).then(async service_state=>{
                  await t.service_errors.getErrorByServiceId(req.params.id).then(service_error=>{
                    delete service_state.id;
                    res.status(200).json({service:service.service_data,owned:(exists?true:false),...service_state,error:service_error});
                  });
                })
                }
              else {
                  res.status(404).end();
              }
            }).catch(err=>{next(err);})
          }
          else{
            res.status(404).end();
          }
        }).catch(err=>{next(err);});;
      });
    }
    catch(err){
      next(err);
    }
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
});



// Get all petitions linked to a service
router.get('/tenants/:tenant/services/:id/petitions',authenticate,(req,res)=>{

    try{
      return db.tx('get-history-for-petition', async t =>{
        if(req.user.role.actions.includes('get_petitions')){
          await t.service_petition_details.getHistory(req.params.id,req.params.tenant).then(petition_list =>{
            return res.status(200).json({history:petition_list});
          }).catch(err=>{next(err)});
        }
        else if(req.user.role.actions.includes('get_own_petitions')){
          await t.service_details.getProtocol(req.params.id,req.user.sub,req.params.tenant).then(async service=>{
            if(service){
              await t.service_petition_details.getHistory(req.params.id,req.params.tenant).then(petition_list =>{
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


// Get target petition
// Get Petition Endpoint
router.get('/tenants/:tenant/petitions/:id',authenticate,(req,res,next)=>{
  try{
    if(req.query.type==='open'){
      getOpenPetition(req,res,next,db);
    }
    else if(req.query.previous_state){
      db.tx('get-history-for-petition', async t =>{
        await t.petition.getLastStateId(req.params.id).then(last_id=>{
          req.params.id=last_id;
          getPetition(req,res,next,db);
        })
      })
    }
    else{
      getPetition(req,res,next,db);
    }
  }
  catch(err){
    next(err);
  }
});


// Add a new client/petition
// Post petition endpoint
router.post('/tenants/:tenant/petitions',authenticate,petitionValidationRules(),validate,formatPetition,formatServiceBooleanForValidation,serviceValidationRules({optional:false,tenant_param:true,check_available:false,sanitize:false,null_client_id:true}),validate,reFormatPetition,asyncPetitionValidation,(req,res,next)=>{
  res.setHeader('Content-Type', 'application/json');
  if(req.user.role.actions.includes('add_own_petition')){
    try{
      db.tx('add-service', async t => {
        if(req.body.type==='delete'){
          await t.service.get(req.body.service_id,req.params.tenant).then(async service => {
            if (service) {
              service = service.service_data;
              service.service_id = req.body.service_id;
              service.type = 'delete';
              service.tenant = req.params.tenant;
              await t.petition.add(service,req.user.sub).then(async id=>{
                if(id){
                  res.status(200).json({id:id});
                  await t.user.getUsersByAction('review_notification',req.params.tenant).then(users=>{
                    sendMail({subject:'New Petition to Review',service_name:service.service_name,tenant:req.params.tenant,url:"/services/"+req.body.service_id+"/requests/"+id+"/review",integration_environment:service.integration_environment},'reviewer-notification.html',users);
                  }).catch(error=>{
                    next('Could not sent email to reviewers:' + error);
                  });
                }
                else{
                  //  throw warning
                }
              }).catch(err=>{next(err)});
            }
          }).catch(err=>{next(err)});
        }
        else{
          req.body.tenant = req.params.tenant;
          await t.petition.add(req.body,req.user.sub).then(async id=>{
            if(id){
              res.status(200).json({id:id});
              await t.user.getUsersByAction('review_notification',req.params.tenant).then(users=>{
                sendMail({subject:'New Petition to Review',service_name:req.body.service_name,tenant:req.params.tenant,url:(req.body.service_id?"/services/"+req.body.service_id:"")+"/requests/"+id+"/review",integration_environment:req.body.integration_environment},'reviewer-notification.html',users);
              }).catch(error=>{
                next('Could not sent email to reviewers:' + error);
              });
            }
          }).catch(err=>{next(err)});
        }
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


// Delete Petition Endpoint
router.delete('/tenants/:tenant/petitions/:id',authenticate,(req,res,next)=>{
  if(req.user.role.actions.includes('delete_own_petition')){
    return db.tx('delete-petition',async t =>{
      try{
        await t.service_petition_details.canBeEditedByRequester(req.params.id,req.user.sub,req.params.tenant).then(async belongs =>{
          if(belongs){
            const deleted = await t.service_petition_details.deletePetition(req.params.id);
            if(deleted){
              return res.status(200).end();
            }
            else{
              next('Cant delete Petition');
            }

          }
          else{
            next('Could not delete petition');
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


// PUT Petition Endpoint
router.put('/tenants/:tenant/petitions/:id',authenticate,formatPetition,formatServiceBooleanForValidation,serviceValidationRules({optional:false,tenant_param:true,check_available:false,sanitize:false,null_client_id:true}),validate,reFormatPetition,asyncPetitionValidation, (req,res,next)=>{
  if(req.user.role.actions.includes('update_own_petition')){
    return db.task('update-petition',async t =>{
      try{
        if(req.body.type==='delete'){
          await t.service.get(req.body.service_id,req.params.tenant).then(async service => {
            if (service) {
              service = service.service_data;
              service.service_id = req.body.service_id;
              service.type = 'delete';
              await t.petition.update(service,req.params.id,req.params.tenant).then(resp=>{
                if(resp.success){
                  res.status(200).json();
                }
                else{
                  //  throw warning
                }
              }).catch(err=>{next(err)});
            }
          }).catch(err=>{next(err)});
        }
        else{
          await t.petition.update(req.body,req.params.id,req.params.tenant).then(response=>{
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


// Admin reviews petition
// Review Endpoint
router.put('/tenants/:tenant/petitions/:id/review',authenticate,canReview,(req,res,next)=>{
  try{
    if(req.body.type==='reject'){
      rejectPetition(req,res,next,db);
    }
    else if(req.body.type==='approve'){
      approvePetition(req,res,next,db);
    }
    else if(req.body.type==='changes'){
      changesPetition(req,res,next,db);
    }
    else if(req.body.type==='request_review'){
      requestReviewPetition(req,res,next,db);
    }
    else{
      throw 'Invalid review type'
    }
  }
  catch(err){
    next(err);
  }
});


// Check availability for protocol unique id
router.get('/tenants/:tenant/check-availability',(req,res,next)=>{
  db.tx('get-history-for-petition', async t =>{
    try{
      await isAvailable(t,req.query.value,req.query.protocol,(req.query.petition_id&&typeof(parseInt(req.query.petition_id))==='number'?req.query.petition_id:0),(req.query.service_id&&typeof(parseInt(req.query.service_id))==='number'?req.query.service_id:0),req.params.tenant,req.query.environment).then(available =>{
            res.status(200).json({available:available});
      }).catch(err=>{next(err)});
    }
    catch(err){
      next(err);
    }
  });
});



// -------------------------------------------------------------------------
// ----------------------Groups and Invitations-----------------------------
// -------------------------------------------------------------------------


// Get group members
router.get('/tenants/:tenant/groups/:group_id/members',authenticate,view_group,(req,res,next)=>{
  try{
    db.group.getMembers(req.params.group_id,req.params.tenant).then(group_members =>{
      if(group_members){
        res.status(200).json({group_members});
      }
      else{
        res.status(404).end();
      }
    })
  }
  catch(err){next(err);}
})



// Remove member from group
router.delete('/tenants/:tenant/groups/:group_id/members/:sub',authenticate,is_group_manager,(req,res,next)=>{
  try{
    db.group.deleteSub(req.params.sub,req.params.group_id).then(response=>{
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


// Create invitation and send email
router.post('/tenants/:tenant/groups/:group_id/invitations',authenticate,postInvitationValidation(),validate,canInvite, (req,res,next)=>{
  try{
    req.body.code = uuidv1();
    req.body.invited_by = req.user.email;
    req.body.tenant = req.params.tenant;

    // Send invitation to requested email
    sendInvitationMail(req.body).then(async email_sent=>{
      if(email_sent){
        // Email is sent succesfully
        // Save invitation to database
        await db.invitation.add(req.body).then((response)=>{
          if(response){
            res.status(200).send({code:req.body.code});
          }
          else{
            res.status(204).end();
          }
        }).catch(err=>{next(err)})
      }
      else{
        throw 'could not send invitation message'
      }
    }).catch(err => {next(err)});

  }
  catch(err){
    next(err);
  }
});


// Delete invitation
router.delete('/tenants/:tenant/groups/:group_id/invitations/:id',authenticate,canInvite,(req,res,next)=>{
  try{
    db.invitation.delete(req.params.id,req.params.tenant).then(response=>{
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


// Refresh invitation
router.put('/tenants/:tenant/groups/:group_id/invitations/:id',authenticate,canInvite,(req,res,next)=>{
  try{
    db.invitation.refresh(req.params.id).then(response=>{
      if(response&&response.code){
        response.tenant = req.params.tenant;
        sendInvitationMail(response)
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

// -- OK ---
// Accept/Reject invitation
router.put('/tenants/:tenant/invitations/:invite_id/:action',authenticate,(req,res,next)=>{
  try{
    if(req.params.action==='accept'){
      db.tx('accept-invite',async t =>{
        await t.invitation.getOne(req.params.invite_id,req.user.sub,req.params.tenant).then(async invitation_data=>{
          if(invitation_data){
            invitation_data.tenant = req.params.tenant;
            let done = await t.batch([
              t.group.addMember(invitation_data),
              t.group.newMemberNotification(invitation_data),
              t.invitation.reject(req.params.invite_id,req.user.sub,req.params.tenant)
            ]).catch(err=>{next(err)});
            res.status(200).end();
          }
          else{
            res.status(204).send("No invitation was found");
          }
        }).catch(err=>{next(err)})
      })
    }
    else if(req.params.action==='decline'){
      db.invitation.reject(req.params.invite_id,req.user.sub,req.params.tenant).then(response=>{
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


// Get all invitations for requesting user
router.get('/tenants/:tenant/invitations',authenticate,(req,res,next)=>{
  try{
    db.invitation.getAll(req.user.sub,req.params.tenant).then((response)=>{
      if(response){
        res.status(200).json(response);
      }
      else{
        res.status(404).end()
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
});


// Get all invitations for a specific group
router.get('/tenants/:tenant/groups/:group_id/invitations',authenticate,(req,res,next)=>{
  try{
  

    db.invitation.getByGroupId(req.params.group_id,req.params.tenant).then(invitations => {
      if(invitations){
        res.status(200).json({invitations});
      }
      else{
        res.status(404).end();
      }
    })
  }
  catch(err){
    next(err)
  }
})


// Activate invitation
router.put('/tenants/:tenant/invitations/activate_by_code',authenticate,(req,res,next)=>{
  try{
    db.invitation.setUser(req.body.code,req.user.sub,req.params.tenant).then(result=>{
      if(result.success){
        res.status(200).json({id:result.id});
      }
      else if (result.error) {
        res.status(406).json({error:result.error});
      }
      else {
        res.status(404).end();
      }
    }).catch(err=>{next(err)})
  }
  catch(err){
    next(err);
  }
})




// Tenants Deployer Agents
router.get('/agent/get_agents',amsAgentAuth,(req,res,next)=>{
  try{
    db.deployer_agents.getAll().then(result => {
      if(result){
        res.status(200).json({agents:result});
      }
      else{
        res.status(404).send('No agents found.')
      }
    })
  }
  catch(err){
    next(err);
  }
});

router.get('/tenants/:tenant/agents',(req,res,next)=>{
  try{
    db.deployer_agents.getTenantsAgents(req.params.tenant).then(result => {
      if(result){
        res.status(200).json({agents:result});
      }
      else{
        res.status(404).send('No agents found.')
      }
    })
  }
  catch(err){
    next(err);
  }
});


router.get('/tenants/:tenant/agents/:id',(req,res,next)=>{
  try{
    db.deployer_agents.getById(req.params.tenant,req.params.id).then(async result => {
      if(result){
        res.status(200).send(result);
      }
      else{
        res.status(404).send('No agent found')
      }
    })
  }
  catch(err){
    next(err);
  }
});


router.put('/tenants/:tenant/agents/:id',putAgentValidation(),validate,(req,res,next)=>{
  try{
    db.deployer_agents.update(req.body,req.params.id,req.params.tenant).then(result => {
      if(result){
        res.status(200).end();
      }
      else{
        res.status(404).send('Could not find agent')
      }
    })
  }
  catch(err){
    next(err);
  }
});


router.post('/tenants/:tenant/agents',postAgentValidation(),validate,(req,res,next)=>{
  try{

    db.deployer_agents.add(req.body.agents,req.params.tenant).then(async result => {
      if(result){
        res.status(200).end();
      }
      else{
        res.status(404).send('Could not add agents')
      }
    }).catch(err=>{next(err);})
  }
  catch(err){
    next(err);
  }
});


router.delete('/tenants/:tenant/agents',(req,res,next)=>{
  try{
    db.deployer_agents.deleteAll(req.params.tenant).then(result => {
      if(result){
        res.status(200).end();
      }
      else{
        res.status(404).send('No agents where found to delete');
      }
    })
  }
  catch(err){
    next(err);
  }

});


router.delete('/tenants/:tenant/agents/:id',(req,res,next)=>{
  try{
    db.deployer_agents.delete(req.params.tenant,req.params.id).then(result => {
      if(result){
        res.status(200).end();
      }
      else{
        res.status(404).send('No agent was found');
      }
    })
  }
  catch(err){
    next(err);
  }
});





// ----------------------------------------------------------
// ******************** HELPER FUNCTIONS ********************
// ----------------------------------------------------------


function is_group_manager(req,res,next){

  try{
    req.body.group_id=req.params.group_id;
    if(req.user.role.actions.includes('invite_to_group')||req.user.sub===req.params.sub){
      next();
    }
    else{
      db.group.isGroupManager(req.user.sub,req.body.group_id).then(result=>{
        if(result){
          next();
        }
        else{
          res.status(406).send({error:"Can't access this resource"});
        }
      }).catch(err=>{next(err)});
    }
  }
  catch(err){
    next(err);
  }
}

function canInvite(req,res,next){

  try{
    req.body.group_id=req.params.group_id;
    if(req.user.role.actions.includes('invite_to_group')){
      next()
    }
    else{
      db.group.isGroupManager(req.user.sub,req.body.group_id).then(result=>{
        if(result){
          next();
        }
        else{
          res.status(406).send({error:"Can't access this resource"});
        }
      }).catch(err=>{next(err)});
    }
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
      db.group.isGroupMember(req.user.sub,req.params.group_id).then(result=>{
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




function authenticate_allow_unauthorised(req,res,next){
  try{
    var clients = req.app.get('clients');
    const data = {'client_secret':clients[req.params.tenant].client_secret}
    if(req.headers.authorization){
      TokenArray = req.headers.authorization.split(" ");
      clients[req.params.tenant].userinfo(TokenArray[1]).then(userinfo => {
        req.user = userinfo;
        if(req.user.sub){
          db.user_role.getRoleActions(req.user.sub,req.params.tenant).then(role=>{
            if(role){
              req.user.role = role;
              next();
            }
            else{
              req.user= null;
              next();
            }
          }).catch((err)=> {
            req.user= null;
            next();
          });
        }
        else{
          req.user= null;
          next();
        }
      }).catch(err=> {
        req.user= null;
        next();
      })
    }
    else{
      req.user= null;
      next();
    }
  }catch(err){
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
  db.service_petition_details.getEnvironment(req.params.id,req.params.tenant).then(async environment=> {
    // Ckecking if review action is restricted for
    if(environment){
      if(req.body.type==='approve'&&config[req.params.tenant].restricted_env.includes(environment)&&!req.user.role.actions.includes('review_restricted')){
          res.status(401).json({error:'Requested action not authorised'});
      }
      else if(req.user.role.actions.includes('review_petition')||req.user.role.actions.includes('review_restricted')){
          next();
      }
      else {
        await db.petition.canReviewOwn(req.params.id,req.user.sub).then(service=>{
  
          if(service&&service.integration_environment==='development'){
            next();
          }
          else if(service){
             if (req.user.role.actions.includes('review_own_petition')){
               next();
             }
             else{
                res.status(401).json({error:'Requested action not authorised'});
             }
          }
          else{
            res.status(401).json({error:'Requested action not authorised'});
          }
        })
      }
    }
    else{
      res.status(401).json({error:'Requested action not authorised'});
    }
  }).catch(err=> {
    res.status(401).json({error:'Requested action not authorised'});
  })

}

// Save new User to db. Gets called on Authentication
const saveUser=(userinfo,tenant)=>{
  return db.tx('user-check',async t=>{
    return t.user.getUser(userinfo.sub,tenant).then(async user=>{
      if(user){
        if(!user.eduperson_entitlement||typeof(user.eduperson_entitlement)!=='object'){
          user.eduperson_entitlement = [];
        }
        if(!userinfo.eduperson_entitlement||typeof(userinfo.eduperson_entitlement)!=='object'){
          userinfo.eduperson_entitlement = [];
        }
        await t.user_role.getRole(userinfo.eduperson_entitlement,tenant).then(async role=>{
          if(role){
            let update_userinfo = false;
            let dlt_entitlements = [];
            let add_entitlements = [];
            let queries = [];
            add_entitlements = userinfo.eduperson_entitlement.filter(x=>!user.eduperson_entitlement.includes(x));
            dlt_entitlements = user.eduperson_entitlement.filter(x=>!userinfo.eduperson_entitlement.includes(x));
            delete userinfo.eduperson_entitlement;
            delete user.eduperson_entitlement;
            userinfo.role_id = role.id.toString();
            
            // Generate preferred username from given name and family name
            userinfo = generatePreferredUsername(userinfo);

            for (const property in userinfo) {
              if(user.hasOwnProperty(property)&&userinfo[property]!==user[property]){
                update_userinfo= true;
              }
            }
            if(update_userinfo){
              queries.push(t.user_info.update(userinfo,tenant));
            }
            if(add_entitlements.length>0){
              queries.push(t.user_edu_person_entitlement.add(add_entitlements,user.id));
            }
            if(dlt_entitlements.length>0){
              queries.push(t.user_edu_person_entitlement.dlt_values(dlt_entitlements,user.id));
            }
            if(queries.length>0){
              await t.batch(queries).then(done=>{
                if(done){
                  customLogger(null,null,'info','Updated User');
                }
              });
            }
          }
        }).catch(err=>{console.log(err);})
      }else{
        await t.user_role.getRole(userinfo.eduperson_entitlement,tenant).then(async role=>{
          if(role){
            userinfo.role_id = role.id;
            return t.user_info.add(userinfo,tenant).then(async result=>{
              if(result){
                  return t.user_edu_person_entitlement.add(userinfo.eduperson_entitlement,result.id);
              }
            });
          }
        });
      }
      


    })
    
  });
}

function checkCertificate(req,res,next) {
  if(req.headers['authorization']===process.env.AMS_AUTH_KEY){
    next();
  }
  else{
    res.status(401).send('Client Certificate Authentication Failure');
  }
}

// Checking Availability of Client Id/Entity Id
const isAvailable= async (t,id,protocol,petition_id,service_id,tenant,environment)=>{
  if(id){
    if(protocol==='oidc'){
      return t.service_details_protocol.checkClientId(id,service_id,petition_id,tenant,environment);
    }
    else if (protocol==='saml'){
      return t.service_details_protocol.checkEntityId(id,service_id,petition_id,tenant,environment);
    }
  }
  else {
    return true;
  }
}

const generatePreferredUsername = (userinfo) => {
  if(!userinfo.preferred_username&&userinfo.given_name&&userinfo.family_name){
    userinfo.preferred_username= (userinfo.given_name.replace(/[^a-zA-Z0-9]/g,'_').charAt(0)+userinfo.family_name.replace(/[^a-zA-Z0-9]/g,'_')).toLowerCase();;
  }
  return userinfo;
}

// This validation is for the POST,PUT /petition
function asyncPetitionValidation(req,res,next){
  // for all petitions we need to check for Client Id/Entity Id availability
  try{
    return db.tx('user-check',async t=>{
      // For the post
      if(req.route.methods.post){
        if(req.body.type==='create'){
          await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',0,0,req.params.tenant,req.body.integration_environment]:[t,req.body.entity_id,'saml',0,0,req.params.tenant,req.body.integration_environment])).then(async available=>{
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
          // Here we handle petitons of edit and delete type
          // First we need to make sure there aren't any open petitions for target service
          await t.service_petition_details.openPetition(req.body.service_id,req.params.tenant).then(async open_petition_id =>{
            if(!open_petition_id){
              await t.service_details.getProtocol(req.body.service_id,req.user.sub,req.params.tenant).then(async service =>{
                if(service&&service.protocol){
                  if(req.body.type==='delete'){

                    next();
                  }
                  else if(service.protocol===req.body.protocol){
                    await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',0,req.body.service_id,req.params.tenant,req.body.integration_environment]:[t,req.body.entity_id,'saml',0,req.body.service_id,req.params.tenant,req.body.integration_environment])).then(async available=>{
                      if(available){
                        next();
                      }
                      else {
                        res.status(422).send({error:'Protocol id is not available'});;
                        customLogger(req,res,'warn','Protocol id is not available');
                        return res.end();
                      }
                    });
                  }
                  else{
                    res.status(403).send({error:'Tried to edit protocol'});;
                    customLogger(req,res,'warn','Tried to edit protocol.');
                    return res.end();
                  }
                }
                else {
                  res.status(403).send({error:'Could not find petition with id: '+req.body.service_id});;
                  customLogger(req,res,'warn','Could not find service with id:'+req.body.service_id);
                  return res.end();
                }
              });
            }
            else {
              res.status(403).send({error:'Cannot create new petition because there is an open petition existing for target service'});
              customLogger(req,res,'warn','Cannot create new petition because there is an open petition existing for target service');
              return res.end();
            }
          });
        }
      }
      else if(req.route.methods.put){
        await t.service_petition_details.canBeEditedByRequester(req.params.id,req.user.sub,req.params.tenant).then(async petition => {
          if(petition&&petition.status!=='request_review'){
            if(req.body.type==='delete'){
              next();
            }
            else{
              if(petition.protocol!==req.body.protocol){
                customLogger(req,res,'warn','Tried to edit protocol.');
                return res.status(403).send({error:'Tried to edit protocol'});
              }
              if(petition.type==='create' && req.body.type!=='create'){
                customLogger(req,res,'warn','Tried to edit registration type');
                return res.status(403).send({error:'Tried to edit registration type'});
              }
              if(!req.body.service_id){
                req.body.service_id=0;
              }
              await isAvailable.apply(this,(req.body.protocol==='oidc'?[t,req.body.client_id,'oidc',req.params.id,req.body.service_id,req.params.tenant,req.body.integration_environment]:[t,req.body.entity_id,'saml',req.params.id,req.body.service_id,req.params.tenant,req.body.integration_environment])).then(async available=>{
                if(available){
                  next();
                }
                else{
                  customLogger(req,res,'warn','Protocol id is not available');
                  res.status(422).send({error:'Protocol id is not available'});
                }
              });
            }
          }
          else{
            res.status(403).send({error:'Could not edit petition with id: '+req.params.id});
            customLogger(req,res,'warn','Could not edit petition with id: '+req.params.id);
            return res.end();
          }
        }).catch(err=>{next(err);});;
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
