const sql = require('../sql').service_details;

let cs = {}; // Reusable ColumnSet objects.

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


    async addMultiple(services){
      const query = this.pgp.helpers.insert(services,cs.insert_multi,'service_details')+"RETURNING id";
      return this.db.any(query)
      .then(service_ids => {
          services.forEach((service,index)=> {
            services[index].id = service_ids[index].id;
          });
          return services
      })
      .catch(error => {
          throw error
      });
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


    async getProtocol(service_id,sub,tenant){
      return this.db.oneOrNone("SELECT protocol FROM ((SELECT protocol,group_id,deleted,id FROM service_details WHERE id=$1 AND tenant=$3) as service_details LEFT JOIN service_state ON service_details.id=service_state.id AND (deleted=false OR (deleted=TRUE AND state!='deployed'))) as service LEFT JOIN (SELECT id AS group_id,sub FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub=$2) AS foo USING (group_id) WHERE sub IS NOT NULL",[+service_id,sub,tenant]);
    }


    async belongsToRequester(service_id,sub){
      if(sub==='admin'){
        return this.db.oneOrNone("SELECT protocol,state FROM service_details JOIN service_state USING (id) WHERE id = $1 AND deleted=false", [+service_id]);
      }
      else{
        return this.db.oneOrNone("SELECT protocol,state FROM service_details JOIN service_state USING (id) WHERE id = $1 AND requester= $2 AND deleted=false", [+service_id,sub]);
      }
    }

    async delete(id){
      try {
        return this.db.tx('update-service',async t =>{
          let queries = [];
          queries.push(t.service_state.update(id,'pending','delete'));
          //queries.push(t.none('UPDATE service_details SET deleted=TRUE WHERE id=$1',+id));
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

    async updateExternalId(updateData){
      const update = this.pgp.helpers.update(updateData, cs.external_id) + ' WHERE v.id = t.id RETURNING t.id';
      return this.db.any(update).then((ids)=>{
        if(ids.length===updateData.length){
          return true
        }
        else{
          return false
        }
      }).catch(error=>{
        return false
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
        const table = new pgp.helpers.TableName({table: 'service_details', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['service_description','service_name',
          'logo_uri','policy_uri','integration_environment','requester','protocol'],
          {table});
        cs.insert_multi = new pgp.helpers.ColumnSet(['external_id','tenant','service_name','group_id','service_description','logo_uri','policy_uri','integration_environment','protocol'])
        cs.update = cs.insert.extend(['?id','deleted']);
        cs.external_id = new pgp.helpers.ColumnSet(['?id','external_id'],{table:'service_details'});
    }
    return cs;
}

module.exports = ServiceDetailsRepository;
