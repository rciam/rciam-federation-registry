const countryData = require('country-region-data');
const { body,query, validationResult,param,check } = require('express-validator');
const {reg} = require('./regex.js');
const {v1:uuidv1} = require('uuid');
const customLogger = require('./loggers.js');
var config = require('./config');
const {db} = require('./db');
const { runInNewContext } = require('vm');
const e = require('express');
let countryCodes =[];
var stringConstructor = "test".constructor;
countryData.forEach(country=>{
  countryCodes.push(country.countryShortCode.toLowerCase());
});


const amsIngestValidation = () => {
  return [
    body('decoded_messages').exists().withMessage('No agents found').bail().isArray({min:1}).withMessage('No agents found').bail().toArray(),
    body('decoded_messages.*.id').exists().withMessage('Required Field').bail().isInt({gt:0}).withMessage('Id must be a positive integer'),
    body('decoded_messages.*.agent_id').exists().withMessage('Required Field').bail().isInt({gt:0}).withMessage('Agent id must be a positive integer'),
    body('decoded_messages.*.external_id').optional({checkFalsy:true}).customSanitizer(value => {
      try{
        if (typeof value === 'string' || value instanceof String){
          return value
        }
        else {
          return value.toString();
        }
      }
      catch(err){
        return "";
      }
    })
    .isString().withMessage('Must be a string').isLength({min:1, max:36}).bail(),
    body('decoded_messages.*.client_id').optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().isLength({min:2, max:128}).bail()
  ]
}

const postInvitationValidation = () => {
  return[
    body('email').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value,success=true)=> {if(!value.toLowerCase().match(reg.regEmail)){success=false} return success }).withMessage('Must be an email'),
    body('group_manager').exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean')
  ]
}

const putAgentValidation = () => {
  return [
    body('type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.type.includes(value)){return true}else{return false}}).bail(),
    body('entity_type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_type.includes(value)){return true}else{return false}}).bail(),
    body('integration_environment').exists().withMessage('Required Field').isString().custom((value,{req,location,path})=> {   if(config.form[req.params.tenant].integration_environment.includes(value)){return true}else{return false}}).withMessage('Integration environment value not supported'),
    body('entity_protocol').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_protocol.includes(value)){return true}else{return false}}).bail(),
    body('hostname').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail()
  ]
}

const getServiceListValidation = () => {
  return [
    query('page').optional({checkFalsy:true}).isInt({gt:0}).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional({checkFalsy:true}).isInt({gt:0}).withMessage('Limit must be a positive integer').toInt(),
    query('env').optional({checkFalsy:true}).isString().custom((value,{req,location,path})=> {   if(config.form[req.params.tenant].integration_environment.includes(value)){return true}else{return false}}).withMessage('Integration environment value not supported'),
    query('protocol').optional({checkFalsy:true}).isString().custom((value,{req,location,path})=> {if(config.form[req.params.tenant].protocol.includes(value)){return true}else{return false}}).withMessage('Protocol not supported'),
    query('owned').optional({checkFalsy:true}).isBoolean().toBoolean(),
    query('orphan').optional({checkFalsy:true}).isBoolean().toBoolean(),
    query('pending').optional({checkFalsy:true}).isBoolean().toBoolean(),
    query('pending_sub').optional({checkFalsy:true}).isString().custom((value,{req,location,path})=> {if(['pending','changes','request_review'].includes(value)){return true}else{return false}}).withMessage('Value is not supported'),
    query('search_string').optional({checkFalsy:true}).isString(),
    query('owner').optional({checkFalsy:true}).isString(),
    query('error').optional({checkFalsy:true}).isBoolean().toBoolean(),    
  ]
}


const postAgentValidation = () => {
  return [
    body('agents').exists().withMessage('No agents found').bail().isArray({min:1}).withMessage('No agents found').bail().toArray(),
    body('agents.*.integration_environment').exists().withMessage('Required Field').isString().custom((value,{req,location,path})=> {   if(config.form[req.params.tenant].integration_environment.includes(value)){return true}else{return false}}).withMessage('Integration environment value not supported'),
    body('agents.*.type').exists().withMessage('Required Field').custom((value)=>{ if(config.agent.type.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.entity_type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_type.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.entity_protocol').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_protocol.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.hostname').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail()
  ]
}

// name :yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').required(t('yup_required')),
// email_body: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(4064,t('yup_char_max') + ' ('+4064+')').required(t('yup_required')),
// cc_emails: yup.array().nullable().of(yup.string().email(object=>{return object.value})),
// email_subject: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(64,t('yup_char_max') + ' ('+64+')').required(t('yup_required')),
// notify_admins: yup.boolean().nullable().required(t('yup_required')),
// email_address: yup.string().nullable().email().required(t('yup_required')),
// contact_types: yup.array().nullable().min(1,t('yup_select_option')).of(yup.string().test("Test contact types","Pleace select one of the available options",function(contact_type){

const postBannerAlertValidation = () => {
  return [
    param('tenant').custom((value,{req,location,path})=>{if(value in config.form){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
    body('alert_message').exists().bail().isString().withMessage('alert_message must be a string').isLength({min:4,max:1024}).withMessage('alert_message must be from 4 to 1024 characters long'),
    body('type').exists().bail().custom((value)=>{
      let supported_types = ['warning','error','info'];
      if(supported_types.includes(value)){
        return true
      }
      else{
        throw new Error(value +" is not a supported Banner Alert type. Supported types: (" + supported_types + ")");
      }
    }),
    body('priority').optional().isInt().withMessage('priority must must an integer'),
    body('active').optional().isBoolean()
  ]
}
const putBannerAlertValidation = () =>{
  return [
    param('tenant').custom((value,{req,location,path})=>{if(value in config.form){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
    param('id').exists().isInt({gt:0}).withMessage('id parametes must be a possitive integer'),
    body('alert_message').optional().isString().withMessage('alert_message must be a string').isLength({min:4,max:1024}).withMessage('alert_message must be from 4 to 1024 characters long'),
    body('type').optional().bail().custom((value)=>{
      let supported_types = ['warning','error','info'];
      if(supported_types.includes(value)){
        return true
      }
      else{
        throw new Error(value +" is not a supported Banner Alert type. Supported types: (" + supported_types + ")");
      }
    }),
    body('priority').optional().isInt().withMessage('priority must must an integer'),
    body('active').optional().isBoolean()
  ]
}

const getRecipientsBroadcastNotifications = () => {
  return [
    param('tenant').custom((value,{req,location,path})=>{if(value in config.form){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
    query('contact_types').custom((value,{req,location,path})=>{
      try{
        let contact_types = value.split(',');
        if(contact_types.length>0){
          contact_types.forEach(contact_type=>{
            if(!config.form[req.params.tenant].contact_types.includes(contact_type)){
              throw new Error(contact_type + ' is not a supported contact type, supported contact types (' + config.form[req.params.tenant].contact_types + ')');            
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
            if(!config.form[req.params.tenant].integration_environment.includes(environment)){
              throw new Error(environment + ' is not a supported environment, supported environments (' + config.form[req.params.tenant].integration_environment + ')');            
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
            if(!config.form[req.params.tenant].protocol.includes(protocol)){
              throw new Error(protocol + ' is not a supported protocol, supported protocols (' + config.form[req.params.tenant].protocol + ')');            
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
        if(!config.form[req.params.tenant].integration_environment.includes(value)){
          throw new Error(value + ' is not a supported integration_environment, supported values (' + config.form[req.params.tenant].integration_environment+ ')')
        }
        
      }
      catch(err){
        throw new Error(err);
      }
      return true;
    })
  ]
}

const broadcastNotificationsValidation = () => {
  return [
    body('name').exists().withMessage('Required Field').bail().isString().withMessage('name must be a string').isLength({min:4, max:36}).withMessage('name must be from 4 up to 36 characters'),
    body('email_body').exists().withMessage('Required Field').bail().isString().withMessage('email_body must be a string').isLength({min:4, max:4064}).withMessage('email_subject must be from 4 up to 4064 characters'),
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
    body('email_subject').exists().withMessage('Required Field').bail().isString().withMessage('email_subject must be a string').isLength({min:4, max:64}).withMessage('email_subject must be from 4 up to 64 characters'),
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
          if(!config.form[req.params.tenant].contact_types.includes(type)){
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
          if(!config.form[req.params.tenant].integration_environment.includes(environment)){
            throw new Error(environment +" is not a valid environment");
          }
        });
      }
      return true;
      })
  ]
}

const getServicesValidation = () => {
  return [
    query('integration_environment').optional({checkFalsy:true}).isString().custom((value,{req,location,path})=> { if(config.form[req.params.tenant].integration_environment.includes(value)){return true}else{return false}}).withMessage('integration_environment value not supported'),
    query('protocol').optional({checkFalsy:true}).isString().custom((value,{req,location,path})=> { if(config.form[req.params.tenant].protocol.includes(value)){return true}else{return false}}).withMessage('protocol value not supported'),
    query('protocol_id').optional({checkFalsy:true}).isString().withMessage('protocol_id must be a string').if((value)=>{return(value.constructor === stringConstructor)}).isLength({min:2, max:128}).withMessage('protocol_id must be between 2 and 128 characters'),
    param('tenant').custom((value,{req,location,path})=>{if(value in config.form){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
  ]
}



const tenantValidation = (options) => {
  return [
    param('tenant').custom((value,{req,location,path})=>{if(value in config.form){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
  ]
}
const isNotEmpty = (value) => {
  return ((typeof(value)==='number')||(value&&typeof(value)==='string')||(typeof(value)==="boolean")||(value&&Array.isArray(value)&&value.length!==0)||(value&&value.constructor === Object && Object.keys(value).length !== 0))
}
const isEmpty = (value) => {
  return !isNotEmpty(value);
}

const serviceValidationRules = (options,req) => {
  const required = (value,req,pos)=>{
    if(options.optional){
      if(isEmpty(value)){
    
        req.body[pos].outdated = true;
      }
      return true
    }
    else{
      return isNotEmpty(value)
    }
  }

  const requiredOidc = (value,req,pos) => {
      if(options.optional||req.body[pos].protocol!=='oidc'){
        if(isEmpty(value) && req.body[pos].protocol==='oidc'){
          req.body[pos].outdated = true;
        }
      return true
    }
    else{
      return isNotEmpty(value) &&(req.body[pos].protocol==='oidc');
      }
  }
  const optionalError = (error,req,pos) => {
    if(options.optional){      
      req.body[pos].outdated = true;
    }
    else{
      throw new Error(error);
    }
  }

  const requiredSaml = (value,req,pos) => {
    if(options.optional||req.body[pos].protocol!=='saml'){
      if(isEmpty(value)&& req.body[pos].protocol==='saml'){
        req.body[pos].outdated = true;
      }
      return true;
    }
    else{
      return isNotEmpty(value)&&(req.body[pos].protocol==='saml');
    }
  }
  const requiredProduction = (value,env,req,pos) =>{
    let error = false;

    if(env==="production"&&isEmpty(value)){
      if(options.optional){
        req.body[pos].outdated = true;
        error = false;
      }else{
        error = true;
      }
    }

    return !error;
  }

  const sanitizeInteger = (value) =>{
    if(isEmpty(value)||(typeof(value)!=='number'&&typeof(parseInt(value))!=='number')){
      return null;    
    }else{
      return parseInt(value);
    }
  }





  const checkRedirectUri = (value,env)=> {
    if(env==="production"){
      return value.match(reg.regUrl) || value.match(reg.regLocalhostUrl)
    }
  }

    return [
      body().isArray({min:1}).withMessage('Body must be an array containing at least one service'),
      body('*.tenant').custom((value,{req,location,path})=>{if(options.tenant_param||req.body[path.match(/\[(.*?)\]/)[1]].tenant in config.form){return true}else{return false}}).withMessage('Invalid Tenant'),
      body('*.service_name').custom((value,{req,location,path})=>{return required(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service name missing').if((value)=> {return value}).isString().withMessage('Service name must be a string').isLength({min:2, max:256}).withMessage('Service name must be from 2 up to 256 characters'),
      body('*.country').custom((value,{req,location,path})=>{
        return required(value,req,path.match(/\[(.*?)\]/)[1])
      }).withMessage('Country code missing').
      customSanitizer(value => {
        if(value){
          return value.toLowerCase();
        }else{
          return value;
        }
      }).
      custom((country) => {
        if(!country||countryCodes.includes(country)){
          return true
        }else{
          return false
        }
      }).withMessage('Invalid Country Code'),
      body('*.service_description').custom((value,{req,location,path})=>{return required(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service Description missing').if((value)=> {return value}).isString().withMessage('Service Description must be a string').isLength({min:1}).withMessage("Service description can't be empty"),
      body('*.logo_uri').optional({checkFalsy:true}).isString().withMessage('Service Logo must be a string').custom((value)=> value.match(reg.regUrl)).withMessage('Service Logo must be a secure url https://').isLength({max:256}).withMessage("Service logo cant exceed character limit (6000)"),
      body('*.policy_uri').custom((value,{req,location,path})=>{return requiredProduction(value,req.body[path.match(/\[(.*?)\]/)[1]].integration_environment,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service Policy Uri missing').if((value)=> {return value}).isString().withMessage('Service Policy Uri must be a string').custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Service Policy Uri must be a url'),
      body('*.contacts').custom((value,{req,location,path})=>{return required(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service Contacts missing').if((value)=> {
        return value&&(Array.isArray(value)&&value.length!==0)
      }).isArray({min:1}).withMessage('Service Contacts must be an array').custom((value,{req,location,path})=> {
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let pos = path.match(/\[(.*?)\]/)[1];
        let success = true;
        try{
          value.map((contact,index)=>{
            if(contact.email&&!contact.email.toLowerCase().match(reg.regEmail)||!config.form[tenant].contact_types.includes(contact.type)){
              throw new Error("Invalid contact format");
            }
          }); 
          config.form[tenant].contact_requirements.forEach((requirement,index)=>{
            let type_array =requirement.type.split(" ");
            let requirement_met = false; 
            value.forEach(contact=>{              
              if(type_array.includes(contact.type)){
                requirement_met = true;
              }
            })
            if(!requirement_met){
              success=false;
            }
          });
        }
        catch(err){
          if(Array.isArray(value)){
            success = false
          }
          else{
            success = true
          }
        }
        if(!success){          
          optionalError("Contact type missing",req,pos);
          return true;
        }else{
          return true;
        }
          }),
      body('*.protocol').exists({checkFalsy:true}).withMessage('Protocol missing').if(value=>{return value}).custom((value,{req,location,path})=> {
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        if(config.form[tenant].protocol.includes(value)){return true}else{return false}}).withMessage('Invalid Prorocol value'),
      body('*.client_id').if((value,{req,location,path})=>{
        let skip;
        if(options.null_client_id&&!value){
          skip = true;
        }
        else{
            skip = !(req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc')
        }
        return !skip
        }).exists({checkFalsy:true}).withMessage('client_id is missing').if(value=>{return value}).isString().withMessage('client_id must be a string').if((value)=>{return(value.constructor === stringConstructor)}).isLength({min:2, max:128}).withMessage('client_id must be between 2 and 128 characters').if(()=>{return options.check_available}).custom((value,{req,location,path})=> {
          let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
          return db.service_details_protocol.checkClientId(value,0,0,tenant,req.body[path.match(/\[(.*?)\]/)[1]].integration_environment).then(available=> {
            if(!available){
              return Promise.reject('Not available ('+ value +')');
            }
            else{
              return Promise.resolve();
            }
          });
      }),
      body('*.redirect_uris').custom((value,{req,location,path})=>{
        let pos = path.match(/\[(.*?)\]/)[1];
        let grant_types_bool;
        if(Array.isArray(req.body[pos].grant_types)){
          grant_types_bool = req.body[pos].grant_types.includes("implicit")||req.body[pos].grant_types.includes("authorization_code")
        }
        else{
          grant_types_bool = false;
        }
        if(req.body[pos].protocol==='oidc'&&grant_types_bool){
          // required
          if(!value||value.length===0){
            if(options.optional){

              req.body[pos].outdated = true;
              return true
            }
            else{
              return false
            }
          }
          else{
            return true
          }

        }
        else{
          // not required
          return true
        }
      }).withMessage('Service redirect_uri missing').if((value,{req,location,path})=> {
        let pos = path.match(/\[(.*?)\]/)[1];
        return isNotEmpty(value)&&req.body[pos].protocol==='oidc'
      }).custom((value,{req,location,path})=> {
        let pos = path.match(/\[(.*?)\]/)[1];
        try{
          if(Array.isArray(value)&&value.length>0){
            value.map((item,index)=>{
              if(req.body[pos].integration_environment==="production"){

                if(!(item.match(reg.regLocalhostUrl)||item.match(reg.regUrl))){
                  //reuse_refresh_token(item);
                  throw new Error("Invalid redirect url, it must be a secure or localhost url");
                }
              }
              else{
                if(!(item.match(reg.regLocalhostUrl)||item.match(reg.regSimpleUrl))) {
                  throw new Error("Invalid redirect url (" + item + "), it must be a url starting with http(s):// at position ["+index+"]");
                }
              }
            });
          }
          else{
            throw new Error("Service redirect_uri must be an array");
          }
          return true;
        }
        catch(err){
          throw new Error(err);
        }
      }),
      body('*.scope').custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service redirect_uri missing').if((value,{req,location,path})=> {return value&&value.length>0&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).isArray({min:1}).withMessage('Must be an array').custom((value,success=true)=> {
        try{
          value.map((item,index)=>{if(!item.match(reg.regScope)){
            reuse_refresh_token('Invalid Scope Value')
            reuse_refresh_token(item);
            success=false}});
        }
        catch(err){
          if(Array.isArray(value)){
            success = false
          }
          else{
            success = true
          }
        }
        return success }).withMessage('Invalid Scope value'),
      body('*.grant_types').custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service grant_types missing').if((value,{req,location,path})=> {return value&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).isArray({min:1}).withMessage('grant_types must be an array').custom((value,{req,location,path})=> {
        let success=true;
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        try{
          value.map((item,index)=>{if(!config.form[tenant].grant_types.includes(item)){
            //reuse_refresh_token(item);
            success=false}});
        }
        catch(err){
          if(Array.isArray(value)){
            success = false
          }
          else{
            success = true
          }
        }
        return success }).withMessage('Invalid grant_type value'),
      body('*.jwks_uri').customSanitizer((value,{req,location,path})=>{
          if(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method==="private_key_jwt"){
            return value
          }
          else{
            return null
          }
        }).if((value,{req,location,path})=>{return req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method==="private_key_jwt"}).
        custom((value,{req,location,path}) => {
          if(req.body[path.match(/\[(.*?)\]/)[1]].jwks&&value){
            throw new Error("Invalid private key option, only one of the following values should exist ['jwks','jwks_uri']");
          }
          else if(!(req.body[path.match(/\[(.*?)\]/)[1]].jwks||value)){
            throw new Error("Invalid private key option, one of the following values should exist ['jwks','jwks_uri']");
          }else if (value&&!value.match(reg.regSimpleUrl)){
            throw new Error("Private key uri must be a valid url");
          }
          return true
        }),
      body('*.jwks').customSanitizer((value,{req,location,path})=>{
        if(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method==="private_key_jwt"){
          return value
        }
        else{
          return null
        }
        }).if((value,{req,location,path})=>{
          return req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method==="private_key_jwt"&&!req.body[path.match(/\[(.*?)\]/)[1]].jwks_uri&&value}).
          custom((value)=>{
            try{
              if(value.constructor === stringConstructor){
                value = JSON.parse(value);
              }
              if(value&&value.keys&&typeof(value.keys)==='object'&&Object.keys(value).length===1){
                return true
              }
              else{
                return false
              }
            }
            catch(err){
              return false
            }
          }).withMessage('Invalid Schema for private key'),
      body('*.token_endpoint_auth_method').custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service token_endpoint_auth_method missing').if((value,{req,location,path})=> {return value&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).custom((value,{req,location,path})=>{
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        if(!value||config.form[tenant].token_endpoint_auth_method.includes(value)){
          return true;
        }else{
          return false;
        }}).withMessage('Invalid token_endpoint_auth_method Method'),
      body('*.token_endpoint_auth_signing_alg').customSanitizer((value,{req,location,path}) => {
        if(!['private_key_jwt','client_secret_jwt'].includes(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method)){
          return '';}
          else{return value}
        }).if((value,{req,location,path})=>{
          return (['private_key_jwt','client_secret_jwt'].includes(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method))}).custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Service token_endpoint_auth_method missing').if((value,{req,location,path})=> {return isNotEmpty(value)&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).
          custom((value,{req,location,path})=>{
            return config.form[req.params.tenant].token_endpoint_auth_signing_alg.includes(value)}).
            withMessage('Invalid Token Endpoint Signing Algorithm'),
      body('*.id_token_timeout_seconds').customSanitizer(value => {
        return sanitizeInteger(value);
        }).custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('id_token_timeout_seconds missing').if((value,{req,location,path})=> {return isNotEmpty(value)&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).custom((value,{req,location,path})=> {
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let max = config.form[tenant].id_token_timeout_seconds;
        if(isEmpty(value)||(value<=max&&value>=1)){return true}else{
          throw new Error("id_token_timeout_seconds must be an integer in specified range [1-"+ max +"]")
        }}),
      body('*.access_token_validity_seconds').customSanitizer(value => {
        return sanitizeInteger(value);
        }).custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('access_token_validity_seconds missing').if((value,{req,location,path})=> {return isNotEmpty(value)&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).custom((value,{req,location,path})=> {
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let max = config.form[tenant].access_token_validity_seconds;
        if(isNotEmpty(value)&&value<=max&&value>=1){return true}else{
          throw new Error("access_token_timeout_seconds must be an integer in specified range [1-"+ max +"]")
        }}),
      body('*.refresh_token_validity_seconds').customSanitizer((value,{req,location,path}) => {
        let pos = path.match(/\[(.*?)\]/)[1]; 
          return sanitizeInteger(value);
        }).custom((value,{req,location,path})=> {
          let pos = path.match(/\[(.*?)\]/)[1];
          
          if(isEmpty(value)&&req.body[pos].scope&&req.body[pos].scope.includes('offline_access')){
            if(options.optional){
              req.body[pos].outdated = true;
              return true
            }
            else{
              return false
            }
          }
          else{
            return true
          }
        }).withMessage("Refresh Token Validity Seconds is required when 'offline_access' is included in the scopes").
        if((value,{req,location,path})=> {return isNotEmpty(value);}).
        custom((value,{req,location,path})=> {
          if(isEmpty(value)){
            return true;
          }
          let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
          let max = config.form[tenant].refresh_token_validity_seconds;
          if(isNotEmpty(value)&&value<=max&&value>=1){return true}else{
            throw new Error("Refresh Token Validity Seconds must be an integer in specified range [1-"+ max +"]")
          }
        }),
      body('*.device_code_validity_seconds').customSanitizer((value,{req,location,path}) => {
        let pos = path.match(/\[(.*?)\]/)[1];
          return sanitizeInteger(value);
      }).
      custom((value,{req,location,path})=> {
        let pos = path.match(/\[(.*?)\]/)[1];
        if(isEmpty(value)&&req.body[pos].protocol==='oidc'&&req.body[pos].grant_types&&req.body[pos].grant_types.includes('urn:ietf:params:oauth:grant-type:device_code')){
          if(options.optional){
            req.body[pos].outdated = true;
            return true
          }else{
            throw new Error("Device Code Validity Seconds is required when 'urn:ietf:params:oauth:grant-type:device_code' is included in the grant_types")
          }
        }
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let max = config.form[tenant].device_code_validity_seconds;
        
        if(isEmpty(value)){
          return true;
        }else if((isNotEmpty(value)&&value<=max&&value>=0)||(req.body[pos].protocol!=='oidc'||isEmpty(req.body[pos].grant_types)||!req.body[pos].grant_types.includes('urn:ietf:params:oauth:grant-type:device_code'))){
          return true}else{
          throw new Error("Device Code Validity Seconds must be an integer in specified range [0-"+ max +"]")
        }
        
        }).withMessage('Must be an integer in specified range'),
      body('*.code_challenge_method').optional({checkFalsy:true}).isString().withMessage('Device Code must be a string').custom((value)=> {
        try{
          return value.match(reg.regCodeChalMeth)
        }
        catch(err){
          return true
        }
      }).withMessage('Device Code invalid value'),
      body('*.allow_introspection').customSanitizer(value => {
        if((typeof(value)!=="boolean")){
          return false;
        }else{
          return value;
        }
      }).custom((value,{req,location,path})=>{return requiredOidc(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Allow introspection mising').if((value,{req,location,path})=> {return value&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).custom((value)=> typeof(value)==='boolean').withMessage('Allow introspection must be a boolean').bail(),
      body('*.generate_client_secret').optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('Generate client secret must be a boolean'),
      body('*.reuse_refresh_token').customSanitizer(value => {
        if((typeof(value)!=="boolean")){
          return false;
        }else{
          return value;
        }
      }).custom((value)=> typeof(value)==='boolean').withMessage('Reuse refresh tokens must be a boolean'),
      body('*.integration_environment').exists({checkFalsy:true}).withMessage('Integration Environment missing').if(value=>{return value}).custom((value,{req,location,path})=> {
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        if(config.form[tenant].integration_environment.includes(value)){return true}else{return false}}).withMessage('Invalid Integration Environment'),
      body('*.clear_access_tokens_on_refresh').customSanitizer(value => {
        if((typeof(value)!=="boolean")){
          return false;
        }else{
          return value;
        }
      }).custom((value)=> typeof(value)==='boolean').withMessage('Clear access tokens on refresh must be a boolean').bail(),
      body('*.client_secret').customSanitizer((value,{req,location,path})=>{
        if(options.sanitize&&req.body[path.match(/\[(.*?)\]/)[1]].protocol!=='oidc'||['none',null,'private_key_jwt'].includes(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method)){
          return null;
        }else{
          return value;
        }
      }).if((value,{req,location,path})=>{return ((value||!req.body[path.match(/\[(.*?)\]/)[1]].generate_client_secret)&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'&&["client_secret_basic","client_secret_post","client_secret_jwt"].includes(req.body[path.match(/\[(.*?)\]/)[1]].token_endpoint_auth_method))}).exists({checkFalsy:true}).withMessage('Client secret is missing').if((value)=>{return value}).isString().withMessage('Client Secret must be a string').isLength({min:4,max:256}).withMessage('Out of range'),
      body('*.entity_id').custom((value,{req,location,path})=>{return requiredSaml(value,req,path.match(/\[(.*?)\]/)[1])}).withMessage('Entity id mising').if((value,{req,location,path})=> {return value&&req.body[path.match(/\[(.*?)\]/)[1]].protocol==='saml'}).isString().withMessage('Entity id must be a string').custom((value)=> {
        try{
          if(value.constructor === stringConstructor){
            if(value.length<4||value.length>256){
              throw new Error('Entity id is not in specified character length range (4-256)')
            }
          }
          return !value||value.match(reg.regSimpleUrl)
        }
        catch(err){
          return true
        }
      }).withMessage('Entity id must be a url'),
      body('*.metadata_url').if((value,{req,location,path})=>{return req.body[path.match(/\[(.*?)\]/)[1]].protocol==='saml'}).exists({checkFalsy:true}).withMessage('Metadata url missing').if((value)=>{ return value}).isString().withMessage('Metadata url must be a string').if((value)=>{return(value.constructor === stringConstructor)}).custom((value)=> {return value.match(reg.regSimpleUrl)}).withMessage('Metadata url must be a url').if(()=>{return options.check_available}).custom((value,{req,location,path})=> {
        return db.service_details_protocol.checkClientId(value,0,0,req.params.tenant,req.body[path.match(/\[(.*?)\]/)[1]].integration_environment).then(available=> {
          if(!available){
            return Promise.reject('Metadata url is not available');
          }
          else{
            return Promise.resolve();
          }
        });
      }),
      body('*.external_id').optional({checkFalsy:true}).custom((value)=>{if(parseInt(value)){return true}else{return false}}).withMessage('External id must be an integer'),
      body('*.website_url').optional({checkFalsy:true}).isString().withMessage('Website Url must be a string').custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Website Url must be a valid url'),
      body('*.aup_uri').custom((value,{req,location,path})=>{
        let pos = path.match(/\[(.*?)\]/)[1];
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let integration_environment = req.body[path.match(/\[(.*?)\]/)[1]].integration_environment;
        let aup_uri_config = config.form[tenant].extra_fields.aup_uri;
        if(aup_uri_config){
          if(isNotEmpty(value)){
            if(reg.regSimpleUrl.test(value)){
              return true
            }
            else{
              throw new Error("aup_uri must be a secure url");
            }
          }
          else if (aup_uri_config.required.includes(integration_environment)){
            optionalError("aup_uri is missing",req,pos);
            return true;
            //throw new Error();
          }
          else{
            return true
          }          
        }
        else{
          if(isEmpty(value)){
            return true;
          }
          else{
            throw new Error("aup_uri value is not supported for this tenant");
          }
        }
      }),
      body('*.service_coc').custom((value,{req,location,path})=>{
        let pos = path.match(/\[(.*?)\]/)[1];
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let integration_environment = req.body[path.match(/\[(.*?)\]/)[1]].integration_environment;
        let extra_fields = config.form[tenant].extra_fields;
        // Iterrate through extra fields for code of condact fields
        let error = false; 
        for(const extra_field in extra_fields){
          // If coc field is required 
          if(extra_fields[extra_field].tag==='coc'&&extra_fields[extra_field].required.includes(integration_environment)){
            if(value&& !(value[extra_field]==='true'||value[extra_field]===true)){
              optionalError(extra_field+ " field should be enabled",req,pos);
            }
          }
        }
        delete req.body[path.match(/\[(.*?)\]/)[1]].service_coc;
        return true;
      }),
      body('*.organization_id').customSanitizer((value,{req,location,path})=>{
        let pos = path.match(/\[(.*?)\]/)[1];
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let integration_environment = req.body[path.match(/\[(.*?)\]/)[1]].integration_environment;
        let extra_fields = config.form[tenant].extra_fields;

        if(!extra_fields.organization.active.includes(integration_environment)){
          return null;
        }
        else{
          return value;
        }
      }).custom((value,{req,location,path})=>{
        let pos = path.match(/\[(.*?)\]/)[1];
        let tenant = options.tenant_param?req.params.tenant:req.body[path.match(/\[(.*?)\]/)[1]].tenant;
        let integration_environment = req.body[path.match(/\[(.*?)\]/)[1]].integration_environment;
        let extra_fields = config.form[tenant].extra_fields;
        if(!extra_fields.organization.required.includes(integration_environment)){
          return true;
        }
        else{
          if(isEmpty(value)){
            optionalError("organization_id is missing",req,pos);
          }
          else{
            if(typeof(value)==='number'||typeof(parseInt(value))==='number'){
              return true;
            }
            else{
              throw new Error("organization_id must be an integer");
            }
          }

        }
      })
        
        
    ]


}
//
//body('service_id').if*body('type'==='edit'||)



const petitionValidationRules = () => {
  let tenant;
  return [
    body('service_id').if(body('type').custom((value)=>{return (value==='edit'||values==='delete')})).exists().withMessage('Required Field').bail().custom((value)=>{if(parseInt(value)){return true}else{return false}}).bail(),
    body('type').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=>{if(['edit','create','delete'].includes(value)){return true}else{return false}}).bail()
  ]
}

const formatPetition = (req,res,next) => {
  req.body = [req.body];
  if(req.body[0].type==='delete'){
    req.skipValidation = true;
  }
  next();
}
const reFormatPetition = (req,res,next) => {
  req.body = req.body[0];
  next();
}

const decodeAms = (req,res,next) => {
  try{
    req.body.decoded_messages = [];
    
    req.body.messages.forEach(item=> {
      req.body.decoded_messages.push(JSON.parse(Buffer.from(item.message.data, 'base64').toString()));
    });
    console.log(req.body.decoded_messages);
    next();
  }
  catch(err){
    customLogger(req,res,'warn','Failed decoding messages');
    res.status(422).send(err);
  }
}

const changeContacts = (req,res,next) => {
  let contacts = [
    {
      email:"koza-sparrow@hotmail.com",
      type:"technical"
    },
    {
      email:"andreaskoza@admin.grnet.gr",
      type:"technical"
    }
  ]
  try{
    if(Array.isArray(req.body)){
      req.body.forEach((item,index)=>{
        req.body[index].contacts = contacts;
      });
      next();
    }
    else{
      console.log('Invalid data format');
      next('Invalid body format');
    }
  }
  catch(err){
    next(err);
  }
}
const validateInternal = (req,res,next) =>{
  const errors = validationResult(req);
  console.log(errors);
  if(!errors.isEmpty()){
    errors.errors.forEach((error,index)=>{
      var matches = error.param.match(/\[(.*?)\]/);
      if(typeof(parseInt(matches[1]))=='number'){
        req.body[matches[1]].outdated = true;
      }      
    });
  }
  next();
}

const formatCocForValidation = (req,res,next) => {
  try{
    if(Array.isArray(req.body)&&req.body[0].service_name){
      // Group Code of contact properties into one property service_coc
      req.body.forEach((service,index)=>{
        if(typeof service === 'object' && service !== null){
          req.body[index].service_coc = {};
          let tenant = req.params.tenant?req.params.tenant:service.tenant;
          let extra_fields = config.form[tenant].extra_fields;
          for(const extra_field in extra_fields){
            if(extra_fields[extra_field].tag==='coc'){
              req.body[index].service_coc[extra_field] = req.body[index][extra_field]=== 'true'||req.body[index][extra_field]=== true?true:false;
            }
          } 
        }
      })
    }
    return next();
  }
  catch(err){
      console.log(err);
      return res.status(422).send("Invalid Format")
    }
  
}


const validate = (req, res, next) => {

  try{
    if(req.skipValidation){
      return next();
    }
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const extractedErrors = []
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
    var log ={};
    customLogger(req,res,'warn','Failed schema validation',extractedErrors);
    res.status(422).send(extractedErrors);
    return res.end();
  }catch(err){
    console.log(err);
    return res.status(422).send("Invalid Format")
  }
}

module.exports = {
  tenantValidation,
  serviceValidationRules,
  petitionValidationRules,
  validate,
  decodeAms,
  amsIngestValidation,
  postInvitationValidation,
  putAgentValidation,
  postAgentValidation,
  getServiceListValidation,
  formatPetition,
  reFormatPetition,
  getServicesValidation,
  changeContacts,
  validateInternal,
  formatCocForValidation,
  broadcastNotificationsValidation,
  postBannerAlertValidation,
  putBannerAlertValidation,
  outdatedNotificationsValidation,
  getRecipientsBroadcastNotifications
}
