const cs = {};

class InvitationRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }


  async add(data){
    return this.db.one('INSERT INTO invitations(code,group_manager,group_id,email) VALUES($1,$2,$3,$4) RETURNING code',[data.code,data.group_manager,data.group_id,data.email]).then(async res =>{
      if(res){
        return res.code;
      }
      else{
        return false
      }
    });
  }

  async setUser(code,sub,email){
    return this.db.one('UPDATE invitations SET code=NULL,sub=$1,email=$2 WHERE code=$3 RETURNING id',[sub,email,code]);
  }

  async deleteToken(code){
    return this.db.one('DELETE FROM tokens WHERE code=$1 RETURNING code',code);
  }
  async addToken(token){
    let code = uuidv1();
    return this.db.one('INSERT INTO tokens(code,token) VALUES ($1,$2) RETURNING code',[code,token]);
  }
}



module.exports = InvitationRepository;
