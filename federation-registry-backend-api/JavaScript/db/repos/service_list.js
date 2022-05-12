const sql = require('../sql').service_list;

const select_own_service_1 = "(SELECT id AS group_id,true AS owned,CASE WHEN group_manager IS NULL then false ELSE group_manager END FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub='"
const select_own_service_2 = "') AS group_ids LEFT JOIN";
const select_all_1 = "LEFT JOIN (SELECT id AS group_id,true AS owned,CASE WHEN group_manager IS NULL then false ELSE group_manager END FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub='"
const select_all_2 = "') AS group_ids";
const outdated_disable_petitions = 'AND 0=1'
const outdated_services = 'AND service_state.outdated = true'
const request_review_filter = "AND status='request_review'"

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
      search_filter_services:'',
      search_filter_petitions:'',
      integration_environment_filter:'',
      select_own_petition:'',
      pending_filter:'',
      outdated_disable_petitions:'',
      outdated_services:'',
      pending_sub_filter:'',
      orphan_filter_services:'',
      orphan_filter_petitions:'',
      error_filter_services:'',
      error_filter_petitions:'',
      owner_filter_petition:'',
      owner_filter_services:''
    };
    if(req.query.owner){
      params.owner_filter_services = "AND (preferred_username ILIKE '%"+req.query.owner +"%'  OR email ILIKE '%"+ req.query.owner +"%')";
    }
    if(req.query.outdated){
      params.outdated_disable_petitions = outdated_disable_petitions;
      params.outdated_services = outdated_services;
    }
    if(req.query.protocol){
      params.protocol_filter = "AND protocol='" + req.query.protocol+"'";
    }
    if(req.query.search_string){
      params.search_filter_services = "AND (service_name ILIKE '%"+req.query.search_string +"%' OR client_id ILIKE '%"+req.query.search_string +"%')";
      params.search_filter_petitions = "WHERE (service_name ILIKE '%"+req.query.search_string +"%' OR client_id ILIKE '%"+req.query.search_string +"%')";
    }
    if(req.query.env){
      params.integration_environment_filter = "AND integration_environment='" + req.query.env + "'"
    }
    if(req.query.error){
      params.error_filter_petitions = "AND false";
      params.error_filter_services = "AND state='error'";
    }

    if(req.query.pending_sub){
      params.pending_sub_filter = "AND status='"+ req.query.pending_sub+"'";
    }
    if(req.query.orphan){
      params.orphan_filter_services = ' AND orphan=true';
      params.orphan_filter_petitions = params.search_filter_petitions?' AND orphan=true':' WHERE orphan=true';
    }

    if(req.query.owned){
      params.select_own_service = select_own_service_1 + req.user.sub + select_own_service_2;
      params.select_own_petition = "WHERE group_subs.sub = '"+ req.user.sub +"'";
      if(req.query.owner){
        params.owner_filter_petition = "AND (preferred_username ILIKE '%"+req.query.owner +"%'  OR email ILIKE '%"+ req.query.owner +"%')"
      }
    }
    else{
      if(req.query.owner){
        params.owner_filter_petition = "WHERE (preferred_username ILIKE '%"+req.query.owner +"%'  OR email ILIKE '%"+ req.query.owner +"%')"
      }
      params.select_all = select_all_1 + req.user.sub + select_all_2
    }
    if(req.query.pending){
      params.pending_filter= 'AND petition_id IS NOT NULL'
    }
    params.tenant_name = req.params.tenant;
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
    const query = this.pgp.as.format(sql.getList,params);
    return await this.db.any(query);


  }


}

module.exports = ServiceListRepository;
