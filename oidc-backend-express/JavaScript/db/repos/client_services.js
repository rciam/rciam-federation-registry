const sql = require('../sql').client_services;

const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ClientServicesRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }

    // Gets All Services with necessary data to create a list view.
    async findAllForList(){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,deployed,requester FROM client_services');
    }
    // Get Services owned by user with user_id=id with necessary data to create a list view.
    async findBySubForList(sub){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,deployed,requester FROM client_services WHERE requester = $1', sub);
    }
    // Checking availability of client_id
    async clientIdIsAvailable(clientId) {
        return this.db.oneOrNone('SELECT id FROM client_services WHERE client_id = $1', clientId).then(res=>{
          if(res){return false}else{return true}
        });
    }
    async findServiceDataById(id){
      return this.db.oneOrNone(sql.findOne,{
        id:id
      });
    }
    async belongsToRequester(service_id,sub){
      return this.db.oneOrNone('SELECT id FROM client_services WHERE id = $1 AND requester= $2', [+service_id,sub]).then(res=>{
        if(res){return true}else{return false}
      });
    }
    async delete(id){
      return this.db.none('DELETE FROM client_services WHERE id=$1',+id)
    }
    async getService(id){
      return this.db.oneOrNone('SELECT * FROM client_services WHERE id=$1',+id)
    }

    async add(data,sub){
      let date = Date.now();
      return this.db.one(sql.add,{
        client_description: data.client_description,
        reuse_refresh_tokens: data.reuse_refresh_tokens,
        allow_introspection: data.allow_introspection,
        client_id: data.client_id,
        client_secret: data.client_secret,
        access_token_validity_seconds: data.access_token_validity_seconds,
        refresh_token_validity_seconds: data.refresh_token_validity_seconds,
        client_name: data.client_name,
        logo_uri: data.logo_uri,
        policy_uri: data.policy_uri,
        clear_access_tokens_on_refresh: data.clear_access_tokens_on_refresh,
        code_challenge_method: data.code_challenge_method,
        device_code_validity_seconds: data.device_code_validity_seconds,
        integration_environment: data.integration_environment,
        requester: sub,
      })
    }

    async update(data,id,sub){
        return this.db.none(sql.update,{
          client_description: data.client_description,
          reuse_refresh_tokens: data.reuse_refresh_tokens,
          allow_introspection: data.allow_introspection,
          client_id: data.client_id,
          client_secret: data.client_secret,
          access_token_validity_seconds: data.access_token_validity_seconds,
          refresh_token_validity_seconds: data.refresh_token_validity_seconds,
          client_name: data.client_name,
          logo_uri: data.logo_uri,
          policy_uri: data.policy_uri,
          clear_access_tokens_on_refresh: data.clear_access_tokens_on_refresh,
          code_challenge_method: data.code_challenge_method,
          device_code_validity_seconds: data.device_code_validity_seconds,
          integration_environment:data.integration_environment,
          requester:sub,
          id:id
        })
    }
    async checkClientId(client_id){
      return this.db.oneOrNone("SELECT id FROM client_services WHERE client_id=$1",client_id);
    }

}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'client_services', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['client_description','reuse_refresh_tokens','allow_introspection',
          'client_id','client_secret','access_token_validity_seconds','refresh_token_validity_seconds','client_name',
          'logo_uri','policy_uri','clear_access_tokens_on_refresh','code_challenge_method',
          'device_code_validity_seconds','integration_environment','requester'],
          {table});
        cs.update = cs.insert.extend(['?id','deployed']);
    }
    return cs;
}

module.exports = ClientServicesRepository;
