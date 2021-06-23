const {sendMail} = require('../functions/helpers.js');


const findConnections = (req, res, db) => {
  db.select('*').from('connections')
    .then(items => {
      if(items.length){
        res.json(items)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const rejectPetition = (req,res,next,db) => {
  db.task('reject-petition',async t =>{
    await t.service_petition_details.review(req.params.id,req.user.sub,'reject',req.body.comment,req.params.tenant).then(async results=>{
      if (results){
        await t.user.getPetitionOwners(req.params.id).then(data=>{
          if(data){
            data.forEach(email_data=>{
              sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'rejected',tenant:req.params.tenant},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
            })
          }
        }).catch(err=>{next(err)});
        res.status(200).end();
      }
      else{
        res.status(404).send({error:"No petition found"});
      }
    }).catch(err=>{next(err);});
  })
}

const changesPetition = (req,res,next,db) => {
  db.tx('approve-with-changes-petition',async t =>{
        await t.petition.get(req.params.id,req.params.tenant).then(async petition =>{
          if(petition){
            petition.service_data.type = petition.meta_data.type;
            petition.service_data.service_id = petition.meta_data.service_id;
            petition.service_data.requester = petition.meta_data.requester;
            petition = petition.service_data;
            petition.comment = req.body.comment;
            petition.status = 'pending';
            petition.tenant = req.params.tenant;
            await t.petition.add(petition,petition.requester).then(async id=>{
              if(id){
                await t.service_petition_details.review(req.params.id,req.user.sub,'approved_with_changes',req.body.comment,req.params.tenant).then(async result=>{
                  if(result){
                    res.status(200).json({id});
                    await t.user.getPetitionOwners(req.params.id).then(data=>{
                      if(data){
                        data.forEach(email_data=>{
                          sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'approved with changes',tenant:req.params.tenant},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
                        })
                      }

                    }).catch(err=>{next(err);});
                  }
                }).catch(err=>{next(err);});
              }
            }).catch(err=>{next(err);});
          }
          else{
            res.status(404).send({error:"No petition found"});
          }
        }).catch(err=>{next(err);});
      })
}
const requestReviewPetition = (req,res,next,db) => {
  db.tx('request-review-petition',async t =>{
    await t.service_petition_details.requestReview(req.params.id,req.body.comment).then(async result=>{
      res.status(200).end();
      await t.user.getUnrestrictedReviewers(req.params.tenant).then(async users=>{
        console.log('Sending mail to managers');
        await t.service_petition_details.getServiceId(req.params.id,req.params.tenant).then(async service_id => {
          if(service_id){
            await t.service.get(service_id,req.params.tenant).then(res => {
              sendMail({subject:'Review Requested',service_name:res.service_data.service_name,tenant:req.params.tenant},'request-reviewer-notification.html',users);
            });
          }else{
            await t.petition.get(req.params.id,req.params.tenant).then(res=>{
                sendMail({subject:'Review Requested',service_name:res.service_data.service_name,tenant:req.params.tenant},'request-reviewer-notification.html',users);
            });
          }
        })
      }).catch(error=>{
        next('Could not sent email to reviewers:' + error);
      });
    }).catch(err=>{
      next(err);
    });
  })
}


const approvePetition = (req,res,next,db) => {
  db.tx('approve-petition',async t =>{
    let service_id;
    await t.petition.get(req.params.id,req.params.tenant).then(async petition =>{
      if(petition){
        petition.service_data.tenant = req.params.tenant;
        if(petition.meta_data.type==='delete'){
          service_id = petition.meta_data.service_id;
          await t.batch([
            t.service_details.delete(petition.meta_data.service_id),
            t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment,req.params.tenant)
          ]);
        }
        else if(petition.meta_data.type==='edit'){
          // Edit Service
          service_id = petition.meta_data.service_id;
          await t.batch([
            t.service.update(petition.service_data,petition.meta_data.service_id,req.params.tenant),
            t.service_petition_details.review(req.params.id,req.user.sub,'approved',req.body.comment,req.params.tenant)
          ]);
        }
        else if(petition.meta_data.type==='create'){

          await t.service.add(petition.service_data,petition.meta_data.requester,petition.meta_data.group_id).then(async id=>{
            if(id){
              service_id = id;
              await t.service_petition_details.approveCreation(req.params.id,req.user.sub,'approved',req.body.comment,id,req.params.tenant);
            }
          }).catch(err=>{
            console.log(err);
            next(err);});
        }
        res.status(200).json({service_id});
        await t.user.getPetitionOwners(req.params.id).then(data=>{
          if(data){
            data.forEach(email_data=>{
              sendMail({subject:'Service Petition Review',service_name:email_data.service_name,state:'approved',tenant:req.params.tenant},'review-notification.html',[{name:email_data.name,email:email_data.email}]);
            })
          }
        }).catch(err=>{next(err);})
      }
      else{
        res.status(404).send({error:"No petition found"});
      }
    }).catch(err=>{next(err);})
  })
}


const getOpenPetition = (req,res,next,db) =>{
  db.task('find-petition-data',async t=>{
  if(req.user.role.actions.includes('get_petition')){
    await t.petition.get(req.params.id,req.params.tenant).then(result=>{return result.service_data}).then(petition => {
       if(petition){
          res.status(200).json({petition});
       }
       else {
         res.status(404);
         customLogger(req,res,'warn','Petition not found');
         res.end();
       }
     }).catch(err=>{next(err);});
   }
   else if(req.user.role.actions.includes('get_own_petition')){
     await t.petition.getOwn(req.params.id,req.user.sub,req.params.tenant).then(result=>{return result.service_data}).then(petition => {
       if(petition){
          res.status(200).json({petition});
       }
       else {
         res.status(404);
         customLogger(req,res,'warn','Petition not found');
         res.end();
       }
     }).catch(err=>{next(err);});
   }
   else {
     res.status(401).json({err:'Requested action not authorised'})
   }
 });
}


const getPetition = (req,res,next,db) => {
  if(req.user.role.actions.includes('get_petition')){
    db.petition.getOld(req.params.id,req.user.sub,req.params.tenant).then(petition =>{
      if(petition){
        res.status(200).json({petition:petition.service_data});
      }
      else{
        return res.status(404).end();
      }
    }).catch(err=>{next(err)});
  }
  else if (req.user.role.actions.includes('get_own_petition')){
    db.petition.getOwnOld(req.params.id,req.user.sub,req.params.tenant).then(petition =>{
      if(petition){
        res.status(200).json({petition:petition.service_data});
      }
      else{
        return res.status(404).end();
      }
    }).catch(err=>{next(err)});
  }
  else{
    res.status(401).json({err:'Requested action not authorised'})
  }
}


module.exports = {
  findConnections,
  rejectPetition,
  approvePetition,
  changesPetition,
  getOpenPetition,
  getPetition,
  requestReviewPetition
}
