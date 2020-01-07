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



    async findConnectionByIdAndSub(sub,id){
      return this.db.oneOrNone(sql.findOne,{
        requester:sub,
        id:id
      })
    }



    async findByuserIdentifier(id){
      return this.db.any('SELECT id,client_description,logo_uri,client_name FROM client_details WHERE requester = $1', id);
    }
    // Tries to find a user from name;
    async findByClientId(clientId) {
        return this.db.oneOrNone('SELECT * FROM client_details WHERE client_id = $1', clientId);
    }
    async findByRequesterId(id) {

        return this.db.any('SELECT * FROM client_details WHERE requester = $1', id);
    }
    async delete(id) {
        return this.db.result('DELETE FROM client_details WHERE id = $1', +id, r => r.rowCount);
    }
    async add(body,userinfo){
      let date = Date.now();
      console.log('this is from the client details');

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
        created_at: date,
        clear_access_tokens_on_refresh: body.clear_access_tokens_on_refresh,
        code_challenge_method: body.code_challenge_method,
        device_code_validity_seconds: body.device_code_validity_seconds,
        modified_at: date,
        pending_approval: true,
        approved: false,
        requester:userinfo.sub,
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
