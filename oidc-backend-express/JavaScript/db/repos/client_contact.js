
let cs= {};

class ClientGeneralRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['owner_id','value','type','created_at','is_deleted']);
  }

  async findByConnectionId(name,id){
    const table = new this.pgp.helpers.TableName({table:name});
    return this.db.any('SELECT owner_id,value,type FROM $1 WHERE owner_id IN ($2:csv) AND is_deleted=false',[table,id]);
  }
  async delete(name,owner_id){
      let date = new Date(Date.now());
      return this.db.none('UPDATE $1 SET is_deleted=true,deleted_at=$3 WHERE owner_id = $2',[name,+owner_id,date]);
  }

  // edit not yet implemented
  async delete_one_or_many(name,data,owner_id){
    const table = new this.pgp.helpers.TableName({table:name});
    let date = new Date(Date.now());
    return this.db.none('UPDATE $1 SET is_deleted=true,deleted_at=$4 WHERE owner_id = $2 AND value IN ($3:csv)',[table,+owner_id,data,date])
  }
  async add(name,data,id){
    let values = []
    let date = new Date(Date.now());
    // if not Empty array
    if(data.length>0){
      data.forEach((item)=>{
        values.push({owner_id:id,value:item.email,type:item.type,created_at:date,is_deleted:false,deleted_at:null})
      });

      const query = this.pgp.helpers.insert(values, cs,name);

      this.db.none(query)
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

}

module.exports = ClientGeneralRepository;
