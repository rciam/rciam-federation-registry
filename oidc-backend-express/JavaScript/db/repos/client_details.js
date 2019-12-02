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


    // Tries to find a user from name;
    async findByClientId(clientId) {
        return this.db.oneOrNone('SELECT * FROM client_details WHERE client_id = $1', clientId);
    }
    async findByRequesterId(id) {
        return this.db.any('SELECT * FROM client_details WHERE requester = $1', id);
    }
    async add(data){
      let date = Date.now();
      console.log('this is from the client details');
      console.log(data);
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
        created_at: date,
        clear_access_tokens_on_refresh: data.clear_access_tokens_on_refresh,
        code_challenge_method: data.code_challenge_method,
        device_code_validity_seconds: data.device_code_validity_seconds,
        modified_at: date,
        pending_approval: true,
        approved: false,
        requester: 1,
        reviewer:2
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
          'logo_uri','policy_uri','created_at','clear_access_tokens_on_refresh','code_challenge_method',
          'device_code_validity_seconds','modified_at','pending_approval','approved','requester','reviewer'],
          {table});
        cs.update = cs.insert.extend(['?id']);
    }
    return cs;
}

module.exports = ClientDetailsRepository;
