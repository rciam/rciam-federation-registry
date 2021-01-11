

let cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class ServiceErrorsRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;
        const table = new pgp.helpers.TableName({table: 'service_errors', schema: 'public'});
        // set-up all ColumnSet objects, if needed:
        cs.insert = new pgp.helpers.ColumnSet(['error_description','error_code','service_id','date'],{table});


    }

    async add(errors){
      const query = this.pgp.helpers.insert(errors,cs.insert);
      let stuff = await this.db.any(query);
      return true
    }

    async getErrorByServiceId(id){
      return this.db.oneOrNone('SELECT date as error_date,error_code,error_description FROM service_errors WHERE service_id=$1 AND archived=false',+id);
    }

    async archive(id){
      return this.db.one('UPDATE service_errors SET archived=true WHERE service_id=$1 RETURNING service_id',+id);
    }


}

//////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:



module.exports = ServiceErrorsRepository;
