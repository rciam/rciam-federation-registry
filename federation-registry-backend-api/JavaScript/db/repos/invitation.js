const cs = {};
const sql = require('../sql').invitations;
var config = require('../../config');
const {v1:uuidv1} = require('uuid');
class InvitationRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     //cs.update_multi = new pgp.helpers.ColumnSet(['?id','state',{name: 'last_edited', mod: '^', def: 'CURRENT_TIMESTAMP'}],{table:'service_state'});
     cs.insert_multi = new pgp.helpers.ColumnSet(['code','group_manager','group_id','email',{name:'invited_by',def:'Federation Registry'},{name: 'date', mod: '^', def: 'CURRENT_TIMESTAMP'},'tenant'],{table:'invitations'});
  }
  async addMultiple(invitation_data){
    
      const insert = this.pgp.helpers.insert(invitation_data,cs.insert_multi)+'RETURNING *';
      return await this.db.any(insert).then((result)=>{
        if(result.length===invitation_data.length){
          return true
        }
        else{
          throw 'Could not add invitations';
        }
      });

  }
  async add(data){
    let date = new Date(Date.now());
    return this.db.one('INSERT INTO invitations(code,group_manager,group_id,email,invited_by,date,tenant) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING code',[data.code,data.group_manager,+data.group_id,data.email,data.invited_by,date,data.tenant]).then(async res =>{
      if(res){
        return res.code;
      }
      else{
        return false;
      }
    }).catch(err=>{
      console.log(err);
      throw err;
    });
  }
  async refresh(id){
    let date = new Date(Date.now());
    return this.db.oneOrNone('UPDATE invitations SET date=$1 WHERE id=$2 AND sub IS NULL returning *',[date,+id]);
  }

  async getAll(sub,tenant){
    let date = new Date(Date.now());
    return this.db.any(sql.getAll,{sub: sub,tenant:tenant});
  }

  async getOne(id,sub,tenant){
    return this.db.oneOrNone(sql.getOne,{sub: sub,id:+id,tenant:tenant});
  }

  async reject(id,sub,tenant){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 AND sub=$2 AND tenant=$3 RETURNING id',[+id,sub,tenant]);
  }

  async delete(id,tenant){
    return this.db.oneOrNone('DELETE FROM invitations WHERE id=$1 RETURNING id',[+id,tenant]);
  }

  async get(group_id){
    let date = new Date(Date.now());
    return this.db.any(sql.get,{group_id:+group_id,now:date,validity_seconds:+config.invitation_validity_seconds});
  }

  async setUser(code,sub,tenant){
    let date2 = new Date(Date.now());
    return this.db.task('set-user',async t=>{
      return await t.oneOrNone('SELECT date,groups.group_id FROM (SELECT date,group_id FROM invitations WHERE code=$1 AND tenant=$3) as invitation LEFT JOIN (SELECT group_id FROM group_subs WHERE sub=$2) AS groups USING (group_id)',[code,sub,tenant]).then(res=>{
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
