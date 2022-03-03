
const cs = {};

class UserRoleRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }

  async getRole(entitlements,tenant) {
    let role= {};
    if(!entitlements||entitlements.length===0){
      entitlements = ['no_entitlements'];
    }
    const query = this.pgp.as.format('SELECT role_name, id FROM (SELECT role_name,id,entitlement FROM (user_roles LEFT JOIN role_entitlements on user_roles.id=role_entitlements.role_id) WHERE tenant=$1 AND (entitlement IN ($2:csv) OR entitlement IS NULL)) as roles ORDER BY id DESC LIMIT 1', [tenant,entitlements]);
    return this.db.one(query);
  }

  async getRoleActions(sub,tenant) {
    const query = this.pgp.as.format('SELECT role_name as name,role_id as id,ARRAY_AGG(action) actions FROM (SELECT role_id FROM user_info WHERE sub=$2 AND tenant=$1) as user_role LEFT JOIN role_actions USING(role_id) LEFT JOIN user_roles ON user_role.role_id=user_roles.id GROUP BY role_id,role_name', [tenant,sub]);
    return this.db.one(query).catch(err => {
      return null
    });
  }


  async getActions(role_id) {
    return this.db.any('SELECT action FROM role_actions WHERE role_id=$1',role_id).then(res=>{
      return res;
    })
  }
}



module.exports = UserRoleRepository;
