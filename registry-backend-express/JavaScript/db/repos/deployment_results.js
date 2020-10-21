//const sql = require('../sql').group;
let cs = {};
class DeploymentResultsRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['agent_id','service_id']);
  }

  async setPendingAgents(postData){
    // updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:3,state:'failed'}];
    const query = this.pgp.helpers.insert(postData, cs,'deployment_results');
    //=> UPDATE "service_data" AS t SET "state"=v."state"
    //   FROM (VALUES(1,'deployed'),(2,'deployed'),(3,'failed'))
    //   AS v("id","state") WHERE v.id = t.id
    return this.db.none(query)
    .then( data => {
        return true
    })
    .catch(error => {
        return false
    });
  }

  async setResponse(service_id,agent_id){
    return this.db.any('DELETE FROM deployment_results WHERE service_id=$1 AND agent_id=$2 RETURNING *',[+service_id,+agent_id]);
  }

  async isDeploymentFinished(id){
    return this.db.any('SELECT * from deployment_results WHERE service_id=$1',+id).then(res =>{
      if(res){
        if(res.length>0){
          return false;
        }
        else{
          return true;
        }
      }
      throw 'db error'
    })
  }


}



module.exports = DeploymentResultsRepository;
