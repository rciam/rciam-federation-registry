const { body,query,param } = require('express-validator');
const {reg} = require('../regex.js');
var config = require('../config');

const getRecipientsBroadcastNotifications = () => {
    return [
      param('tenant').custom((value,{req,location,path})=>{if(value in tenant_config){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
      query('contact_types').custom((value,{req,location,path})=>{
        try{
          let contact_types = value.split(',');
          if(contact_types.length>0){
            contact_types.forEach(contact_type=>{
              if(!config[req.params.tenant].form.contact_types.includes(contact_type)){
                throw new Error(contact_type + ' is not a supported contact type, supported contact types (' + config[req.params.tenant].form.contact_types + ')');            
              }
            })
          }
          else{
            throw new Error('No contact types provided');
          } 
          return true 
        }
        catch(err){
          throw new Error(err);
        }
      }),
      query('environments').custom((value,{req,location,path})=>{
        try{
          let environments = value.split(',');
          if(environments.length>0){
            environments.forEach(environment=>{
              if(!config[req.params.tenant].form.integration_environment.includes(environment)){
                throw new Error(environment + ' is not a supported environment, supported environments (' + config[req.params.tenant].form.integration_environment + ')');            
              }
            })
          }
          else{
            throw new Error('No environments provided');
          }  
          return true
        }
        catch(err){
          throw new Error(err);
        }
      }),
      query('protocols').custom((value,{req,location,path})=>{
        try{
          let protocols = value.split(',');
          if(protocols.length>0){
            protocols.forEach(protocol=>{
              if(!config[req.params.tenant].form.protocol.includes(protocol)){
                throw new Error(protocol + ' is not a supported protocol, supported protocols (' + config[req.params.tenant].form.protocol + ')');            
              }
            })
          }
          else{
            throw new Error('No protocols provided');
          }  
          return true
        }
        catch(err){
          throw new Error(err);
        }
      })
    ]
  }
  
  const outdatedNotificationsValidation = () => {
    return [
      body('integration_environment').exists().withMessage('Required Field').bail().isString().withMessage('name must be a string').bail().custom((value,{req,location,path})=>{
        try{
          if(!config[req.params.tenant].form.integration_environment.includes(value)){
            throw new Error(value + ' is not a supported integration_environment, supported values (' + config[req.params.tenant].form.integration_environment+ ')')
          }
          
        }
        catch(err){
          throw new Error(err);
        }
        return true;
      })
    ]
  }

  const ownersNotificationValidation = () => {
    return [
        body('name').exists().withMessage('Required Field').bail().isString().withMessage('name must be a string').isLength({min:4, max:360}).withMessage('name must be from 4 up to 360 characters'),
        body('email_body').exists().withMessage('Required Field').bail().isString().withMessage('email_body must be a string').isLength({min:4, max:32000}).withMessage('email_subject must be from 4 up to 32000 characters'),
        body('cc_emails').optional({checkFalsy:true}).isArray().withMessage('cc_emails must be an array').bail().custom((value,{req,location,path})=> {
          try{
            if(value.length>0){
              value.map((email,index)=>{
                if(!email.toLowerCase().match(reg.regEmail)){
                  throw new Error(email +" is not a valid email address");
                }
              }); 
            }
          }
          catch(err){
            throw new Error(err);
          }
          return true
        }),
        body('email_subject').exists().withMessage('Required Field').bail().isString().withMessage('email_subject must be a string').isLength({min:4, max:998}).withMessage('email_subject must be from 4 up to 64 characters'),
        body('email_address').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value,success=true)=> {if(!value.toLowerCase().match(reg.regEmail)){success=false} return success }).withMessage('Must be a valid email address'),      
        body('recipients').optional({checkFalsy:true}).isArray().withMessage('cc_emails must be an array').bail().custom((value,{req,location,path})=> {
            try{
              if(value.length>0){
                value.map((email,index)=>{
                  if(!email.toLowerCase().match(reg.regEmail)){
                    throw new Error(email +" is not a valid email address");
                  }
                }); 
              }
            }
            catch(err){
              throw new Error(err);
            }
            return true
          })
    ]
  }
  
  const broadcastNotificationsValidation = () => {
    return [
      body('name').exists().withMessage('Required Field').bail().isString().withMessage('name must be a string').isLength({min:4, max:360}).withMessage('name must be from 4 up to 360 characters'),
      body('email_body').exists().withMessage('Required Field').bail().isString().withMessage('email_body must be a string').isLength({min:4, max:32000}).withMessage('email_subject must be from 4 up to 32000 characters'),
      body('cc_emails').optional({checkFalsy:true}).isArray().withMessage('cc_emails must be an array').bail().custom((value,{req,location,path})=> {
        try{
          if(value.length>0){
            value.map((email,index)=>{
              if(!email.toLowerCase().match(reg.regEmail)){
                throw new Error(email +" is not a valid email address");
              }
            }); 
          }
        }
        catch(err){
          throw new Error(err);
        }
        return true
      }),
      body('email_subject').exists().withMessage('Required Field').bail().isString().withMessage('email_subject must be a string').isLength({min:4, max:998}).withMessage('email_subject must be from 4 up to 64 characters'),
      body('notify_admins').customSanitizer(value => {
        if(value==='true'|| (typeof(value)==="boolean" && value)){
          return true
        }
        else{
          return false
        }
      }).optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('notify_admins must be a boolean').bail(),
      body('email_address').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value,success=true)=> {if(!value.toLowerCase().match(reg.regEmail)){success=false} return success }).withMessage('Must be a valid email address'),
      body('contact_types').exists().withMessage('Required Field').isArray().bail().custom((value,{req,location,path})=> {   
        
        if(value.length>0){
          value.forEach(type=>{
            if(!config[req.params.tenant].form.contact_types.includes(type)){
              throw new Error(type +" is not a valid contact type");
            }
          });
        }
        return true;
        }),
      body('protocols').exists().withMessage('Required Field').isArray().bail().custom((value,{req,location,path})=> {   
      
        if(value.length>0){
          value.forEach(protocol=>{
            if(!['oidc','saml'].includes(protocol)){
              throw new Error(protocol +" is not a valid protocol");
            }
          });
        }
        return true;
        }),
      body('environments').exists().withMessage('Required Field').isArray().bail().custom((value,{req,location,path})=> {   
      
        if(value.length>0){
          value.forEach(environment=>{
            if(!config[req.params.tenant].form.integration_environment.includes(environment)){
              throw new Error(environment +" is not a valid environment");
            }
          });
        }
        return true;
        })
    ]
  }

  module.exports = {
    broadcastNotificationsValidation,
    outdatedNotificationsValidation,
    getRecipientsBroadcastNotifications,
    ownersNotificationValidation
  }
  