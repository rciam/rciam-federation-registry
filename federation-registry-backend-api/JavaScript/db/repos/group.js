const sql = require('../sql').group;
const {v1:uuidv1} = require('uuid');
let cs = {};
const {newMemberNotificationMail} = require('../../functions/helpers.js');
class GroupRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      cs = new pgp.helpers.ColumnSet(['group_name']);
  }

  async getMembers(group_id){
    return this.db.any(sql.getGroupMembers,{group_id: +group_id}).then(members => {return members});
  }

  async newMemberNotification(invitation_data){
    this.db.any(sql.getGroupManagers,{group_id: +invitation_data.group_id}).then(managers => {
      newMemberNotificationMail(invitation_data,managers)
    });
  }

  async createMultiple(services){
    let group_names = [];
    for(var i=0;i<services.length;i++){
      group_names.push({group_name:uuidv1()});
    }
    const query = this.pgp.helpers.insert(group_names,cs,'groups')+" RETURNING id";
    return this.db.any(query).then(data => {
        return data
    })
    .catch(error => {
        throw error
    });
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

  async deleteSub(sub,group_id){
    return this.db.task('delete-group-sub',t=>{
      return t.any('SELECT COUNT(*) FROM group_subs WHERE group_manager=true AND group_id=$1 AND sub!=$2',[+group_id,sub]).then(res=>{
        if(res){
          if(res[0].count>0){
            return t.oneOrNone('DELETE FROM group_subs WHERE group_id=$1 AND sub=$2 RETURNING sub',[+group_id,sub]);
          }
          else{
            return false;
          }

        }
      })
    })
  }

  async addMember(data){
    return this.db.one('INSERT INTO group_subs (sub,group_manager,group_id) VALUES($1,$2,$3) RETURNING sub',[data.sub,data.group_manager,+data.group_id]);
  }

  async isGroupMember(sub,group_id){
    return this.db.oneOrNone('SELECT EXISTS(SELECT 1 FROM group_subs WHERE sub=$1 AND group_id=$2)',[sub,+group_id]);
  }

  async isGroupManager(sub,group_id){
    return this.db.oneOrNone('SELECT group_manager FROM group_subs WHERE sub=$1 AND group_id=$2',[sub,+group_id]).then(res=>{if(res&&res.group_manager){return true}else{return false} });
  }

}



module.exports = GroupRepository;
