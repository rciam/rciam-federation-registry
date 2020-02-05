const sql = require('../sql').client_details;

const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ClientDetailsRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }


    async approve(id,approved_by){
      let date = new Date(Date.now());
      return this.db.none('UPDATE client_details SET approved=true, updated_at=$3, reviewer=$2 WHERE id = $1', [+id,approved_by,date]);
    }
    async findConnectionById(id){
      return this.db.oneOrNone(sql.findOne,{
        id:id
      })
    }
    async findConnectionForEdit(id){
      return this.db.oneOrNone(sql.findForEdit,{
        id:id
      })
    }

    async findAll(){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,approved,requester FROM client_details WHERE is_deleted=false AND model_id IS NULL');
    }
    async findByuserIdentifier(id){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,approved,requester FROM client_details WHERE requester = $1 AND is_deleted=false AND model_id IS NULL', id);
    }
    // Tries to find a user from name;
    async findByClientId(clientId) {
        return this.db.oneOrNone('SELECT * FROM client_details WHERE client_id = $1 AND is_deleted=false AND model_id IS NULL', clientId);
    }

    async delete(sub,id) {
        let date = new Date(Date.now());
        return this.db.none('UPDATE client_details SET is_deleted=true, updated_at=$3 WHERE id = $1 and requester=$2', [+id,sub,date]);
    }
    async update(body,revision,id,sub){
        let date = new Date(Date.now());
        revision++;
        return this.db.none(sql.update,{
          client_description: body.client_description,
          reuse_refresh_tokens: body.reuse_refresh_tokens,
          allow_introspection: body.allow_introspection,
          client_id: body.client_id,
          client_secret: body.client_secret,
          access_token_validity_seconds: body.access_token_validity_seconds,
          refresh_token_validity_seconds: body.refresh_token_validity_seconds,
          client_name: body.client_name,
          logo_uri: body.logo_uri,
          policy_uri: body.policy_uri,
          clear_access_tokens_on_refresh: body.clear_access_tokens_on_refresh,
          code_challenge_method: body.code_challenge_method,
          device_code_validity_seconds: body.device_code_validity_seconds,
          integration_environment:body.integration_environment,
          approved:false,
          requester:sub,
          revision:revision,
          updated_at: date,
          id:id
        })
    }
    async add(body,sub,model_id,revision){
      let date = Date.now();
      return this.db.one(sql.add,{
        client_description: body.client_description,
        reuse_refresh_tokens: body.reuse_refresh_tokens,
        allow_introspection: body.allow_introspection,
        client_id: body.client_id,
        client_secret: body.client_secret,
        access_token_validity_seconds: body.access_token_validity_seconds,
        refresh_token_validity_seconds: body.refresh_token_validity_seconds,
        client_name: body.client_name,
        logo_uri: body.logo_uri,
        policy_uri: body.policy_uri,
        clear_access_tokens_on_refresh: body.clear_access_tokens_on_refresh,
        code_challenge_method: body.code_challenge_method,
        device_code_validity_seconds: body.device_code_validity_seconds,
        integration_environment: body.integration_environment,
        created_at: date,
        updated_at: date,
        requester: sub,
        revision:revision,
        model_id:model_id
      })
    }



}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'client_details', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['client_description','reuse_refresh_tokens','allow_introspection',
          'client_id','client_secret','access_token_validity_seconds','refresh_token_validity_seconds','client_name',
          'logo_uri','policy_uri','clear_access_tokens_on_refresh','code_challenge_method',
          'device_code_validity_seconds','integration_environment','created_at','updated_at','requester'],
          {table});
        cs.update = cs.insert.extend(['?id','approved','reviewer','is_deleted','model_id','revision']);
    }
    return cs;
}

module.exports = ClientDetailsRepository;
