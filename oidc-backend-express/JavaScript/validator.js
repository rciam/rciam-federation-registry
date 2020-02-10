const { body, validationResult } = require('express-validator');
const {reg} = require('./regex.js');
var formConfig = require('./config');
const clientValidationRules = () => {
  return [
    body('client_name').isString().isLength({min:4, max:15}).exists(),
    body('client_id').isString().isLength({min:4, max:36}).exists(),
    body('redirect_uris').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Invalid Redirect Uri value!'),
    body('logo_uri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('policy_uri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('client_description').isString().isLength({min:1}).exists(),
    body('contacts').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.email.match(reg.regEmail)||!formConfig.contact_types.includes(item.type)){success=false}}); return success }).withMessage('Invalid Contacts value!'),
    body('scope').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regScope)){success=false}}); return success }).withMessage('Invalid Contacts value!'),
    body('grant_types').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('access_token_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('refresh_token_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('device_code_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('code_challenge_method').isString().exists().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid Code Challenge method'),
    body('allow_introspection').custom((value)=> typeof(value)==='boolean'),
    body('generate_client_secret').custom((value)=> typeof(value)==='boolean'),
    body('reuse_refresh_tokens').custom((value)=> typeof(value)==='boolean'),
    body('integration_environment').isString().exists().custom((value)=> {if(formConfig.integration_environment.includes(value)){return true}else{return false}}),
    body('clear_access_tokens_on_refresh').custom((value)=> typeof(value)==='boolean'),
    body('client_secret').if((value,req)=> req.body.data.generate_client_secret=false).isString().isLength({min:4,max:16}),

  ]
}
//body('redirect_uris').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Invalid Redirect Uri value!'),
//body('contacts').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.email.match(reg.regEmail)||!['admin','technical'].includes(item.type)){success=false}}); return success }).withMessage('Invalid Contacts value!'),
//body('grant_types').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid Scope value!'),

const editClientValidationRules = () => {
  return [
    body('details.client_name').optional().isString().isLength({min:4, max:15}),
    body('details.client_id').optional().isString().isLength({min:4, max:36}),
    body('add').custom((value)=> {
      if(value.client_contact){
        value.client_contact.map((item,index)=>{
          if(!item.email.match(reg.regEmail)||!formConfig.contact_types.includes(item.type)){
            console.log('add-client_contact');
            return false
          }
        })
      }
      if(value.client_grant_type){
        value.client_grant_type.map((item,index)=>{
          if(!formConfig.grant_types.includes(item)){
            console.log('add-client_grant');
            return false
          }
        })
      }
      if(value.client_redirect_uri){
        value.client_redirect_uri.map((item,index)=>{
          if(!item.match(reg.regUrl)){
            console.log('add-client_redirect');
            return false
          }
        })
      }
      if(value.client_scope){
        value.client_scope.map((item,index)=>{
          if(!item.match(reg.regScope)){
            console.log('add-client_scope');
            return false
          }
        })
      }
      return true
    }).withMessage('Invalid Add Values!'),
    body('dlt').custom((value)=> {
      if(value.client_contact){
        value.client_contact.map((item,index)=>{
          if(!item.email.match(reg.regEmail)||!formConfig.contact_types.includes(item.type)){
            console.log('dlt-client_contact');


            return false
          }
        })
      }
      if(value.client_grant_type){
        value.client_grant_type.map((item,index)=>{
          if(!formConfig.grant_types.includes(item)){
            console.log('dlt-client_grant');
            return false
          }
        })
      }
      if(value.client_redirect_uri){
        value.client_redirect_uri.map((item,index)=>{
          if(!item.match(reg.regUrl)){
            console.log('dlt-client_redirect');
            return false
          }
        })
      }
      if(value.client_scope){
        value.client_scope.map((item,index)=>{
          if(!item.match(reg.regScope)){
            console.log('dlt-client_scope');
            return false
          }
        })
      }
      return true
    }).withMessage('Invalid Add Values!'),
    body('details.logo_uri').optional().isString().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('details.policy_uri').optional().isString().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('details.client_description').optional().isString().isLength({min:1}),
    body('details.access_token_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('details.refresh_token_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('details.device_code_validity_seconds').optional().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('details.code_challenge_method').optional().isString().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid Code Challenge method'),
    body('details.allow_introspection').optional().custom((value)=> typeof(value)==='boolean'),
    body('details.generate_client_secret').optional().custom((value)=> typeof(value)==='boolean'),
    body('details.reuse_refresh_tokens').optional().custom((value)=> typeof(value)==='boolean'),
    body('details.integration_environment').optional().isString().custom((value)=> {if(formConfig.integration_environment.includes(value)){return true}else{return false}}),
    body('details.clear_access_tokens_on_refresh').optional().custom((value)=> typeof(value)==='boolean'),
    body('details.client_secret').optional().if((value,req)=> req.body.data.generate_client_secret=false).isString().isLength({min:4,max:16}),

  ]
}

const validate = (req, res, next) => {

  console.log(req.body);
  const errors = validationResult(req)
  console.log(errors);
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))

  return res.status(422).json({
    errors: extractedErrors,
  })
}

module.exports = {
  clientValidationRules,
  editClientValidationRules,
  validate,
}
