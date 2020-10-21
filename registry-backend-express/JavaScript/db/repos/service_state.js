const sql = require('../sql').service_state;
let cs= {};

class ServiceStateRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['?id','state'],{table:'service_state'});
  }

  async add(id,state){
    return this.db.any(sql.add,{
      id:+id,
      state:state
    });
  }
  async update(id,state){
    return this.db.any(sql.update,{
      id:+id,
      state:state
    })
  }
  async deploymentUpdate(messages){
    let updateState=[];
    let updateClientId =[];
    let updateExternalId = [];
    let ids=[];
    console.log(messages);
    messages.forEach((message) => {
      // let decoded_message=(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
      let decoded_message=message;

      updateState.push({id:decoded_message.id,state:decoded_message.state});
      if(decoded_message.external_id){
        updateExternalId.push({id:decoded_message.id,external_id:decoded_message.external_id})
      }
      if(decoded_message.client_id){
        updateClientId.push({id:decoded_message.id,client_id:decoded_message.client_id});
      }
      ids.push(decoded_message.id);
    });

    return this.db.task('deploymentResults', async t => {
      for(let index=0;index<messages.length;index++){
        // let decoded_message=(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
        let decoded_message=messages[index];
        let done = await t.deployment_results.setResponse(decoded_message.id,decoded_message.agent_id);
        let deployed = await t.deployment_results.isDeploymentFinished(decoded_message.id);
      }
    });
    console.log("All done")
    console.log(updateState);
    console.log(updateExternalId);
    console.log(updateClientId);
    return {success:true};
    // return await this.db.service_state.updateMultiple(updateState).then(async res=>{
    //   if(res.success){
    //     if(updateData.length>0){
    //       return await this.db.service_details_protocol.updateExternalId(setExternalId).then(async result=>{
    //         if(result.success){
    //           return {success:true,ids:ids};
    //         }
    //         else{
    //           throw 'Could not update client_id'
    //         }
    //       })
    //     }
    //     else{
    //       return {success:true,ids:ids};
    //     }
    //   }
    // })
  }

  async updateMultiple(updateData){
    // updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:3,state:'failed'}];
    const update = this.pgp.helpers.update(updateData, cs) + ' WHERE v.id = t.id RETURNING t.id';
    //=> UPDATE "service_data" AS t SET "state"=v."state"
    //   FROM (VALUES(1,'deployed'),(2,'deployed'),(3,'failed'))
    //   AS v("id","state") WHERE v.id = t.id
    return await this.db.any(update).then((ids)=>{
      if(ids.length===updateData.length){
        return {success:true}
      }
      else{
        return {success:false,error:'Could not update state'}
      }
    }).catch(error=>{
      return {success:false,error:error}
    });
  }






}

module.exports = ServiceStateRepository;
