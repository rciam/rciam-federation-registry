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
  async getUser(sub){

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
  async getPetitionOwners(id){
    return this.db.any(sql.getPetitionOwners,{id:+id}).then( data => {
      if(data){
        return data;
      }
      else{
        return [];
      }
    });
  }

  async getReviewers(tenant) {
    let entitlements = [];
    return this.db.any(sql.getReviewEntitlements,{tenant:'egi'}).then(result => {
      if(result){
        result.forEach(item=> {
          entitlements.push(item.entitlement);
        });
        return this.db.any(sql.getReviewers,{
          entitlements:entitlements
        }).then(info=>{
          if(info){
            return info;
          }
          else{
            return [];
          }
        });
      }
    })


  }


}






//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = User;
