const sql = require('../sql').service;
const {calcDiff} = require('../../functions/helpers.js');
const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ServiceRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;

      // set-up all ColumnSet objects, if needed:

  }


  async get(id,tenant){
      return this.db.oneOrNone(sql.getService,{
          id:+id,
          tenant:tenant
        }).then(result => {
          if(result){
            let data = {};
            result.json.generate_client_secret = false;
            data.service_data = result.json;
            return data
          }
          else {
            return null;
          }
        });
  }



  async add(service,requester,group_id) {
      try{
        let service_id;
        return this.db.tx('add-service',async t =>{
          let queries = [];

          service.group_id = group_id;
          return await t.service_details.add(service,requester).then(async result=>{
            if(result){
              service_id = result.id;
              queries.push(t.service_details_protocol.add('service',service,result.id));
              queries.push(t.service_contacts.add('service',service.contacts,result.id));
              queries.push(t.service_state.add(result.id,'pending','create'));
              if(service.protocol==='oidc'){
                queries.push(t.service_multi_valued.add('service','oidc_grant_types',service.grant_types,result.id));
                queries.push(t.service_multi_valued.add('service','oidc_scopes',service.scope,result.id));
                queries.push(t.service_multi_valued.add('service','oidc_redirect_uris',service.redirect_uris,result.id));
              }
              return t.batch(queries);
            }
          });

        }).then(data => {
          return service_id;
        }).catch(stuff=>{
          throw 'error'
        });
      }
      catch(error){
        throw 'error'
      }
    }

  async update(newState,targetId,tenant){
    try{
      return this.db.tx('update-service',async t =>{
        let queries = [];
        return t.service.get(targetId,tenant).then(async oldState=>{
          if(oldState){
            let edits = calcDiff(oldState.service_data,newState);
            if(Object.keys(edits.details).length !== 0){
               queries.push(t.service_details.update(edits.details,targetId));
               queries.push(t.service_details_protocol.update('service',edits.details,targetId));
            }
            queries.push(t.service_state.update(targetId,'pending','edit'));
            for (var key in edits.add){
              if(key==='contacts') {
                queries.push(t.service_contacts.add('service',edits.add[key],targetId));
              }
              else {
                queries.push(t.service_multi_valued.add('service',key,edits.add[key],targetId));
              }
            }
            for (var key in edits.dlt){
              if(key==='contacts'){queries.push(t.service_contacts.delete_one_or_many('service',edits.dlt[key],targetId));}
              else {queries.push(t.service_multi_valued.delete_one_or_many('service',key,edits.dlt[key],targetId));}
            }
            var result = await t.batch(queries);
            if(result){
              return {success:true};
            }
          }
        }).catch(err =>{
          return {success:false,error:err}
        });
      });
    }
    catch(err){
      return {success:false,error:err}
    }
  }

  async getPending(){
    return this.db.any(sql.getPending).then(services=>{
      if(services){
        return services;
      }
      else{
        return null;
      }
    });
  }
}






//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = ServiceRepository;
