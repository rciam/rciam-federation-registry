var router = require('express').Router({ mergeParams: true });
const {db} = require('../db');
const {authenticate} = require('./authentication.js'); 
const {validate} = require('../validator.js');
const {delay,sendNotifications} = require('../functions/helpers.js');
const {sendOutdatedNotification} = require('../functions/outdated_notif.js');
const {broadcastNotificationsValidation,outdatedNotificationsValidation,getRecipientsBroadcastNotifications,ownersNotificationValidation} = require('../validation/notifications.js');


router.get('/broadcast/recipients',authenticate,getRecipientsBroadcastNotifications(),validate,(req,res,next)=>{
    try{
      let data = {};
      data.contact_types = req.query.contact_types.split(',');
      data.environments = req.query.environments.split(',');
      data.protocols = req.query.protocols.split(',')
    db.service.getContacts(data,req.params.tenant).then(async users=>{
        res.status(200).send(users);
      }).catch(err=>{
        next(err)
      })
    }
    catch(e){
      next(err)
    }
  });

router.put('/owners',authenticate,ownersNotificationValidation(),validate,(req,res,next)=>{
    try{
        
        if(req.user.role.actions.includes('send_notifications')){
          let reconfiguration_button = (/--\* *Reconfiguration Link *\*--/).test(req.body.email_body);
          req.body.email_body = req.body.email_body.split(/--\* *Reconfiguration Link *\*--/);
          sendNotifications({cc_emails:req.body.cc_emails,subject:req.body.email_subject,reconfigure_url:(reconfiguration_button?tenant_config[req.params.tenant].base_url+(req.body.service_id?'/services/'+ req.body.service_id:req.body.petition_id?'/requests/'+ req.body.petition_id:''):'')+'/edit',sender_name:req.body.name,sender_email:req.body.email_address,email_body:req.body.email_body,tenant:req.params.tenant},'owners-notification.hbs',req.body.recipients);
          res.status(200).send();
        }
        else{
            res.status(403).send('Unauthorized');
        }
    }
    catch(err){
        next(err);
    }
})
  
  
  router.put('/outdated',authenticate,outdatedNotificationsValidation(),validate,(req,res,next)=>{
    try{
      if(req.user.role.actions.includes('send_notifications')){
        db.service_state.getOutdatedOwners(req.params.tenant,req.body.integration_environment).then(async users=>{
          if(users){
            let outdated_services = [];
            if(users.length>0){
              users.forEach(user=>{
                if(!outdated_services.includes(user.service_id)){
                  outdated_services.push(user.service_id);
                }
              })
            }
            res.status(200).send({user_count:users.length,service_count:outdated_services.length});
            for(const user of users){
              await delay(400);
              sendOutdatedNotification(user);
            }       
          }
        }).catch(err=>{customLogger(null,null,'warn','Error when creating and sending invitations: '+err)})
      }
      else{
        res.status(403).end();
      }
    }
    catch(err){
      next(err);
    }
  })
  
  router.put('/broadcast',authenticate,broadcastNotificationsValidation(),validate,(req,res,next)=>{
    try{
      if(req.user.role.actions.includes('send_notifications')){
        db.service.getContacts(req.body,req.params.tenant).then(async users=>{
          if(req.body.notify_admins){
            admins = await db.user.getUsersByAction("send_notifications",req.params.tenant);
            admins.forEach(admin=>{
              if(!req.body.cc_emails.includes(admin.email)){
                req.body.cc_emails.push(admin.email);
              }
            })
          }
          if(users.length>0){
            sendNotifications({cc_emails:req.body.cc_emails,subject:req.body.email_subject,url:"/",sender_name:req.body.name,sender_email:req.body.email_address,email_body:req.body.email_body,tenant:req.params.tenant},'contacts-notification.hbs',users);
          }
          res.status(200).send({notified_users:users.length});
        })
      }
      else{
        res.status(403).end();
      }
    }
    catch(err){
      next(err);
    }
  })


  module.exports = router;