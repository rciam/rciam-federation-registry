
const cs = {};

class UserRoleRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }

  async getRole(entitlements,tenant) {
    let role= {};
    if(entitlements.length===0){
      entitlements = ['no_entitlements'];
    }
    return this.db.any('SELECT role_name,id,entitlement FROM (user_roles LEFT JOIN role_entitlements on user_roles.id=role_entitlements.role_id) WHERE tenant_id=$1 AND (entitlement IN ($2:csv) OR entitlement IS NULL)', [+tenant,entitlements]).then(res => {
      if(res.length>1){
        res.forEach((item)=>{
          if(item.entitlement){
            role.name = item.role_name;
            role.id = item.id;
          }
        })
      }
      else{
        role.name = res[0].role_name;
        role.id = res[0].id;
      }
      return {success:true,role:role}
    }).catch(err => {
      return {success:false, err:err}
    });
  }

  async getRoleActions(entitlements,tenant) {
    let role= {};
    if(!entitlements ||entitlements.length===0){
      entitlements = ['no_entitlements'];
    }
    return this.db.any('SELECT role_name,id,entitlement,ARRAY_AGG(action) actions FROM (SELECT role_name,id,entitlement FROM (user_roles LEFT JOIN role_entitlements on user_roles.id=role_entitlements.role_id) WHERE tenant=$1 AND (entitlement IN ($2:csv) OR entitlement IS NULL)) as roles LEFT JOIN role_actions ON roles.id = role_actions.role_id GROUP BY roles.role_name, roles.id, roles.entitlement', [tenant,entitlements]).then(res => {
      if(res.length>1){
        res.forEach((item)=>{
          if(item.entitlement){
            role.name = item.role_name;
            role.id = item.id;
            role.actions = item.actions;
          }
        })
      }
      else{
        role.name = res[0].role_name;
        role.id = res[0].id;
        role.actions = res[0].actions;
      }
      return {success:true,role:role}
    }).catch(err => {
      return {success:false, err:err}
    });
  }


  async getActions(role_id) {
    return this.db.any('SELECT action FROM role_actions WHERE role_id=$1',role_id).then(res=>{
      return res;
    })
  }
}



module.exports = UserRoleRepository;
