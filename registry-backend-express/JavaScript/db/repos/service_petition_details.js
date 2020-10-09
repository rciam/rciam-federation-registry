const sql = require('../sql').service_petition_details;

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
        service_description: body.service_description,
        service_name: body.service_name,
        logo_uri: body.logo_uri,
        policy_uri: body.policy_uri,
        integration_environment: body.integration_environment,
        requester: sub,
        type:body.type,
        status:"pending",
        service_id:body.service_id,
        comment:body.comment,
        protocol:body.protocol,
        group_id:body.group_id,
        tenant:body.tenant
      })
    }

    async update(body,id){
        return this.db.none(sql.update,{
          service_description: body.service_description,
          service_name: body.service_name,
          logo_uri: body.logo_uri,
          policy_uri: body.policy_uri,
          integration_environment:body.integration_environment,
          id:id,
          type:body.type,
          protocol:body.protocol
        })
    }

    async getServiceId(id){
      return this.db.oneOrNone('SELECT service_id FROM service_petition_details WHERE id=$1 and reviewed_at IS NULL',+id).then(res=>{
        if(res){
          return res.service_id;
        }
        else {
          return false;
        }
      });
    }
    async findAllForList(){
      return this.db.any('SELECT id,service_description,logo_uri,service_name,requester,type,service_id,comment,status,integration_environment FROM service_petition_details WHERE reviewed_at IS NULL');
    }

    async findByServiceIds(ids){
      return this.db.any('SELECT id,service_description,logo_uri,service_name,requester,type,service_id,comment,status,integration_environment FROM service_petition_details WHERE service_id IN ($1:csv) AND reviewed_at IS NULL',ids);
    }
    async findBySubForList(sub){
      return this.db.any('SELECT id,service_description,logo_uri,service_name,requester,type,service_id,comment,status,integration_environment FROM service_petition_details WHERE requester = $1 AND reviewed_at IS NULL', sub);
    }
    async approveCreation(id,approved_by,status,comment,service_id,tenant){
       let date = new Date(Date.now());
       return this.db.none("UPDATE service_petition_details SET status=$1, reviewed_at=$2, reviewer=$3,service_id=$6, comment=$5 WHERE id=$4 AND tenant=$7",[status,date,approved_by,+id,comment,+service_id,tenant]);
    }

    async belongsToRequesterHistory(petition_id,sub){
      return this.db.oneOrNone('SELECT id FROM service_petition_details WHERE id = $1 AND requester= $2', [+petition_id,sub]).then(res=>{
        if(res){return true}else{return false}
      });
    }

    async belongsToRequester(petition_id,sub,tenant){
        return this.db.oneOrNone(sql.belongsToRequester,{
          id:+petition_id,
          sub:sub,
          tenant:tenant
        })
    }


    async review(id,approved_by,status,comment,tenant){
       let date = new Date(Date.now());
       return this.db.any("UPDATE service_petition_details SET status=$1, reviewed_at=$2, reviewer=$3, comment=$5 WHERE id=$4 AND tenant=$6 RETURNING *",[status,date,approved_by,+id,comment,tenant]);
    }



     async getHistory(service_id,tenant){
       return await this.db.any("SELECT id,type,status,reviewed_at,comment from service_petition_details where service_id=$1 AND tenant=$2 ORDER BY reviewed_at ASC",[+service_id,tenant])
     }

     async deletePetition(petition_id){
       return this.db.oneOrNone('DELETE FROM service_petition_details WHERE id=$1 AND reviewed_at IS NULL RETURNING id',+petition_id);
     }





     async openPetition(service_id,tenant){
       return this.db.oneOrNone("SELECT id FROM service_petition_details WHERE service_id = $1 AND reviewed_at IS NULL AND tenant=$2", [+service_id,tenant]).then(result => {
         if(result){
           return result.id;
         }
         else{
           return false
         }
         });
     }



}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'service_petition_details', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['service_description','service_name',
          'logo_uri','policy_uri','integration_environment','requester','protocol','comment'],
          {table});
        cs.update = cs.insert.extend(['?id','state','type','reviewed_at','reviewer','service_id']);
    }
    return cs;
}

module.exports = ServicePetitionDetailsRepository;
