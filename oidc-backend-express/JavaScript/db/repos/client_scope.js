

let cs= {};
/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ClientScopeRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
         cs = new pgp.helpers.ColumnSet(['owner_id','value'],{table:'client_scope'});
    }


    // Tries to find a user from name;

    async add(data,id){
      let values = []

      // if not Empty array
      if(data.length>0){
        data.forEach((item)=>{
          values.push({owner_id:id,value:item})
        });
        const query = this.pgp.helpers.insert(values, cs);
        this.db.none(query)
        .then(data => {
            return 'success'
        })
        .catch(error => {
            return 'error'
        });
      }
      else{
        return null
      }

    }



}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = ClientScopeRepository;
