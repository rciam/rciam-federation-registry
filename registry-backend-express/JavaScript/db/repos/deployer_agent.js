//const sql = require('../sql').group;
let cs = {};
class DeployerAgentRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['type','entity_type','hostname','entity_protocol','tenant']);
  }
  async getAll(){
    return this.db.any('SELECT * FROM tenant_deployer_agents').then(async deployer_agents => {return deployer_agents});
  }
  async getTenant(tenant){
    return this.db.any('SELECT * FROM tenant_deployer_agents WHERE tenant=$1',tenant).then(async deployer_agents => {return deployer_agents});
  }

  async add(agents,tenant){
    let values = []
    // if not Empty array
    if(agents.length>0){
      agents.forEach((agent)=>{
        values.push({tenant:tenant,type:agent.type,entity_type:agent.entity_type,hostname:agent.hostname,entity_protocol:agent.entity_protocol});
      });
      const query = this.pgp.helpers.insert(values, cs,'tenant_deployer_agents');
      return this.db.none(query)
      .then( data => {
          return true
      })
      .catch(error => {
          return false
      });
    }
    else{
      return false;
    }
  }


  async update(agent,id,tenant){
    return this.db.oneOrNone('UPDATE tenant_deployer_agents SET type=$1, entity_type=$2, hostname=$3, entity_protocol=$4 WHERE id=$5 AND tenant=$6 RETURNING id',[agent.type, agent.entity_type, agent.hostname, agent.entity_protocol,+id,tenant]).then(async id => {
      if(id){
        return true
      }
      else {
        return false
      }
    });
  }

  async delete(tenant,id){
    return this.db.oneOrNone('DELETE FROM tenant_deployer_agents WHERE id=$1 AND tenant=$2 RETURNING id',[+id,tenant]).then(async id =>{
      if(id){
        return true
      }
      else {
        return false
      }
    });
  }

  async deleteAll(tenant){
    return this.db.any('DELETE FROM tenant_deployer_agents WHERE tenant=$1 RETURNING id',tenant).then(async id =>{
      if(id){
        return true
      }
      else {
        return false
      }
    });
  }

  async getById(tenant,id){
    return this.db.oneOrNone('SELECT type,entity_type,hostname,entity_protocol FROM tenant_deployer_agents WHERE id=$1 AND tenant=$2',[+id,tenant]).then(async agent => {
      if(agent){
        return agent;
      }
      else {
        return false;
      }
    });
  }


}



module.exports = DeployerAgentRepository;
