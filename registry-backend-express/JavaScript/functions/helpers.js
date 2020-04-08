var diff = require('deep-diff').diff;

const calcDiff = (oldState,newState) => {
    var new_values = Object.assign({},newState);
    var old_values = Object.assign({},oldState);
    let new_cont = [];
    let old_cont = [];
    let items;
    var edits = {
      add:{},
      dlt:{},
      details:{}
    };
    console.log(new_values);

    new_values.contacts.forEach(item=>{
      new_cont.push(item.email+' '+item.type);
    });
    old_values.contacts.forEach(item=>{
      old_cont.push(item.email+' '+item.type);
    });
    edits.add.contacts = new_cont.filter(x=>!old_cont.includes(x));
    edits.dlt.contacts = old_cont.filter(x=>!new_cont.includes(x));
    if(edits.add.contacts.length>0){
        edits.add.contacts.forEach((item,index)=>{
          items = item.split(' ');
          edits.add.contacts[index] = {email:items[0],type:items[1]};
        })
    }
    if(edits.dlt.contacts.length>0){
        edits.dlt.contacts.forEach((item,index)=>{
          items = item.split(' ');
          edits.dlt.contacts[index] = {email:items[0],type:items[1]};
      })
    }

    edits.add.oidc_grant_types = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
    edits.dlt.oidc_grant_types = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
    edits.add.oidc_scopes = new_values.scope.filter(x=>!old_values.scope.includes(x));
    edits.dlt.oidc_scopes = old_values.scope.filter(x=>!new_values.scope.includes(x));
    edits.add.oidc_redirect_uris = new_values.redirect_uris.filter(x=>!old_values.redirect_uris.includes(x));
    edits.dlt.oidc_redirect_uris = old_values.redirect_uris.filter(x=>!new_values.redirect_uris.includes(x));
    for(var i in edits){
      for(var key in edits[i]){
        if(edits[i][key].length===0){
          delete edits[i][key]
        }
      }
    }
    delete new_values.grant_types;
    delete new_values.contacts;
    delete new_values.redirect_uris;
    delete new_values.scope;
    delete old_values.grant_types;
    delete old_values.contacts;
    delete old_values.redirect_uris;
    delete old_values.scope;
    if(diff(old_values,new_values)){
      edits.details = new_values;
    }
    return edits
}


const addToString = (str,value) =>{
  let sentence='';
  const words = str.split('_');
  words.forEach((item,index)=>{
    if(index==1){
      sentence = sentence + value + '_';
    }
    sentence=sentence + item +'_';
  });
  sentence = sentence.slice(0,-1);
  return sentence
}



module.exports = {
  calcDiff,
  addToString
}
