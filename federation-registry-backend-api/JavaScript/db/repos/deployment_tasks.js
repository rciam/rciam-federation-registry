//const sql = require('../sql').group;
let cs = {};
class DeploymentTasksRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['agent_id','service_id','deployer_name']);
  }

  async setDeploymentTasks(postData){
    // updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:3,state:'failed'}];
    const query = this.pgp.helpers.insert(postData, cs,'deployment_tasks');
    //=> UPDATE "service_data" AS t SET "state"=v."state"
    //   FROM (VALUES(1,'deployed'),(2,'deployed'),(3,'failed'))
    //   AS v("id","state") WHERE v.id = t.id
    return await this.db.none(query)
    .then( data => {
        return true
    })
    .catch(error => {
        return false
    });
  }

  async resolveTask(service_id,deployer_name){
      return await this.db.oneOrNone('DELETE FROM deployment_tasks WHERE service_id=$1 AND deployer_name'+ (deployer_name?"='"+deployer_name+"'":' IS NULL ') + ' RETURNING *',[+service_id]).then(res=>{if(res){return true}else{return false}}).catch(err=>{ return false;});    
      //return await this.db.oneOrNone('DELETE FROM deployment_tasks WHERE service_id=$1 RETURNING *',[+service_id]).catch(err=>{throw 'Task not found'});
    
  }

  async resolveAllTasks(service_id){
    return await this.db.any('DELETE FROM deployment_tasks where service_id=$1',+service_id);
  }


  async isDeploymentFinished(id){
    return await this.db.any('SELECT * from deployment_tasks WHERE service_id=$1',+id).then(res =>{
      if(res){
        if(res.length>0){
          return false;
        }
        else{
          return true;
        }
      }
      else{throw 'db-error'}
    })
  }


}



module.exports = DeploymentTasksRepository;
