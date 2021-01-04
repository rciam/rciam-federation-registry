const { body, validationResult,param,check } = require('express-validator');
const {reg} = require('./regex.js');
const customLogger = require('./loggers.js');
var config = require('./config');
const {db} = require('./db');

const amsIngestValidation = () => {
  return [
    body('decoded_messages').exists().withMessage('No agents found').bail().isArray({min:1}).withMessage('No agents found').bail().toArray(),
    body('decoded_messages.*.id').exists().withMessage('Required Field').bail().isInt({gt:0}).withMessage('Id must be a positive integer'),
    body('decoded_messages.*.agent_id').exists().withMessage('Required Field').bail().isInt({gt:0}).withMessage('Agent id must be a positive integer'),
    body('decoded_messages.*.external_id').optional({checkFalsy:true}).isInt({gt:0}).withMessage('External id must be a positive integer'),
    body('decoded_messages.*.client_id').optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().isLength({min:4, max:36}).bail()
  ]
}

const postInvitationValidation = () => {
  return[
    body('email').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value,success=true)=> {if(!value.match(reg.regEmail)){success=false} return success }).withMessage('Must be an email'),
    body('group_manager').exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean')
  ]
}

const putAgentValidation = () => {
  return [
    body('type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.type.includes(value)){return true}else{return false}}).bail(),
    body('entity_type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_type.includes(value)){return true}else{return false}}).bail(),
    body('entity_protocol').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_protocol.includes(value)){return true}else{return false}}).bail(),
    body('hostname').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail()
  ]
}

const postAgentValidation = () => {
  return [
    body('agents').exists().withMessage('No agents found').bail().isArray({min:1}).withMessage('No agents found').bail().toArray(),
    body('agents.*.type').exists().withMessage('Required Field').custom((value)=>{ if(config.agent.type.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.entity_type').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_type.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.entity_protocol').exists().withMessage('Required Field').bail().custom((value)=>{if(config.agent.entity_protocol.includes(value)){return true}else{return false}}).bail(),
    body('agents.*.hostname').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail()
  ]
}
//body('service_id').if*body('type'==='edit'||)
const serviceValidationRules = () => {
  return [
    body().isArray({min:1}).withMessage('Body must be an array containing at least one service'),
    body('*.external_id').optional({checkFalsy:true}).exists().withMessage('Required Field').bail().custom((value)=>{if(parseInt(value)){return true}else{return false}}).bail(),
    body('*.protocol').exists().withMessage('Required Field').bail().custom((value)=> {if(['oidc','saml'].includes(value)){return true}else{return false}}).withMessage('Invalid value'),
    body('*.service_name').optional({checkFalsy:true}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().isLength({min:4, max:36}).bail(),
    body('*.client_id').if((value,{req,location,path})=>{return req.body[path.match(/\[(.*?)\]/)[1]].protocol==='oidc'}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().isLength({min:4, max:36}).withMessage('Must be between 4 and 36 characters').bail().custom((value,{req,location,path})=> {
      return db.service_details_protocol.checkClientId(value,0,0,req.params.name,req.body[path.match(/\[(.*?)\]/)[1]].integration_environment).then(available=> {
        if(!available){
          return Promise.reject('Not available');
        }
        else{
          return Promise.resolve();
        }
      });
    }),
    body('*.redirect_uris').optional({checkFalsy:true}).isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Must be secure url').bail(),
    body('*.logo_uri').optional({checkFalsy:true}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('*.policy_uri').optional({checkFalsy:true}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('*.service_description').optional({checkFalsy:true}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().isLength({min:1}).bail(),
    body('*.contacts').optional({checkFalsy:true}).if(param('name').custom((value)=> {tenant=value; return true;})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(item.email&&!item.email.match(reg.regEmail)||!config.form[tenant].contact_types.includes(item.type)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('*.scope').optional({checkFalsy:true}).isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regScope)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('*.grant_types').if(param('name').custom((value)=> {tenant=value; return true;})).optional({checkFalsy:true}).isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!config.form[tenant].grant_types.includes(item)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('*.id_token_timeout_seconds').optional({checkFalsy:true}).custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('*.access_token_validity_seconds').optional({checkFalsy:true}).custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('*.refresh_token_validity_seconds').optional({checkFalsy:true}).custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('*.device_code_validity_seconds').optional({checkFalsy:true}).custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('*.code_challenge_method').optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid value').bail(),
    body('*.allow_introspection').optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('*.generate_client_secret').optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('*.reuse_refresh_tokens').optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('*.integration_environment').if(param('name').custom((value)=> {tenant=value; return true;})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> {if(config.form[tenant].integration_environment.includes(value)){return true}else{return false}}).bail(),
    body('*.clear_access_tokens_on_refresh').optional({checkFalsy:true}).custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('*.client_secret').optional({checkFalsy:true}).if(body('protocol').custom((value)=>{return value==='oidc'})).if((value,req)=> req.body.data.generate_client_secret=false).bail().isString().withMessage('Must be a string').bail().isLength({min:4,max:16}).bail(),
    body('*.entity_id').optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().isLength({min:4, max:256}).bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('*.metadata_url').if((value,{req,location,path})=>{ return req.body[path.match(/\[(.*?)\]/)[1]].protocol==='saml'}).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail().custom((value,{req,location,path})=> {
      return db.service_details_protocol.checkClientId(value,0,0,req.params.name,req.body[path.match(/\[(.*?)\]/)[1]].integration_environment).then(available=> {
        if(!available){
          return Promise.reject('Not available');
        }
        else{
          return Promise.resolve();
        }
      });
    }),
  ]
}


const petitionValidationRules = () => {
  let tenant;
  return [
    body('service_id').if(body('type').custom((value)=>{return (value==='edit'||values==='delete')})).exists().withMessage('Required Field').bail().custom((value)=>{if(parseInt(value)){return true}else{return false}}).bail(),
    body('protocol').if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().custom((value)=> {if(['oidc','saml'].includes(value)){return true}else{return false}}).withMessage('Invalid value'),
    body('type').exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=>{if(['edit','create','delete'].includes(value)){return true}else{return false}}).bail(),
    body('service_name').if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().isLength({min:4, max:36}).bail(),
    body('client_id').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().isLength({min:4, max:36}).bail(),
    body('redirect_uris').if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Must be secure url').bail(),
    body('logo_uri').if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('policy_uri').if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('service_description').if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().isLength({min:1}).bail(),
    body('contacts').if(param('name').custom((value)=> {tenant=value; return true;})).if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(item.email&&!item.email.match(reg.regEmail)||!config.form[tenant].contact_types.includes(item.type)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('scope').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regScope)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('grant_types').if(param('name').custom((value)=> {tenant=value; return true;})).if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!config.form[tenant].grant_types.includes(item)){success=false}}); return success }).withMessage('Invalid value').bail(),
    body('id_token_timeout_seconds').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('access_token_validity_seconds').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('refresh_token_validity_seconds').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('device_code_validity_seconds').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range').bail(),
    body('code_challenge_method').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid value').bail(),
    body('allow_introspection').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('generate_client_secret').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('reuse_refresh_tokens').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('integration_environment').if(param('name').custom((value)=> {tenant=value; return true;})).if(body('type').custom((value)=>{return value!=='delete'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> {if(config.form[tenant].integration_environment.includes(value)){return true}else{return false}}).bail(),
    body('clear_access_tokens_on_refresh').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean').bail(),
    body('client_secret').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).if((value,req)=> req.body.data.generate_client_secret=false).bail().isString().withMessage('Must be a string').bail().isLength({min:4,max:16}).bail(),
    body('entity_id').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='saml'})).optional({checkFalsy:true}).isString().withMessage('Must be a string').bail().isLength({min:4, max:256}).bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
    body('metadata_url').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='saml'})).exists().withMessage('Required Field').bail().isString().withMessage('Must be a string').bail().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Must be a url').bail(),
  ]
}


const decodeAms = (req,res,next) => {
  try{
    req.body.decoded_messages = [];
    req.body.messages.forEach(item=> {

      req.body.decoded_messages.push(JSON.parse(Buffer.from(item.message.data, 'base64').toString()));
    });
    next();
  }
  catch(err){
    customLogger(req,res,'warn','Failed decoding messages');
    res.status(422).send(err);
  }
}

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if(errors.errors.length>0){
    //console.log(errors);
  }
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  var log ={};
  customLogger(req,res,'warn','Failed schema validation',extractedErrors);
  res.status(422).send(extractedErrors);
  return res.end();
}

module.exports = {
  serviceValidationRules,
  petitionValidationRules,
  validate,
  decodeAms,
  amsIngestValidation,
  postInvitationValidation,
  putAgentValidation,
  postAgentValidation
}
