
let cs= {};

class ClientGeneralRepository {
  constructor(db,pgp){
    this.db = db;
    this.pgp = pgp;
    // set-up all ColumnSet objects, if needed:
     cs = new pgp.helpers.ColumnSet(['owner_id','value','type','created_at','is_deleted'],{table:'client_contact'});
  }

  async findByConnectionId(id){
    return this.db.any('SELECT owner_id,value,type FROM client_contact WHERE owner_id=$1 AND is_deleted=false',[+id]);
  }
  async delete(owner_id){
      let date = new Date(Date.now());
      return this.db.none('UPDATE client_contact SET is_deleted=true,deleted_at=$2 WHERE owner_id = $1',[+owner_id,date]);
  }

  // edit not yet implemented
  async delete_one_or_many(data,owner_id){
    let date = new Date(Date.now());
    let values=[];

    if (data.length>0){
      data.forEach((item)=>{
        values.push({owner_id:parseInt(owner_id),value:item.email,type:item.type,is_deleted:true})
      })
      const query = this.pgp.helpers.update(values, ['?owner_id', '?value', '?type','is_deleted'], 'client_contact') + ' WHERE v.owner_id = t.owner_id AND v.value=t.value AND v.type = t.type';
      await this.db.none(query).then((value) => {return this.db.none('UPDATE client_contact SET deleted_at=$2 WHERE owner_id = $1 AND is_deleted=true AND deleted_at IS NULL ',[+owner_id,date]);})


    }
    else {
      return null
    }
  }



  async add(data,id){
    let values = []
    let date = new Date(Date.now());
    // if not Empty array
    if(data.length>0){

      data.forEach((item)=>{
        values.push({owner_id:id,value:item.email,type:item.type,created_at:date,is_deleted:false,deleted_at:null})
      });

      const query = this.pgp.helpers.insert(values, cs);

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
