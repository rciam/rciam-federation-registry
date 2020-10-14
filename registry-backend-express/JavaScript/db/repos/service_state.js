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
    let updateData =[];
    let ids=[];
    messages.forEach((message) => {
      let decoded_message=(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
      updateState.push({id:decoded_message.id,state:decoded_message.state});
      if(decoded_message.external_id){
        updateDate.push({id:decoded_message.id,client_id:decoded_message.external_id})
      }
      ids.push(decoded_message.id);
    });
    return await this.db.service_state.updateMultiple(updateState).then(async res=>{
      if(res.success){
        if(updateDate.length>0){
          return await this.db.service_details_protocol.updateExternalId(setExternalId).then(async result=>{
            if(result.success){
              return {success:true,ids:ids};
            }
            else{
              throw 'Could not update client_id'
            }
          })
        }
        else{
          return {success:true,ids:ids};
        }
      }
    })
  }

  async updateMultiple(updateData){
    // updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:3,state:'failed'}];
    const update = this.pgp.helpers.update(updateData, cs) + ' WHERE v.id = t.id RETURNING t.id';
    //=> UPDATE "service_data" AS t SET "state"=v."state"
    //   FROM (VALUES(1,'deployed'),(2,'deployed'),(3,'failed'))
    //   AS v("id","state") WHERE v.id = t.id
    return this.db.any(update).then((ids)=>{
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
