const cs = {};

class InvitationRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }


  async add(data){
    return this.db.one('INSERT INTO invitations(code,group_manager,group_id,email,invited_by) VALUES($1,$2,$3,$4,$5) RETURNING code',[data.code,data.group_manager,+data.group_id,data.email,data.invited_by]).then(async res =>{
      if(res){
        return res.code;
      }
      else{
        return false;
      }
    });
  }

  async get(sub){
    return this.db.any('SELECT id,group_manager,invited_by FROM invitations WHERE sub=$1',sub);
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
    return this.db.one('UPDATE invitations SET code=NULL,sub=$1,email=$2 WHERE code=$3 RETURNING id',[sub,email,code]);
  }


}



module.exports = InvitationRepository;
