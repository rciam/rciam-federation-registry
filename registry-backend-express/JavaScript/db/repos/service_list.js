const sql = require('../sql').service_list;


class ServiceListRepository {
  constructor(db, pgp) {
      this.db = db;
      this.pgp = pgp;
      // set-up all ColumnSet objects, if needed:
  }
  async getOwn(sub,tenant_name){
    return this.db.any(sql.getOwnList,{sub:sub,tenant_name:tenant_name});
  }

  async getAll(sub,tenant_name){
    return this.db.any(sql.getAllList,{sub:sub,tenant_name:tenant_name});
  }

  async get(sub,admin){
    let services;
    return this.db.task('find-services', async t => {
      if(!admin){
        return await t.service_details.findBySubForList(sub).then(async response=>{
          if(response){
            services = response;
            return await t.service_petition_details.findBySubForList(sub).then(petitions=>{
              services = merge_services_and_petitions(services,petitions);
              return {success:true,services:services}
            }).catch(err=>{return {success:false,error:err}});
          }
          else {
            return {success:true,services:[]}
          }
        }).catch(err=>{return {success:false,error:err}});
      }
      else{
        return await t.service_details.findAllForList().then(async response=>{
          if(response){
            services = response;
            return await t.service_petition_details.findAllForList().then(petitions=>{
              services = merge_services_and_petitions(services,petitions);
              return {success:true,services:services}
            }).catch(err=>{return {success:false,error:err}});
          }
          else {
            return {success:true,services:[]}
          }
        }).catch(err=>{return {success:false,error:err}});
      }

    });
  }


}

module.exports = ServiceListRepository;
