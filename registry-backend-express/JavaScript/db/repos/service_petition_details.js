const sql = require('../sql').client_petitions;

const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ServicePetitionDetailsRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }



    // Save new Petition
    async add(body,sub){
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
        requester: sub,
        type:body.type,
        status:body.status,
        service_id:body.service_id,
        comment:body.comment,
        protocol:body.protocol
      })
    }


    async findAllForList(){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,requester,type,service_id,comment,status,integration_environment FROM client_petitions WHERE reviewed_at IS NULL');
    }
    async findBySubForList(sub){
      return this.db.any('SELECT id,client_description,logo_uri,client_name,requester,type,service_id,comment,status,integration_environment FROM client_petitions WHERE requester = $1 AND reviewed_at IS NULL', sub);
    }

    async findPetitionDataById(id){
      return this.db.oneOrNone(sql.findOne,{
        id:id
      })
    }
    async findPetitionDataByIdHistory(id){
      console.log(id);
      return this.db.oneOrNone(sql.findOneHistory,{
        id:+id
      })
    }

    async clientIdIsAvailable(clientId) {
        return this.db.oneOrNone("SELECT id FROM client_petitions WHERE client_id = $1 and type='create' AND reviewed_at IS NULL", clientId).then(res=>{
          if(res){return false}else{return true}
        });
    }
    async getPetition(id){
      return this.db.oneOrNone("SELECT * FROM client_petitions WHERE id=$1 and reviewed_at IS NULL",+id)
    }

    async update(body,id,type){
      if(type==='delete'){
        type='edit'
      }
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
          id:id,
          type:type,
          comment:null,
          protocol:body.protocol

        })
    }

    async petitionType(id,sub){
      return this.db.oneOrNone("SELECT type FROM client_petitions WHERE id = $1 AND requester=$2 AND reviewed_at IS NULL", [+id,sub]);
    }

     async deleteService(id,sub){
       return this.db.oneOrNone("SELECT id FROM client_petitions WHERE service_id = $1 AND reviewed_at IS NULL",+id).then(async pId=>{
         if(pId){

            return await this.db.none("UPDATE client_petitions SET type='delete' WHERE id=$1",+pId.id).then(res=>{
              return pId
            })

         }
         else {
           return await this.db.one("INSERT INTO client_petitions (service_id,type,requester) VALUES ($1,'delete',$2) RETURNING id",[+id,sub])
         }
       })
     }
     async getHistory(service_id){
       return await this.db.any("SELECT id,type,status,reviewed_at,comment from client_petitions where service_id=$1 ORDER BY reviewed_at ASC",+service_id)
     }
    async getHistorySingle(id){
      return await this.db.oneOrNone("SELECT id,type,status,reviewed_at from client_petitions where id=$1",+id)
    }

     async belongsToRequester(petition_id,sub){
       return this.db.oneOrNone('SELECT id FROM client_petitions WHERE id = $1 AND requester= $2 AND reviewed_at IS NULL', [+petition_id,sub]).then(res=>{
         if(res){return true}else{return false}
       });
     }

     async deletePetition(petition_id){
       return this.db.none('DELETE FROM client_petitions WHERE id=$1 AND reviewed_at IS NULL',+petition_id)
     }

     async approveCreation(id,approved_by,status,comment,service_id){
        let date = new Date(Date.now());
        return this.db.none("UPDATE client_petitions SET status=$1, reviewed_at=$2, reviewer=$3,service_id=$6, comment=$5 WHERE id=$4",[status,date,approved_by,+id,comment,+service_id]);
     }

     async review(id,approved_by,status,comment){
        let date = new Date(Date.now());
        return this.db.none("UPDATE client_petitions SET status=$1, reviewed_at=$2, reviewer=$3, comment=$5 WHERE id=$4",[status,date,approved_by,+id,comment]);
     }
     async setPending(id){
       return this.db.none("UPDATE client_petitions SET status='pending', comment=null WHERE id=$1",+id);
     }
     async checkClientId(client_id){
       return this.db.oneOrNone("SELECT id FROM client_petitions WHERE client_id=$1 AND reviewed_at IS NULL",client_id);
     }

async getServiceId(id){
  return this.db.oneOrNone("SELECT service_id FROM client_petitions WHERE id=$1 AND reviewed_at IS NULL",+id);
}






    // NOT YET FIXED



    async findConnectionForEdit(id){
      return this.db.oneOrNone(sql.findForEdit,{
        id:id
      })
    }



    // Tries to find a user from name;
    async findByClientId(clientId) {
        return this.db.oneOrNone('SELECT * FROM client_services WHERE client_id = $1 AND is_deleted=false AND model_id IS NULL', clientId);
    }

    async delete(sub,id) {
        let date = new Date(Date.now());
        return this.db.none('UPDATE client_services SET is_deleted=true, updated_at=$3 WHERE id = $1 and requester=$2', [+id,sub,date]);
    }





}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'client_petitions', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['client_description','reuse_refresh_tokens','allow_introspection',
          'client_id','client_secret','access_token_validity_seconds','refresh_token_validity_seconds','client_name',
          'logo_uri','policy_uri','clear_access_tokens_on_refresh','code_challenge_method',
          'device_code_validity_seconds','integration_environment','requester','protocol','comment'],
          {table});
        cs.update = cs.insert.extend(['?id','state','type','reviewed_at','reviewer','service_id']);
    }
    return cs;
}

module.exports = ServicePetitionDetailsRepository;
