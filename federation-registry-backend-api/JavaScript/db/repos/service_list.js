const sql = require('../sql').service_list;

const select_own_service_1 = "(SELECT id AS group_id,true AS owned,CASE WHEN group_manager IS NULL then false ELSE group_manager END FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub='"
const select_own_service_2 = "') AS group_ids LEFT JOIN";
const select_all_1 = "LEFT JOIN (SELECT id AS group_id,true AS owned,CASE WHEN group_manager IS NULL then false ELSE group_manager END FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub='"
const select_all_2 = "') AS group_ids";
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

  async get(req){
    let params = {
      select_all:'',
      select_own_service:'',
      protocol_filter:'',
      search_filter:'',
      integration_environment_filter:'',
      select_own_petition:'',
      pending_filter:''
    };
    if(req.query.protocol){
      params.protocol_filter = "AND protocol='" + req.query.protocol+"'";
    }
    if(req.query.search_string){
      params.search_filter = "AND service_name ILIKE '%"+ req.query.search_string + "%'";
    }
    if(req.query.env){
      params.integration_environment_filter = "AND integration_environment='" + req.query.env + "'"
    }
    if(req.query.owned){
      params.select_own_service = select_own_service_1 + req.user.sub + select_own_service_2;
      params.select_own_petition = "WHERE group_subs.sub = '"+ req.user.sub +"'";
    }
    else{
      params.select_all = select_all_1 + req.user.sub + select_all_2
    }
    if(req.query.pending){
      params.pending_filter= 'AND petition_id IS NOT NULL'
    }
    params.tenant_name = req.params.name;
    params.sub = req.user.sub;
    if(req.query.limit){
      params.limit= parseInt(req.query.limit);
    }
    else{
      params.limit= 10;
    }
    if(req.query.page&&req.query.page!=1){
      params.offset = (req.query.page-1) * params.limit;
    }
    else {
      params.offset = 0;
    }

    return this.db.any(sql.getList,params);

  }


}

module.exports = ServiceListRepository;
