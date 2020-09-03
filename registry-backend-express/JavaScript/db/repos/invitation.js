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
    return this.db.oneOrNone('SELECT group_id,sub,group_manager FROM invitations WHERE id=$1 and sub=$2',[+id,sub]);
  }

  async reject(id,sub){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 AND sub=$2 RETURNING id',[+id,sub]);
  }

  async delete(id){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 RETURNING id',+id);
  }

  async setUser(code,sub,email){
    return this.db.oneOrNone('UPDATE invitations SET code=NULL,sub=$1,email=$2 WHERE code=$3 RETURNING id',[sub,email,code]);
  }


}



module.exports = InvitationRepository;
