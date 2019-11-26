const { body, validationResult } = require('express-validator');
const {reg} = require('./regex.js');
const clientValidationRules = () => {
  return [
    body('clientName').isString().isLength({min:4, max:15}).exists(),
    body('clientId').isString().isLength({min:4, max:15}).exists(),
    body('redirectUris').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regUrl)){success=false}}); return success }).withMessage('Invalid Redirect Uri value!'),
    body('logoUri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('policyUri').isString().exists().custom((value)=> value.match(reg.regSimpleUrl)).withMessage('Invalid logo Uri value!'),
    body('clientDescription').isString().isLength({min:1}).exists(),
    body('contacts').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regEmail)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('scope').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!item.match(reg.regScope)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('grantTypes').isArray({min:1}).custom((value,success=true)=> {value.map((item,index)=>{if(!['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(item)){success=false}}); return success }).withMessage('Invalid Scope value!'),
    body('accessTokenValiditySeconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('refreshTokenValiditySeconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('device_code_validity_seconds').exists().custom((value)=> {if(parseInt(value)&&parseInt(value)<34128000&&parseInt(value)>0){return true}else{return false}}),
    body('code_challenge_method').isString().exists().custom((value)=> value.match(reg.regCodeChalMeth)).withMessage('Invalid Code Challenge method'),
    body('allowIntrospection').custom((value)=> typeof(value)==='boolean'),
    body('generateClientSecret').custom((value)=> typeof(value)==='boolean'),
    body('reuse_refresh_tokens').custom((value)=> typeof(value)==='boolean'),
    body('clear_access_tokens_on_refresh').custom((value)=> typeof(value)==='boolean'),
    body('clientSecret').if((value,req)=> req.body.generateClientSecret=false).isString().isLength({min:4,max:15}),

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
