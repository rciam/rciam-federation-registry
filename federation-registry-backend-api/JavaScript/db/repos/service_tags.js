const sql = require('../sql').service_tags;
//const {calcDiff,extractCoc} = require('../../functions/helpers.js');
const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */



class ServiceTags {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      // set-up all ColumnSet objects, if needed:
      cs.insert = new pgp.helpers.ColumnSet(['service_id','tag','tenant']);
  }
  async getByServiceId(tenant,service_id){
    return this.db.any(sql.getByServiceId,{service_id:+service_id,tenant:tenant}).then(result=>{
      return result[0].tags;
    });
  }

  async getAll(tenant_name,search_string){
      if(search_string){
        search_string = " AND LOWER(tag) ILIKE '%"+search_string.toLowerCase() +"%'";
      }
      else{
          search_string = ""
      }
      const query = this.pgp.as.format(sql.getAll,{tenant_name:tenant_name,search_string});
      return this.db.any(query).then(response=>{
        return response[0].tags;
      })
  }

  async addTags(tenant,service_id,tags){
    let data = [];
    tags.forEach(tag=>{
        data.push({tenant:tenant,tag:tag,service_id:service_id});
    })
    const query = this.pgp.helpers.insert(data,cs.insert,'service_tags');
    return this.db.none(query).then(data => {
      return true
    })
    .catch(error => {
        return false
    });
  }

  async deleteTags(tenant,service_id,tags){
     return this.db.any('DELETE from service_tags WHERE service_id=$1 AND tag IN ($2:csv) AND tenant=$3',[+service_id,tags,tenant])
  }

}




//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = ServiceTags;
