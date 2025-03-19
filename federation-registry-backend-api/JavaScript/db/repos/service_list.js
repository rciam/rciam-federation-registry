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
      disable_petitions:'',
      owner_filter_petition:'',
      owner_filter_services:'',
      tags_filter_services:'',
      tags_filter_petitions:'',
      get_tags_filter:'',
      service_id_filter:'',
      created_before_filter:'',
      created_after_filter:'',
      hide_comments:''
    };

    params.hide_comments = !req.user.role.actions.includes('review_petition'); 

    if(req.user.role.actions.includes('manage_tags')){
      params.get_tags_filter = ",'tags',foo.tags"
    }
    if(req.query.tags&&req.user.role.actions.includes('manage_tags')){
      req.query.tags = req.query.tags.split(',');
      params.tags_filter_services = ' AND ('
      req.query.tags.forEach((tag,index)=>{
        if(index>0){
          params.tags_filter_services = params.tags_filter_services + " OR"  
        }
        params.tags_filter_services = params.tags_filter_services + " '"+ tag +"' = ANY(tags)"
      });
      params.tags_filter_services = params.tags_filter_services + ')'
    }

    if(req.query.created_before){
      params.created_before_filter = "AND created_at < '" + req.query.created_before + "'";
      params.disable_petitions = "AND false";

    }
    if(req.query.created_after){
      params.created_after_filter = "AND created_at > '" + req.query.created_after + "'";
      params.disable_petitions = "AND false";      
    }

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
      params.search_filter_services = "AND (service_name ILIKE '%"+req.query.search_string +"%' OR client_id ILIKE '%"+req.query.search_string +"%' OR entity_id ILIKE '%"+req.query.search_string+"%')";
      params.search_filter_petitions = "WHERE (service_name ILIKE '%"+req.query.search_string +"%' OR client_id ILIKE '%"+req.query.search_string +"%' OR entity_id ILIKE '%"+req.query.search_string+"%')";
    }

    if(req.query.env){
      params.integration_environment_filter = "AND integration_environment='" + req.query.env + "'"
    }

    if(req.query.error){
      params.disable_petitions = "AND false";
      params.error_filter_services = "AND state='error'";
    }
    if(req.query.service_id){
      params.disable_petitions = "AND false";
      params.service_id_filter = "AND service_id=" + req.query.service_id;
    }

    if(req.query.pending_sub){
      params.pending_sub_filter = "AND status='"+ req.query.pending_sub+"'";
    }
    
    if(req.query.orphan){
      params.orphan_filter_services = ' AND orphan=true';
      params.orphan_filter_petitions = params.search_filter_petitions?' AND orphan=true':' WHERE orphan=true';
    }
    // Tracks if a petition filter is active 
    let petition_filter =false;
    if(req.query.owned){
      params.select_own_service = select_own_service_1 + req.user.sub + select_own_service_2;
      params.select_own_petition = "WHERE group_subs.sub = '"+ req.user.sub +"'";
      petition_filter = true
      
    }
    else{
      params.select_all = select_all_1 + req.user.sub + select_all_2
    }

    if(req.query.owner){
      if(petition_filter){
        params.owner_filter_petition = " AND (preferred_username ILIKE '%"+req.query.owner +"%'  OR email ILIKE '%"+ req.query.owner +"%')"
      }
      else{
        params.owner_filter_petition = " WHERE (preferred_username ILIKE '%"+req.query.owner +"%'  OR email ILIKE '%"+ req.query.owner +"%')"
      }
      petition_filter = true;
    }

    if(req.query.tags&&req.user.role.actions.includes('manage_tags') ){
      if(petition_filter){
        params.tags_filter_petitions = ' AND false';
      }
      else{
        params.tags_filter_petitions = ' WHERE false'
      }
      petition_filter = true;
    }

    if(req.query.pending){
      if(req.query.waiting_deployment){
        params.pending_filter= "AND (petition_id IS NOT NULL OR state='waiting-deployment')"

      }
      else{
        params.pending_filter= 'AND petition_id IS NOT NULL'                
      }
    }
    else {
      if(req.query.waiting_deployment){
        params.pending_filter= "AND state='waiting-deployment'"
        params.disable_petitions = "AND false";
      }
    }
    
    params.tenant_name = req.params.tenant;
    params.sub = req.user.sub;
    if(req.query.limit){
      params.limit= "LIMIT "+ parseInt(req.query.limit);
    }
    else{
      params.limit= "";
    }
    if(req.query.page&&req.query.page!=1&&req.query.limit&&parseInt(req.query.limit)){
      params.offset = (req.query.page-1) * parseInt(req.query.limit);
    }
    else {
      params.offset = 0;
    }
    const query = this.pgp.as.format(sql.getList,params);
    return await this.db.any(query);


  }


}

module.exports = ServiceListRepository;
