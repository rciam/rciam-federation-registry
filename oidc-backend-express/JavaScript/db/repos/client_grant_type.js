

let cs= {};
/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ClientGrantTypeRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;

        // set-up all ColumnSet objects, if needed:
         cs = new pgp.helpers.ColumnSet(['owner_id','value'],{table:'client_grant_type'});
    }

    async findByConnectionId(id){

      return this.db.any('SELECT * FROM client_grant_type WHERE owner_id IN ($1:csv)',[id]);
    }

    async delete(id) {
        return this.db.result('DELETE FROM client_grant_type WHERE owner_id = $1', +id, r => r.rowCount);
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



module.exports = ClientGrantTypeRepository;
