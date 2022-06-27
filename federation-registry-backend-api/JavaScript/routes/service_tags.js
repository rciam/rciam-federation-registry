var router = require('express').Router({ mergeParams: true });
const {db} = require('../db');
const {authenticate,actionAuthorization} = require('./authentication.js'); 
const {validate} = require('../validator.js');
const {validatePostTags,validateTagsBasic} = require('../validation/service_tags.js');



router.get('',authenticate,actionAuthorization('manage_tags'), (req,res,next)=>{
    try{
        db.service_tags.getAll(req.params.tenant,req.query.tag).then(async tags=>{
          if(tags){
            res.status(200).send(tags);
            }
          else{
            res.status(200).send([]);
          }
        });
      
    }
    catch(err){
      next(err);
    }
  });

router.post('/services/:service_id',authenticate,actionAuthorization('manage_tags'),validatePostTags(),validate,(req,res,next)=>{
  try{
    if(Array.isArray(req.body)&&req.body.length>0){
      db.service_tags.addTags(req.params.tenant,req.params.service_id,req.body).then(response=>{
        if(response){
          res.status(200).end();
        }
        else {
          res.status(409).end()
        }
      })
    }
    else{
      res.status(422).send('Invalid body format')
    }
  }
  catch(err){
    next(err)
  }
})

router.get('/services/:service_id',authenticate,actionAuthorization('manage_tags'),validateTagsBasic(),validate,(req,res,next)=>{
  try{
    db.service_tags.getByServiceId(req.params.tenant,req.params.service_id).then(response=>{
      if(response){
        res.status(200).send(response);
      }
      else {
        res.status(409).end()
      }
    })
  }
  catch(err){
    next(err)
  }
})



router.delete('/services/:service_id',authenticate,actionAuthorization('manage_tags'),validateTagsBasic(),validate,(req,res,next)=>{
  try{
    db.service_tags.deleteTags(req.params.tenant,req.params.service_id,req.body).then(response=>{
      if(response){
        res.status(200).end();
      }
      else{
        res.status(409).end();
      }
    })
  }
  catch(err){
    res.status(500).end()
  }
})






  module.exports = router;