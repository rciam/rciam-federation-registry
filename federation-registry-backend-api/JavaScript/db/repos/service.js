const sql = require('../sql').service;
const {calcDiff,extractCoc} = require('../../functions/helpers.js');
const {requiredDeployment} = require('../../functions/requiredDeployment.js');
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
            data.service_data = extractCoc(result.json);
            return data
          }
          else {
            return null;
          }
        });
  }

  async getContacts(contact_types,environments,tenant){
    const query = this.pgp.as.format(sql.getContacts,{environments:environments,contact_types:contact_types,tenant:tenant});
    return this.db.any(query).then(users =>{
      if(users&&users[0]&&users[0].emails){
        return users[0].emails;
      }
      else{
        return [];
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
              queries.push(t.service_multi_valued.addCoc('service',service,result.id));
              if(service.protocol==='oidc'){
                if(service.grant_types&&service.grant_types.length>0){
                  queries.push(t.service_multi_valued.add('service','oidc_grant_types',service.grant_types,result.id));
                }
                if(service.scope&&service.scope.length>0){
                  queries.push(t.service_multi_valued.add('service','oidc_scopes',service.scope,result.id));
                }
                if(service.redirect_uris&&service.redirect_uris.length>0){
                  queries.push(t.service_multi_valued.add('service','oidc_redirect_uris',service.redirect_uris,result.id));
                }
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
            let edits = calcDiff(oldState.service_data,newState,tenant);
            let startDeployment = requiredDeployment(oldState.service_data,newState);
            if(Object.keys(edits.details).length !== 0){
               queries.push(t.service_details.update(edits.details,targetId));
               queries.push(t.service_details_protocol.update('service',edits.details,targetId));               
            }
            if(Object.keys(edits.update.coc).length >0){
              queries.push(t.service_multi_valued.updateCoc('service',{...edits.update.coc,tenant:tenant},targetId));
            }
            if(Object.keys(edits.add.coc).length >0){
              queries.push(t.service_multi_valued.addCoc('service',{...edits.add.coc,tenant:tenant},targetId));
            }
            queries.push(t.service_state.update(targetId,(startDeployment?'pending':'deployed'),'edit'));
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


  async getAll(tenant){
    const query = this.pgp.as.format(sql.getAll,{tenant:tenant});
    return await this.db.any(query).then(services=>{
      if(services){        
        const res = [];
        for (let i = 0; i < services.length; i++) {
          res.push(services[i].json);
        }
        return res;
      }
      else{
        return null;
      }
    });
  }

  async getAllPublic(tenant){
    return this.db.any(sql.getAllPublic,{tenant:tenant}).then(services=>{
      if(services){

        const res = [];
        for (let i = 0; i < services.length; i++) {
          res.push(services[i].json);
        }
        return res;
      }
      else{
        return null;
      }
    });
  }

  async getByProtocolIdPublic(integration_environment,protocol_id,tenant){
    return this.db.oneOrNone(sql.getByProtocolIdPublic,{integration_environment:integration_environment,protocol_id:protocol_id,tenant:tenant}).then(service=>{
      if(service){
        return service.json;
      }else{
        return null
      }
    })
  }

  async getByProtocolId(integration_environment,protocol_id,tenant){
    return this.db.oneOrNone(sql.getByProtocolId,{integration_environment:integration_environment,protocol_id:protocol_id,tenant:tenant}).then(service=>{
      if(service){
        return service.json;
      }else{
        return null
      }
    })
  }

  async getPending(){
    const query = this.pgp.as.format(sql.getPending);
    return this.db.any(query).then(services=>{
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
