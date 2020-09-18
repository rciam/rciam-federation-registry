const sql = require('../sql').service_details_protocol;

let cs = {}; // Reusable ColumnSet objects.
const petition = 'petition_';
const service = '';
/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ServiceDetailsProtocolRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;
        cs = new pgp.helpers.ColumnSet(['?id','client_id'],{table:'service_details_oidc'});
        // set-up all ColumnSet objects, if needed:

    }
    async checkClientId(client_id,service_id,petition_id,tenant){
      console.log(client_id + ' ' +service_id + ' ' + petition_id + ' ' + tenant);
      return this.db.any(sql.checkClientId,{
        client_id:client_id,
        service_id:service_id,
        petition_id:petition_id,
        tenant:tenant
      }).then(result =>{
          if(result.length>0){return false}else{return true}
      })
    }
    async checkEntityId(entity_id,service_id,petition_id,tenant){
      return this.db.any(sql.checkEntityId,{
        entity_id:entity_id,
        service_id:service_id,
        petition_id:petition_id,
        tenant:tenant
      }).then(result =>{
          if(result.length>0){return false}else{return true}
      })
    }

    // Data format
    // updateData = [{id:1,client_id:value1},{id:2,client_id:value2},{id:3,client_id:value3}]
    async updateClientId(updateData){
      const update = this.pgp.helpers.update(updateData, cs) + ' WHERE v.id = t.id RETURNING t.id';
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


    async add(type,data,id){
        if(type==='petition'){
          type = petition;
        }
        else {
          type = service;
        }
        if(data.protocol==='oidc'){
          return this.db.one(sql.addOidc,{
            reuse_refresh_tokens: data.reuse_refresh_tokens,
            allow_introspection: data.allow_introspection,
            client_id: data.client_id,
            client_secret: data.client_secret,
            id_token_timeout_seconds:data.id_token_timeout_seconds,
            access_token_validity_seconds: data.access_token_validity_seconds,
            refresh_token_validity_seconds: data.refresh_token_validity_seconds,
            clear_access_tokens_on_refresh: data.clear_access_tokens_on_refresh,
            code_challenge_method: data.code_challenge_method,
            device_code_validity_seconds: data.device_code_validity_seconds,
            type:type,
            id:+id
          })
        }
        else if (data.protocol==='saml'){
          return this.db.one(sql.addSaml,{
            metadata_url:data.metadata_url,
            entity_id:data.entity_id,
            type:type,
            id:+id
          })
        }

    }



    async update(type,data,id){
      if(type==='petition'){
        type=petition;
      }
      else{
        type=service;
      }
      if(data.protocol==='oidc'){
        return this.db.none(sql.updateOidc,{
          reuse_refresh_tokens: data.reuse_refresh_tokens,
          allow_introspection: data.allow_introspection,
          client_id: data.client_id,
          client_secret: data.client_secret,
          id_token_timeout_seconds: data.id_token_timeout_seconds,
          access_token_validity_seconds: data.access_token_validity_seconds,
          refresh_token_validity_seconds: data.refresh_token_validity_seconds,
          clear_access_tokens_on_refresh: data.clear_access_tokens_on_refresh,
          code_challenge_method: data.code_challenge_method,
          device_code_validity_seconds: data.device_code_validity_seconds,
          type:type,
          id:+id
        })
      }
      else if (data.protocol==='saml'){
        return this.db.none(sql.updateSaml,{
          entity_id:data.entity_id,
          metadata_url:data.metadata_url,
          type:type,
          id:+id
        })
      }
    }




}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = ServiceDetailsProtocolRepository;
