const { body, validationResult } = require('express-validator');
const {reg} = require('./regex.js');
const clientValidationRules = () => {
  return [
    body('client_name').isString().isLength({min:4, max:15}).exists(),
    body('client_id').isString().isLength({min:4, max:15}).exists(),
    body('redirect_uris').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Invalid Redirect Uri value!'),
    body('logo_uri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('policy_uri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('client_description').isString().isLength({min:1}).exists(),
    body('contacts').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regEmail)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('scope').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regScope)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('grant_types').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('access_token_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('refresh_token_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('device_code_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('code_challenge_method').isString().exists().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid Code Challenge method'),
    body('allow_introspection').custom((value)=> typeof(value)==='boolean'),
    body('generate_client_secret').custom((value)=> typeof(value)==='boolean'),
    body('reuse_refresh_tokens').custom((value)=> typeof(value)==='boolean'),
    body('clear_access_tokens_on_refresh').custom((value)=> typeof(value)==='boolean'),
    body('client_secret').if((value,req)=> req.body.data.generate_client_secret=false).isString().isLength({min:4,max:15}),

  ]
}

const validate = (req, res, next) => {
  const errors = validationResult(req)
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
  validate,
}
