
let cs= {};

class ServiceMultiValuedRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
    cs = new pgp.helpers.ColumnSet(['owner_id','value']);
  }

  async addMultiple(data,table){
    const query = this.pgp.helpers.insert(data,cs,table);
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
    if(data.length>0){
      data.forEach((item)=>{
        values.push({owner_id:id,value:item});
      });
      const query = this.pgp.helpers.insert(values, cs,name);
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
    if(data.length>0){

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







  // Not yet implemented
  //        ||
  //        ||
  //        ||
  //      \\||//
  //        \/







}

module.exports = ServiceMultiValuedRepository;
