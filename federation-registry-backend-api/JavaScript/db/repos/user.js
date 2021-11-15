const sql = require('../sql').user;
const cs = {}; // Reusable ColumnSet objects.
/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class User {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;

      // set-up all ColumnSet objects, if needed:

  }
  async getUser(sub,tenant){
    return this.db.oneOrNone(sql.getUser,{sub:sub,tenant:tenant});
  }

  async getServiceOwners(ids){
    return this.db.any(sql.getServiceOwners,{ids:ids}).then( info =>{
      if(info){
        return info;
      }
      else{
        return [];
      }
    });
  }


  async getTechnicalContacts(tenant){
    return this.db.any(sql.getTenchicalContacts,{tenant:tenant});
  }

  async getPetitionOwners(id,tenant){
    const query = this.pgp.as.format(sql.getPetitionOwners,{id:+id,tenant:tenant});
    return this.db.any(query).then( data => {
      if(data){
        return data;
      }
      else{
        return [];
      }
    });
  }

  async getUsersByAction(action,tenant){
    const query = this.pgp.as.format(sql.getUsersByAction,{action:action,tenant:tenant});
    return this.db.any(query).then(res=>{
      if(res){
        return res;
      }
      else{
        return null;
      }
    })
  }

}







//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = User;
