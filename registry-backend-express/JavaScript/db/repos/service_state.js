const sql = require('../sql').service_state;
let cs= {};

class ServiceStateRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['id','state']);
  }

  async add(id,state){
    return this.db.any(sql.add,{
      id:+id,
      state:state
    });
  }
  async update(id,state){
    return this.db.any(sql.update,{
      id:+id,
      state:state
    })
  }






}

module.exports = ServiceStateRepository;
