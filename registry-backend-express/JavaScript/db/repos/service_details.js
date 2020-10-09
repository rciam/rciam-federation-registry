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
        group_id:data.group_id,
        protocol:data.protocol,
        tenant:data.tenant
      })
    }

    async update(data,id,sub){
        return this.db.oneOrNone(sql.update,{
          service_description: data.service_description,
          service_name: data.service_name,
          logo_uri: data.logo_uri,
          policy_uri: data.policy_uri,
          integration_environment:data.integration_environment,
          requester:sub,
          id:id,
          protocol:data.protocol
        });
    }

    // Gets All Services with necessary data to create a list view.
    async findAllForList(){
      return this.db.any("SELECT id,service_description,logo_uri,service_name,deleted,requester,integration_environment,state FROM service_details JOIN service_state USING (id) WHERE deleted=FALSE OR (deleted=TRUE AND state!='deployed')");
    }
    // Get Services owned by user with user_id=id with necessary data to create a list view.
    // async findBySubForList(sub){
    //   return this.db.any("SELECT id,service_description,logo_uri,service_name,deleted,requester,integration_environment,state FROM service_details JOIN service_state USING (id) WHERE requester = $1 AND (deleted=false OR (deleted=TRUE AND state!='deployed'))", sub);
    // }
    async findBySubForList(sub){
      return this.db.any(sql.getOwnList,{sub:sub});
    }

    async getProtocol(service_id,sub,tenant){
      return this.db.oneOrNone("SELECT protocol FROM ((SELECT protocol,group_id,deleted,id FROM service_details WHERE id=$1 AND tenant=$3) as service_details LEFT JOIN service_state ON service_details.id=service_state.id AND (deleted=false OR (deleted=TRUE AND state!='deployed'))) as service LEFT JOIN (SELECT id AS group_id,sub FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub=$2) AS foo USING (group_id) WHERE sub IS NOT NULL",[+service_id,sub,tenant]);
    }


    async belongsToRequester(service_id,sub){
      if(sub==='admin'){
        return this.db.oneOrNone("SELECT protocol,state FROM service_details JOIN service_state USING (id) WHERE id = $1 AND (deleted=false OR (deleted=TRUE AND state!='deployed'))", [+service_id]);
      }
      else{
        return this.db.oneOrNone("SELECT protocol,state FROM service_details JOIN service_state USING (id) WHERE id = $1 AND requester= $2 AND (deleted=false OR (deleted=TRUE AND state!='deployed'))", [+service_id,sub]);
      }
    }

    async delete(id){
      try {
        return this.db.tx('update-service',async t =>{
          let queries = [];
          queries.push(t.service_state.update(id,'pending'));
          queries.push(t.none('UPDATE service_details SET deleted=TRUE WHERE id=$1',+id));
          var result = await t.batch(queries);
          if(result){
            return true
          }
          else {
            return false
          }
        })
      }
      catch(err){
        return false
      }
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
        cs.update = cs.insert.extend(['?id','deleted']);
    }
    return cs;
}

module.exports = ServiceDetailsRepository;
