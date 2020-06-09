const sql = require('../sql').user;
var config = require('../../config');
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

  async getServiceOwners(ids){
    return this.db.any(sql.getServiceOwners,{ids:ids}).then( info =>{
      return info;
    })
  }
  async getPetitionOwner(id){
    return this.db.any(sql.getPetitionOwner,{id:+id}).then( data => {
      return data[0];
    });
  }

  async getReviewers() {
    return this.db.any(sql.getReviewers,{
      entitlements:config.super_admin_entitlements
    });

  }


}






//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = User;
