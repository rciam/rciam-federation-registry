const { body, validationResult,param,check } = require('express-validator');
const {reg} = require('./regex.js');
const customLogger = require('./loggers.js');
var config = require('./config');


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
const clientValidationRules = () => {
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
    body('grant_types').if(body('type').custom((value)=>{return value!=='delete'})).if(body('protocol').custom((value)=>{return value==='oidc'})).exists().withMessage('Required Field').bail().isArray({min:1}).withMessage('Must be an array').bail().custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid value').bail(),
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
//body('redirect_uris').isArray({min:1}).withMessage('Must be an array').custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Invalid Redirect Uri value!'),
//body('contacts').isArray({min:1}).withMessage('Must be an array').custom((value,success=true)=> {value.map((item,index)=>{if(!item.email.match(reg.regEmail)||!['admin','technical'].includes(item.type)){success=false}}); return success }).withMessage('Invalid Contacts value!'),
//body('grant_types').isArray({min:1}).withMessage('Must be an array').custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid Scope value!'),

// const editClientValidationRules = () => {
//   return [
//     body('details.client_name').optional().isString().isLength({min:4, max:36}),
//     body('details.client_id').optional().isString().isLength({min:4, max:36}),
//     body('add').custom((value)=> {
//       if(value.client_contact){
//         value.client_contact.map((item,index)=>{
//           if(!item.email.match(reg.regEmail)||!config.form.contact_types.includes(item.type)){
//             console.log('add-client_contact');
//             return false
//           }
//         })
//       }
//       if(value.client_grant_type){
//         value.client_grant_type.map((item,index)=>{
//           if(!config.form.grant_types.includes(item)){
//             console.log('add-client_grant');
//             return false
//           }
//         })
//       }
//       if(value.client_redirect_uri){
//         value.client_redirect_uri.map((item,index)=>{
//           if(!item.match(reg.regUrl)){
//             console.log('add-client_redirect');
//             return false
//           }
//         })
//       }
//       if(value.client_scope){
//         value.client_scope.map((item,index)=>{
//           if(!item.match(reg.regScope)){
//             console.log('add-client_scope');
//             return false
//           }
//         })
//       }
//       return true
//     }).withMessage('Invalid Add Values!'),
//     body('dlt').custom((value)=> {
//       if(value.client_contact){
//         value.client_contact.map((item,index)=>{
//           if(!item.email.match(reg.regEmail)||!config.form.contact_types.includes(item.type)){
//             console.log('dlt-client_contact');
//
//
//             return false
//           }
//         })
//       }
//       if(value.client_grant_type){
//         value.client_grant_type.map((item,index)=>{
//           if(!config.form.grant_types.includes(item)){
//             console.log('dlt-client_grant');
//             return false
//           }
//         })
//       }
//       if(value.client_redirect_uri){
//         value.client_redirect_uri.map((item,index)=>{
//           if(!item.match(reg.regUrl)){
//             console.log('dlt-client_redirect');
//             return false
//           }
//         })
//       }
//       if(value.client_scope){
//         value.client_scope.map((item,index)=>{
//           if(!item.match(reg.regScope)){
//             console.log('dlt-client_scope');
//             return false
//           }
//         })
//       }
//       return true
//     }).withMessage('Invalid Add Values!'),
//     body('details.logo_uri').optional().isString().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
//     body('details.policy_uri').optional().isString().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
//     body('details.client_description').optional().isString().isLength({min:1}),
//     body('details.access_token_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range'),
//     body('details.refresh_token_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range'),
//     body('details.device_code_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}).withMessage('Must be an integer in specified range'),
//     body('details.code_challenge_method').optional().isString().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid Code Challenge method'),
//     body('details.allow_introspection').optional().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean'),
//     body('details.generate_client_secret').optional().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean'),
//     body('details.reuse_refresh_tokens').optional().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean'),
//     body('details.integration_environment').optional().isString().custom((value)=> {if(config.form.integration_environment.includes(value)){return true}else{return false}}),
//     body('details.clear_access_tokens_on_refresh').optional().custom((value)=> typeof(value)==='boolean').withMessage('Must be a boolean'),
//     body('details.client_secret').optional().if((value,req)=> req.body.data.generate_client_secret=false).isString().isLength({min:4,max:16}),
//
//   ]
// }

const validate = (req, res, next) => {
  console.log(req.body);
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
  customLogger(req,res,'warn','Failed schema validation');
  res.status(422).send(extractedErrors);


  return res.end();
}

module.exports = {
  clientValidationRules,
  validate,
  postInvitationValidation,
  putAgentValidation,
  postAgentValidation
}
