const sql = require('../sql').organizations;
const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */



class Organizations {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      // set-up all ColumnSet objects, if needed:
  }
  async getById(id){
    return this.db.oneOrNone(sql.getById,{id:+id}).then(organization=>{
      if(organization){
        return organization
      }
      else{
        return false;
      }
    });
  }

  async activate(organization_id){
    if(organization_id){
     return this.db.oneOrNone('UPDATE organizations SET active=true WHERE organization_id=$1',[+organization_id]);    
    }
    else{
      return true;
    }

  }
  async get(search_string,ror){
    if(search_string){
      search_string= " AND LOWER(name) ILIKE '%"+search_string.toLowerCase() +"%'";
    }
    else{
      search_string = '';
    }
    if(ror==='true'||ror===true){      
        search_string = search_string + " AND ror_id IS NULL" 
      }

    
    return this.db.any(sql.get,{search_string}).then(organizations=>{
      if(organizations){
        return organizations;
      }
      else{
        return false;
      }
    })
  }

async add(organization){
  return this.db.oneOrNone('SELECT organization_id from organizations WHERE name=$1',organization.organization_name).then(async res =>{
    if(res){
      return {exists:true,organization_id:res.organization_id}
    }
    else{
      return this.db.one(sql.add,{
        name: organization.organization_name,
        url: organization.organization_url,
        ror_id: organization.ror_id
      }).then(res=>{
        if(res){
          return {exists:false,organization_id:res.organization_id}
        }
        else{
          return false;
        }
      });

    }
  })
}

}




module.exports = Organizations;
