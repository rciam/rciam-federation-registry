const {v1:uuidv1} = require('uuid');
const cs = {};

class TokensRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
  }

  async getToken(code){
    return this.db.oneOrNone('SELECT token,id_token FROM tokens WHERE code=$1',code);
  }
  async deleteToken(code){
    return this.db.one('DELETE FROM tokens WHERE code=$1 RETURNING code',code);
  }
  async addToken(token,id_token){
    let code = uuidv1();
    return this.db.one('INSERT INTO tokens(code,token,id_token) VALUES ($1,$2,$3) RETURNING code',[code,token,id_token]);
  }
}



module.exports = TokensRepository;
