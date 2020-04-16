const sql = require('../sql').service_details;

const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ServiceDetailsRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
        createColumnsets(pgp);
    }

    async add(data,sub){
      let date = Date.now();
      return this.db.one(sql.add,{
        service_description: data.service_description,
        service_name: data.service_name,
        logo_uri: data.logo_uri,
        policy_uri: data.policy_uri,
        integration_environment: data.integration_environment,
        requester: sub,
        protocol:data.protocol
      })
    }

    async update(data,id,sub){
        return this.db.none(sql.update,{
          service_description: data.service_description,
          service_name: data.service_name,
          logo_uri: data.logo_uri,
          policy_uri: data.policy_uri,
          integration_environment:data.integration_environment,
          requester:sub,
          id:id,
          protocol:data.protocol
        })
    }

    // Gets All Services with necessary data to create a list view.
    async findAllForList(){
      return this.db.any('SELECT id,service_description,logo_uri,service_name,deployed,requester,integration_environment FROM service_details WHERE deleted=FALSE');
    }
    // Get Services owned by user with user_id=id with necessary data to create a list view.
    async findBySubForList(sub){
      return this.db.any('SELECT id,service_description,logo_uri,service_name,deployed,requester,integration_environment FROM service_details WHERE requester = $1 AND deleted=false', sub);
    }

    async belongsToRequester(service_id,sub){
      if(sub==='admin'){
        return this.db.oneOrNone('SELECT protocol FROM service_details WHERE id = $1 AND deleted=FALSE', [+service_id]).then(res=>{
          if(res){return res.protocol}else{return false}
        });
      }
      else{
        return this.db.oneOrNone('SELECT protocol FROM service_details WHERE id = $1 AND requester= $2 and deleted=FALSE', [+service_id,sub]).then(res=>{
          if(res){return res.protocol}else{return false}
        });
      }
    }

    async delete(id){
      return this.db.none('UPDATE service_details SET deleted=TRUE WHERE id=$1',+id)
    }





}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'service_details', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['service_description','service_name',
          'logo_uri','policy_uri','integration_environment','requester','protocol'],
          {table});
        cs.update = cs.insert.extend(['?id','deployed']);
    }
    return cs;
}

module.exports = ServiceDetailsRepository;
