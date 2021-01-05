const merge_services_and_petitions = (services,petitions) => {


  petitions.map((item,index)=>{
    if(item.type==="create"){
      item.petition_id=item.id;
      delete item.service_id;
      delete item.id
      services.push(item);
    }
    else if(item.type==="edit"||item.type==="delete"){
      let key = services.findIndex(element=>element.id==item.service_id);
      services[key].type = item.type;
      services[key].petition_id = item.id;
      services[key].comment = item.comment;
      services[key].status = item.status;
    }
  })


  return services
}

const merge_data = (connections,data,property) => {
  let multiple_connections = Array.isArray(connections);
  let values = [];
  let insert_index = 0;
  current_id = data[0].owner_id;
  data.map((item,index)=>{
    if(current_id===item.owner_id){
      if(property=='contacts'){
        values.push({email:item.value,type:item.type});
      }
      else{
      values.push(item.value);
      }
    }
    else {
      if (multiple_connections){
        connections[insert_index][property] = values;
        connections[insert_index]['generate_client_secret'] = false;
      }
      else {
        connections[property] = values;
        connections['generate_client_secret'] = false;
      }


      insert_index++;
      current_id=item.owner_id;
      values=[];
      values.push(item.value);
    }
  })
  if (Array.isArray(multiple_connections)){
    connections[insert_index][property] = values;
    connections[insert_index]['generate_client_secret'] = false;
  }
  else {
    connections[property] = values;
    connections['generate_client_secret'] = false;
  }


  return connections
}


module.exports = {
  merge_data,
  merge_services_and_petitions
}
