const sql = require('../sql').group;
const cs = {};

class GroupRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }
  async getMembers(group_id){
    return this.db.any(sql.getGroupMembers,{group_id: +group_id}).then(res => {return res});
  }

  async addGroup(sub){
    return this.db.one('INSERT INTO groups(group_name) VALUES($1) RETURNING id',sub).then(async res =>{
      if(res){
        return await this.db.one('INSERT INTO group_subs(group_id,sub,group_manager) VALUES($1,$2,true) RETURNING group_id',[+res.id,sub]).then(res=>{
          if(res){
            return res.group_id
          }
        })
      }
    })
  }
  async addMember(data){
    return this.db.one('INSERT INTO group_subs (sub,group_manager,group_id) VALUES($1,$2,$3) RETURNING sub',[data.sub,data.group_manager,+data.group_id]);
  }

  async isGroupManager(sub,group_id){
    return this.db.oneOrNone('SELECT group_manager FROM group_subs WHERE sub=$1 AND group_id=$2',[sub,+group_id]).then(res=>{if(res&&res.group_manager){return true}else{return false} });
  }

}



module.exports = GroupRepository;
