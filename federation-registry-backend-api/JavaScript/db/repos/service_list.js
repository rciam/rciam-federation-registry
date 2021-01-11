const sql = require('../sql').service_list;


class ServiceListRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      // set-up all ColumnSet objects, if needed:
  }
  async getOwn(sub,tenant_name){
    return this.db.any(sql.getOwnList,{sub:sub,tenant_name:tenant_name});
  }

  async getAll(sub,tenant_name){
    return this.db.any(sql.getAllList,{sub:sub,tenant_name:tenant_name});
  }

  

}

module.exports = ServiceListRepository;
