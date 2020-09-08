const cs = {};
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

  async get(sub){
    return this.db.any('SELECT id,group_manager,invited_by,date FROM invitations WHERE sub=$1',sub);
  }

  async getOne(id,sub){
    return this.db.oneOrNone('SELECT group_id,invitation_mail,preferred_username,email,sub,group_manager FROM (SELECT group_id,sub,group_manager,email as invitation_mail FROM invitations WHERE id=$1 and sub=$2) as invitation LEFT JOIN user_info USING (sub)',[+id,sub]);
  }

  async reject(id,sub){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 AND sub=$2 RETURNING id',[+id,sub]);
  }

  async delete(id){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 RETURNING id',+id);
  }

  async setUser(code,sub){
    let date2 = new Date(Date.now());
    return this.db.oneOrNone('SELECT date FROM invitations WHERE code=$1',code).then(res=>{
      if(res){
        const diffTime = Math.abs(date2 - res.date);
        const diffMinutes = Math.ceil(diffTime / (1000 * 60 * 60));
        if(diffMinutes>3){
          return {success:false,expired:true}
        }
        else{
          return this.db.oneOrNone('UPDATE invitations SET code=NULL,sub=$1 WHERE code=$2 RETURNING id',[sub,code]).then(res=>{
            if(res){
              return {success:true}
            }
          });
        }
      }
      else{
        return {success:false}
      }
    })
  }

}



module.exports = InvitationRepository;
