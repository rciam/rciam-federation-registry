const sql = require('../sql').tags;
//const {calcDiff,extractCoc} = require('../../functions/helpers.js');
const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */



class SearviceTags {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      // set-up all ColumnSet objects, if needed:
      cs.insert = new pgp.helpers.ColumnSet(['service_id','tag']);
  }
  async getByServiceId(service_id){
    return this.db.any(sql.getByServiceId,{service_id:+service_id}).then(tags=>{
      return tags;
    });
  }

  async getAll(search_string){
      if(search_string){
        search_string = " WHERE LOWER(tag) ILIKE '%"+search_string.toLowerCase() +"%'";
      }
      else{
          search_string = ""
      }
      return this.db.any(sql.getAll,{search_string})
  }

  async addTags(tags,service_id){
    let data = [];
    tags.forEach(tag=>{
        data.push({tag:tag,service_id:service_id})
    })
    const query = this.pgp.helpers.insert(data,cs.multi,'service_tags');
    return this.db.none(query).then(data => {
        return true
    })
    .catch(error => {
        throw error
    });
  }

  async removeTags(tags,service_id){
      this.db.any('DELETE from serivce_tags WHERE service_id=$1 AND tag IN ($2:csv)',[+service_id,tags])
  }

}




//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = SearviceTags;
