const sql = require('../sql').service;
const {calcDiff,extractServiceBoolean} = require('../../functions/helpers.js');
const {requiredDeployment} = require('../../functions/requiredDeployment.js');
const cs = {}; // Reusable ColumnSet objects.
var requested_attributes = require('../../tenant_config/requested_attributes.json')
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
            data.service_data = extractServiceBoolean(result.json);
            return data
          }
          else {
            return null;
          }
        });
  }

  async getContacts(data,tenant){
    const query = this.pgp.as.format(sql.getContacts,{...data,tenant:tenant});
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
              queries.push(t.service_multi_valued.addServiceBoolean('service',service,result.id));
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
                if(service.post_logout_redirect_uris&&service.post_logout_redirect_uris.length>0){
                  queries.push(t.service_multi_valued.add('service','oidc_post_logout_redirect_uris',service.post_logout_redirect_uris,result.id));
                }
              }
              if(service.protocol==='saml'){
                if(service.requested_attributes&&service.requested_attributes.length>0){
                  queries.push(t.service_multi_valued.addSamlAttributes('service',service.requested_attributes,result.id));                  
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
            if(Object.keys(edits.update.service_boolean).length >0){
              queries.push(t.service_multi_valued.updateServiceBoolean('service',{...edits.update.service_boolean,tenant:tenant},targetId));
            }
            if(Object.keys(edits.update.requested_attributes).length >0){
              queries.push(t.service_multi_valued.updateSamlAttributes('petition',edits.update[key],targetId))              
            }
            if(Object.keys(edits.add.service_boolean).length >0){
              queries.push(t.service_multi_valued.addServiceBoolean('service',{...edits.add.service_boolean,tenant:tenant},targetId));
            }
            queries.push(t.service_state.update(targetId,(startDeployment?'pending':'deployed'),'edit'));
            for (var key in edits.add){
              if(key==='contacts') {
                queries.push(t.service_contacts.add('service',edits.add[key],targetId));
              }
              else if(key==='requested_attributes'){queries.push(t.service_multi_valued.addSamlAttributes('service',edits.add[key],targetId))}
              else {
                queries.push(t.service_multi_valued.add('service',key,edits.add[key],targetId));
              }
            }
            for (var key in edits.dlt){
              if(key==='contacts'){queries.push(t.service_contacts.delete_one_or_many('service',edits.dlt[key],targetId));}
              else if(key==='requested_attributes'){queries.push(t.service_multi_valued.deleteSamlAttributes('service',edits.dlt[key],targetId))}
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


  async getAll(tenant,filters,authorized){
    let filter_strings = {
      integration_environment_filter : "",
      protocol_id_filter: "",
      protocol_filter: "",
      all_properties_filter:"'client_id',sd.client_id,'external_id',sd.external_id,'allow_introspection',sd.allow_introspection,\
      'code_challenge_method',sd.code_challenge_method, 'device_code_validity_seconds',sd.device_code_validity_seconds,'application_type',sd.application_type,\
      'access_token_validity_seconds',sd.access_token_validity_seconds,'refresh_token_validity_seconds',sd.refresh_token_validity_seconds,'refresh_token_validity_seconds',sd.refresh_token_validity_seconds,'client_secret',sd.client_secret,\
      'reuse_refresh_token',sd.reuse_refresh_token,'jwks',sd.jwks,'jwks_uri',sd.jwks_uri,\
      'token_endpoint_auth_method',sd.token_endpoint_auth_method,'token_endpoint_auth_signing_alg',sd.token_endpoint_auth_signing_alg,\
      'clear_access_tokens_on_refresh',sd.clear_access_tokens_on_refresh,'id_token_timeout_seconds',sd.id_token_timeout_seconds,\
      'metadata_url',sd.metadata_url,'entity_id',sd.entity_id,\
      'grant_types',(SELECT json_agg((v.value)) FROM service_oidc_grant_types v WHERE sd.id = v.owner_id),\
      'scope',(SELECT json_agg((v.value)) FROM service_oidc_scopes v WHERE sd.id = v.owner_id),\
      'requested_attributes',(SELECT coalesce(json_agg(json_build_object('friendly_name',v.friendly_name,'name',v.name,'required',v.required,'name_format',v.name_format)), '[]'::json) FROM service_saml_attributes v WHERE sd.id=v.owner_id),\
      'redirect_uris',(SELECT json_agg((v.value)) FROM service_oidc_redirect_uris v WHERE sd.id = v.owner_id),'post_logout_redirect_uris',(SELECT json_agg((v.value)) FROM service_oidc_post_logout_redirect_uris v WHERE sd.id = v.owner_id),",
      tags_filter:"",
      exclude_tags_filter:""
    }
    if(filters.tags){
      filter_strings.tags_filter= "AND ("
      filters.tags.forEach((tag,index)=>{
        if(index>0){
          filter_strings.tags_filter = filter_strings.tags_filter + " OR"  
        }
        filter_strings.tags_filter = filter_strings.tags_filter + " '"+ tag +"' = ANY(tags)"
      })
      filter_strings.tags_filter = filter_strings.tags_filter + ')' 
    }
    if(filters.integration_environment){
      filter_strings.integration_environment_filter = "AND integration_environment='" + filters.integration_environment+ "'";
    }
    if(filters.exclude_tags){
      filter_strings.exclude_tags_filter= "AND NOT ("
      filters.exclude_tags.forEach((tag,index)=>{
        if(index>0){
          filter_strings.exclude_tags_filter = filter_strings.exclude_tags_filter + " OR"  
        }
        filter_strings.exclude_tags_filter = filter_strings.exclude_tags_filter + " '"+ tag +"' = ANY(tags)"
      })
      filter_strings.exclude_tags_filter = filter_strings.exclude_tags_filter + ')'
    }
    if(filters.protocol){
      filter_strings.protocol_filter = "AND protocol='" + filters.protocol+ "'";
    }
    if(!authorized){
      filter_strings.all_properties_filter = ""
    }
    if(filters.protocol_id){
      filter_strings.protocol_id_filter = "AND (entity_id='"+ filters.protocol_id + "' OR client_id='" +filters.protocol_id+ "')"
    }
    const query = this.pgp.as.format(sql.getAll,{tenant:tenant,...filter_strings});
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

 

  async getPending(){
    const query = this.pgp.as.format(sql.getPending);
    return this.db.any(query).then(services=>{
      services.forEach((service,index)=>{

        if(service.json.protocol==='saml'&&service.json.requested_attributes&&service.json.requested_attributes.length>0){
          service.json.requested_attributes.forEach((attribute,attr_index)=>{      
            let match_index = requested_attributes.findIndex(x => x.friendly_name ===attribute.friendly_name)            
            if(requested_attributes[match_index].name===attribute.name){              
              services[index].json.requested_attributes[attr_index].type = "standard";
            }else{
              services[index].json.requested_attributes[attr_index].type = "custom";
            }
          })
        }
      })
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
