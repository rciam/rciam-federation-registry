

let cs= {};
/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class UserEduPersonEntitlementRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
         cs = new pgp.helpers.ColumnSet(['user_id','edu_person_entitlement'],{table:'user_edu_person_entitlement'});
    }
    async findByConnectionId(id){

      return this.db.any('SELECT * FROM user_edu_person_entitlement WHERE user_id IN ($1:csv)',[id]);
    }
    async delete(id) {
        return this.db.result('DELETE FROM user_edu_person_entitlement WHERE user_id = $1', +id, r => r.rowCount);
    }

    // Tries to find a user from name;

    async add(data,id){
      let values = []

      // if not Empty array
      if(data){
        if(data.length>0){
          data.forEach((item)=>{
            values.push({user_id:id,edu_person_entitlement:item})
          });

          const query = this.pgp.helpers.insert(values, cs);
          this.db.none(query)
          .then(data => {
              return 'success'
          })
          .catch(error => {
              return 'error'
          });
        }else{

          return 'error'
        }
      }



    }



}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = UserEduPersonEntitlementRepository;
