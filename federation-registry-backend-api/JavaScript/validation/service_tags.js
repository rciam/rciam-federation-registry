const { body,param } = require('express-validator');
var config = require('../config');

const validatePostTags = () => {
    return [
      param('tenant').custom((value,{req,location,path})=>{if(value in tenant_config){return true}else{return false}}).withMessage('Invalid Tenant in the url'),
      param('service_id').exists().isInt({gt:0}).withMessage('ID parameter must be a positive integer'),
      body('*').exists().custom((value)=>{
        if(typeof value === 'string' || value instanceof String){
          if(value.length>0 && value.length<=36){
            return true
          }
          else{
            throw new Error('Tags must be strings from 1 to 36 characters long')
          }
        }
        else{
          throw new Error('The body must be an array of string values')
        }
        return true
      })
    ]
  }
  
  
  const validateTagsBasic = () => {
    return [
      param('tenant').custom((value,{req,location,path})=>{if(value in tenant_config){return true}else{return false}}).withMessage('Invalid Tenant in the URL'),
      param('service_id').exists().isInt({gt:0}).withMessage('ID parameter must be a positive integer')
    ]
  }


  module.exports = { validateTagsBasic, validatePostTags}