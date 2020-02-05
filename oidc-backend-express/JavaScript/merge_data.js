
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
  merge_data
}
