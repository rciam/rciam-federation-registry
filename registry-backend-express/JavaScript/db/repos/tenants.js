//const sql = require('../sql').group;
const cs = {};
//var config = require('../../config');
//const {newMemberNotificationMail} = require('../../functions/helpers.js');
class TenantsRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }

  async getTheme(tenant_name){
    return this.db.oneOrNone('SELECT name,logo,main_title,color,description FROM tenants WHERE name=$1',tenant_name);
  }



}



module.exports = TenantsRepository;
