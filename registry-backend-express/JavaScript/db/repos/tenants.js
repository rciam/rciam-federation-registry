const cs = {};

class TenantsRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }

  async getTheme(tenant_name){
    return this.db.oneOrNone('SELECT name,logo,main_title,color,description FROM tenants WHERE name=$1',tenant_name);
  }

  async getInit(){
    return this.db.any('SELECT name,client_id,client_secret,issuer_url FROM tenants');
  }

}



module.exports = TenantsRepository;
