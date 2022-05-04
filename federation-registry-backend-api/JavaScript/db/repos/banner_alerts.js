const e = require("express");

//const sql = require('../sql').group;
let cs = {};
class BannerAlerts {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
  }
   isInt (value){
    return !isNaN(value) && 
           parseInt(Number(value)) == value && 
           !isNaN(parseInt(value, 10));
  }
  
  async getAll(tenant,active){
    let active_selector = active?"AND active=true":"";
    const query = this.pgp.as.format('SELECT alert_message,type,priority,active,id from banner_alerts WHERE tenant=$1 $2:raw ORDER BY priority DESC',[tenant,active_selector])
    return await this.db.any(query);
  }
  async update(id,tenant,body){
    let my_column_set = [];
    'active' in body && my_column_set.push('active');
    'priority' in body && my_column_set.push('priority');
    'alert_message' in body && my_column_set.push('alert_message');
    'type' in body && my_column_set.push('type');
    if(my_column_set.length>0){
      const cs = new this.pgp.helpers.ColumnSet(my_column_set, {table: 'banner_alerts'});
      let query = this.pgp.helpers.update(body, cs) + ' WHERE id =' +id + " AND tenant='"+tenant+"' RETURNING id";
      return await this.db.oneOrNone(query).then(result=>{
        if(result){
          return result.id
        }else{
          return false
        }
      })
    }
    else{
      return false
    }
  }

  async delete(tenant,id){
    return await this.db.oneOrNone('DELETE from banner_alerts WHERE tenant=$1 AND id=$2 RETURNING id',[tenant,+id]);
  }

  async add(tenant,body){
    let my_culumn_set = ['type','alert_message','tenant'];
    'active' in body && my_culumn_set.push('active');
    'priority' in body && my_culumn_set.push('priority');
    body.tenant = tenant;    
    let query = this.pgp.helpers.insert(body, my_culumn_set, 'banner_alerts')+ ' RETURNING id';
    return await this.db.oneOrNone(query).then(result => {
      if(result){
        return result.id
      }
      else{
        return false
      }
    })
  }
  

}



module.exports = BannerAlerts;
