var router = require('express').Router({ mergeParams: true });
const {db} = require('../db');
const {adminAuth} = require('./authentication.js'); 
const {postBannerAlertValidation,putBannerAlertValidation,validate} = require('../validator.js');


router.get('',(req,res,next)=>{
    try{

        db.banner_alerts.getAll(req.params.tenant,req.query.active==='true').then(response=>{
            if(response){
                res.status(200).send(response);
            }
            else{
                res.status(200).send([]);
            }
        })
    }
    catch(err){
      next(err);
    }
  });
router.post('',adminAuth,postBannerAlertValidation(),validate, (req,res,next)=>{
    try{
        db.banner_alerts.add(req.params.tenant,req.body).then(created_id=>{
            if(created_id){
                res.status(200).send('Succesfully created banner alert with id:' + created_id);
            }
            else{
                res.status(500).send('Unable to create Banner Alert');
            }
        })
    }
    catch(err){
        next(err);
    }
})

router.delete('/:id',adminAuth,(req,res,next)=>{
    try{
        db.banner_alerts.delete(req.params.tenant,req.params.id).then(deleted_id=>{
            if(deleted_id){
                res.status(200).send('OK');
            }
            else{
                res.status(404).send('Could not find Banner Alert based on teanant and id provided');
            }
        })
    }
    catch(err){
        next(err);
    }
})

router.put('/:id', adminAuth, putBannerAlertValidation(), validate, (req,res,next)=>{
    try{
        const found = ['type','alert_message','priority','active'].some(r=> Object.keys(req.body).includes(r));
        if (found){
            db.banner_alerts.update(req.params.id,req.params.tenant,req.body).then(response=>{
                if(response){
                    res.status(200).send('Banner Alert was updated successfully');
                }
                else{
                    res.status(404).send('Could not update Banner Alert');
                }
            });
        }
        else {
            res.status(204).send('No Banner Alert property provided in request body');
        }
    }
    catch(err){
        next(err)
    }
})



  module.exports = router;