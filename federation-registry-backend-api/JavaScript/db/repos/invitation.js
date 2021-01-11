const cs = {};
const sql = require('../sql').invitations;
var config = require('../../config');
const {v1:uuidv1} = require('uuid');
class InvitationRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }


  async add(data){
    let date = new Date(Date.now());
    return this.db.one('INSERT INTO invitations(code,group_manager,group_id,email,invited_by,date) VALUES($1,$2,$3,$4,$5,$6) RETURNING code',[data.code,data.group_manager,+data.group_id,data.email,data.invited_by,date]).then(async res =>{
      if(res){
        return res.code;
      }
      else{
        return false;
      }
    });
  }
  async refresh(id){
    let date = new Date(Date.now());
    return this.db.oneOrNone('UPDATE invitations SET date=$1 WHERE id=$2 AND sub IS NULL returning *',[date,+id]);
  }

  async getAll(sub){
    let date = new Date(Date.now());
    return this.db.any(sql.getAll,{sub: sub});
  }

  async getOne(id,sub){
    return this.db.oneOrNone(sql.getOne,{sub: sub,id:+id});
  }

  async reject(id,sub){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 AND sub=$2 RETURNING id',[+id,sub]);
  }

  async delete(id){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 RETURNING id',+id);
  }

  async get(group_id){
    let date = new Date(Date.now());
    return this.db.any(sql.get,{group_id:+group_id,now:date,validity_seconds:+config.invitation_validity_seconds});
  }

  async setUser(code,sub){
    let date2 = new Date(Date.now());
    return this.db.task('set-user',async t=>{
      return await t.oneOrNone('SELECT date,groups.group_id FROM (SELECT date,group_id FROM invitations WHERE code=$1) as invitation LEFT JOIN (SELECT group_id FROM group_subs WHERE sub=$2) AS groups USING (group_id)',[code,sub]).then(res=>{
        if(res){
          if(res.group_id){
            return {success:false,error:'member'}

          }
          const diffTime = Math.abs(date2 - res.date);

          const diffSeconds = Math.ceil(diffTime / (1000));
          if(diffSeconds>config.invitation_validity_seconds){
            return {success:false,error:'expired'}
          }
          else{
            return t.oneOrNone('UPDATE invitations SET code=NULL,sub=$1 WHERE code=$2 RETURNING id',[sub,code]).then(res=>{
              if(res){
                return {success:true,id:res.id}
              }
            });
          }
        }
        else{
          return {success:false}
        }
      })
    })
  }

}



module.exports = InvitationRepository;
