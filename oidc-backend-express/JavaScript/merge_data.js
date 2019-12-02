
const merge_data = (connections,data,property) => {
  let values = [];
  let insert_index = 0;
  current_id = data[0].owner_id;
  data.map((item,index)=>{
    if(current_id===item.owner_id){
      values.push(item.value);
    }
    else {
      connections[insert_index][property] = values;
      insert_index++;
      current_id=item.owner_id;
      values=[];
      values.push(item.value);
    }
  })
  connections[insert_index][property] = values;


  return connections
}


module.exports = {
  merge_data
}
