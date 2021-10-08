var config = require('../../config');
let cs= {};


class ServiceMultiValuedRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
    cs.multi = new pgp.helpers.ColumnSet(['owner_id','value']);
    cs.cocPet = new pgp.helpers.ColumnSet(['petition_id','name','value']);
    cs.cocSer = new pgp.helpers.ColumnSet(['service_id','name','value']);
    cs.cocSerUpd = new pgp.helpers.ColumnSet(['?service_id','?name','value'],{table:'service_coc'});
    cs.cocPetUpd = new pgp.helpers.ColumnSet(['?petition_id','?name','value'],{table:'service_petition_coc'});
  }

  async updateCoc(type,service,id){
    // updateData = [{id:1,state:'deployed'},{id:2,state:'deployed'},{id:3,state:'failed'}];
    let data = [];
    let upd_cs;
    id = parseInt(id);
    for(const property in service){
      if(Object.keys(config.form[service.tenant].code_of_condact).includes(property)){
        if(type==='petition'){
          data.push({petition_id:id,name:property,value:(service[property] === 'true')});
          upd_cs = cs.cocPetUpd;
        }
        else{
          data.push({service_id:id,name:property,value:(service[property] === 'true')});
          upd_cs = cs.cocSerUpd;
        }
      }
    }
    if(data.length>0){
      const query = this.pgp.helpers.update(data,upd_cs) + ' WHERE '+(type==='service'?'v.service_id = t.service_id ':'v.petition_id =t.petition_id ') +'and v.name = t.name RETURNING t.id';
      return this.db.any(query).then(data => {
        return true;
      })
    }else{
      return true;
    }
  }


  async addCoc(type,service,id){
    let data = [];
    let add_cs = {};
    let table_name;
    for(const property in service){
      if(Object.keys(config.form[service.tenant].code_of_condact).includes(property)){
        if(type==='petition'){
          data.push({petition_id:id,name:property,value:(service[property] === 'true')});
          add_cs = cs.cocPet;
          table_name = "service_petition_coc";
        }
        else{
          data.push({service_id:id,name:property,value:(service[property] === 'true')});
          add_cs = cs.cocSer;
          table_name = "service_coc";
        }
      }
    }
    if(data.length>0){
      const query = this.pgp.helpers.insert(data,add_cs,table_name);
      return this.db.none(query).then(data => {
        return true;
      })
    }else{
      return true;
    }
  }

  async addMultiple(data,table){
    const query = this.pgp.helpers.insert(data,cs.multi,table);
    return this.db.none(query).then(data => {
        return true
    })
    .catch(error => {
        throw error
    });
  }

  async add(type,attribute,data,id){

    let values = []
    let name = 'service_'
    if(type==='petition'){
      name = name + type + '_' + attribute;
    }
    else{
      name = name + attribute;
    }
    // if not Empty array
    if(data&&data.length>0){
      data.forEach((item)=>{
        values.push({owner_id:id,value:item});
      });

      const query = this.pgp.helpers.insert(values, cs.multi,name);
      return this.db.none(query)
      .then(data => {
          return 'success'
      })
      .catch(error => {
          return 'error'
      });
    }
    else{
      return null
    }

  }


  async findDataById(name,id){
    const table = new this.pgp.helpers.TableName({table:name});
    return this.db.any('SELECT owner_id,value FROM $1 WHERE owner_id IN ($2:csv)',[table,id]);
  }

  async delete_one_or_many(type,attribute,data,owner_id){
    let name = 'service_'
    if(type==='petition'){
      name = name + type + '_' + attribute;
    }
    else{
      name = name + attribute;
    }
    const table = new this.pgp.helpers.TableName({table:name});
    if(data&&data.length>0){

      return this.db.result('DELETE FROM $1 WHERE owner_id=$2 AND value IN ($3:csv)',[table,+owner_id,data]).then(result =>{
        // if(result.rowCount===data.length){
        //   return true
        // }
        // else{
        //   return false
        // }
        return result
      });
    }

  }
  async delete(name,owner_id){
      const table = new this.pgp.helpers.TableName({table:name});
      return this.db.none('DELETE FROM $1 WHERE owner_id=$2',[table,+owner_id]);
  }













}

module.exports = ServiceMultiValuedRepository;
