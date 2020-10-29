const sql = require('../sql').user_info;
const cs = {};

class UserInfoRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;

      // set-up all ColumnSet objects, if needed:
      createColumnsets(pgp);
  }
  async findBySub(sub,tenant) {
      return this.db.oneOrNone('SELECT * FROM user_info WHERE sub = $1 and tenant=$2', [sub,tenant]);
  }
  async add(data,tenant){
    return this.db.one(sql.add,{
      sub: data.sub,
      preferred_username: data.preferred_username,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      email: data.email,
      tenant: tenant
    }).then(res=>{

      return res
    })
  }
}


function createColumnsets(pgp) {
    // create all ColumnSet objects only once:
    if (!cs.insert) {
        // Type TableName is useful when schema isn't default "public" ,
        // otherwise you can just pass in a string for the table name.
        const table = new pgp.helpers.TableName({table: 'user_info', schema: 'public'});

        cs.insert = new pgp.helpers.ColumnSet(['sub','preferred_username','name',
          'given_name','family_name','email'],
          {table});
        cs.update = cs.insert.extend(['?id']);
    }
    return cs;
}

module.exports = UserInfoRepository;
