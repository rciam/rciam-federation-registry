
const axios = require('axios');
const base64 = require('base-64');
var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const options = {
  headers:{
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.KEY
}};
const amsBaseUrl = process.env.AMS + '/projects/' + process.env.PROJECT;
const amsProject = 'projects/' + process.env.PROJECT;
const amsKey = "?key=" +process.env.TOKEN;

let tenants = [];
let pubUrls = {};
let topics = [];
let setStateArray = [];
let subscriptions = {};
let agents;
let acl = {"authorized_users": ["andreas-koz"]};
var intervalID;
var setStateTask;

axios.get(process.env.EXPRESS+'/agent/get_agents',options)
.then(async function (response) {
   agents = response.data.agents;
   console.log("Configuring Ams...");
   for(var i=0;i<agents.length;i++){
     let currentTopic = process.env.ENV + '_' + agents[i].tenant+'_'+agents[i].entity_type+'_'+agents[i].type;
     let agentSub = process.env.ENV + '_' + agents[i].tenant + '_'+agents[i].entity_type + '_' + agents[i].entity_protocol + '_' + agents[i].type + '_' + agents[i].id
     //console.log(agentSub);
     if(!topics.includes(currentTopic)){
       //console.log(currentTopic);
       topics.push(currentTopic);
       const done = await setupTopic(currentTopic);
     }
     const done = await setupSub(agentSub,currentTopic);

     if(!tenants.includes(agents[i].tenant)){
       tenants.push(agents[i].tenant);
       pubUrls[agents[i].tenant] = {};
     }
     if(!pubUrls[agents[i].tenant][agents[i].entity_type]){
       pubUrls[agents[i].tenant][agents[i].entity_type] = {};
     }
     if(!pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol]){
       pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol] = [];
     }
     pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol] = amsBaseUrl + "/topics/"+ currentTopic +":publish" + amsKey;
   }
   console.log('Ams Configuration Completed');

   var intervalID = setInterval(run, 10000);
}).catch(err=> {console.log(err)})

async function setupSub(sub,topic){
  const done = await axios.get(amsBaseUrl+ "/topics/"+topic+"/subscriptions"+amsKey).then(async response =>{
    if(!response.data.subscriptions.includes('/'+amsProject+'/subscriptions/'+sub)){
      console.log('\t'+"Creating Subscription...");
      return await axios.put(amsBaseUrl+"/subscriptions/"+sub+amsKey,{"topic":amsProject+'/topics/'+topic,"ackDeadlineSeconds":10}).then(async response => {
        if(response.status===200){
          console.log(response.status===200?'\t'+'\t'+"Created Subscription: "+sub:"Failed to Create Subsctiption: " + sub);
          return true
        }
      }).catch(err => {
        console.log('\t'+'\t'+"Failed to Create Subscription: " + sub);
        return false
      });
    }
    else{return true;}
  }).catch(async err => {
    console.log('\t'+'Could not get subscriptions for topic: ' + topic);
  });
  return await setupSubAcl(sub);


}
async function setupSubAcl(sub){
  return await axios.get(amsBaseUrl+ '/subscriptions/'+sub+':acl'+amsKey).then(async response =>{
    if(!response.data.authorized_users.includes(acl.authorized_users[0])){
      console.log('\t'+"Modifying Acl for Subscription: "+ sub);
      return await axios.post(amsBaseUrl + "/subscriptions/"+ sub + ":modifyAcl" + amsKey, acl).then(response => {
        console.log(response.status===200?"\t"+"\t"+"Modified Acl for Subscription: "+sub:"\t"+"\t"+"Failed to Modify Acl for Subscription: " + topic);
        return (response.status === 200);
      }).catch(err => {
        console.log("\t"+"\t"+"Failed to Modify Acl for Subscription: " + topic)
        return false})
    }
    else {return true}
  });
}

async function setupTopicAcl(topic){
  return await axios.get(amsBaseUrl+'/topics/'+topic+':acl'+amsKey).then(async response=>{
    if(response.status===200){
      if(!response.data.authorized_users.includes(acl.authorized_users[0])){
        console.log('\t'+"Modifying Acl for Topic: "+ topic);
        return await axios.post(amsBaseUrl + "/topics/"+ topic + ":modifyAcl" + amsKey, acl).then(response => {
          console.log(response.status===200?"\t"+"\t"+"Modified Acl for Topic: "+topic:"\t"+"\t"+"Failed to Modify Acl for Topic: " + topic);
          return (response.status === 200);
        }).catch(err => {
          console.log("\t"+"\t"+"Failed to Modify Acl for Topic: " + topic)
          return false})
      }
      else{return true}
    }else {return false}
  }).catch(err=> {
    console.log(err);
    console.log("\t"+ "Unable to get Acl for Topic: " + topic)
    return false;})
}
async function setupTopic(topic) {
  const done = await axios.get(amsBaseUrl + "/topics/"+ topic + amsKey).then(async response=> {
    return(response.status===200);
  }).catch(async err => {
    if(err.response.status===404){
      console.log("\t"+"Creating Topic: "+topic)
      return await axios.put(amsBaseUrl + "/topics/"+ topic + amsKey).then( async response=> {
        console.log(response.status===200?"\t"+"\t"+"Created Topic: "+topic:"\t"+"\t"+"Failed to Create Topic: " + topic);
        return (response.status===200)
      }).catch(err => {console.log("\t"+"\t"+"Failed to Create Topic: " + topic); return false})
    }else{
      return false;
    }
  });
  return await setupTopicAcl(topic);
}

async function run() {
  if(setStateArray.length === 0){
    axios.get(process.env.EXPRESS+'/agent/get_new_configurations',options)
    .then(async function (response) {
      // handle success

      let service;
      if(response.data.services){
        // fix format of the data
        for(let index=0;index<response.data.services.length;index++){
          service = response.data.services[index];
          for (var propName in service.json) {
            if (service.json[propName] === null || service.json[propName] === undefined) {
              delete service.json[propName];
            }
          }
          console.log(service);
          let messages = [{"attributes":{},"data": Buffer.from(JSON.stringify(service.json)).toString("base64")}];

          let done = await axios.post(pubUrls[service.json.tenant].service[service.json.protocol],{"messages":messages}, options).then((res) => {
            if(res.status===200){
              setStateArray.push({id:service.json.id,state:'waiting-deployment',protocol:service.json.protocol,tenant:service.json.tenant});
            }
          }).catch(err => {console.log(err)});

        }
        if(setStateArray.length>0){
          setStateTask = setInterval(function() {setServiceState(setStateArray)}, 1500);
        }
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
  }
}



async function setServiceState(){
    axios.put(process.env.EXPRESS+'/agent/set_services_state',setStateArray,options).then((res)=>{
      if(res.status!=200){
        console.log('Could not set state trying again...')

      }
      else{
        setStateArray = [];
        clearInterval(setStateTask);
      }
    }).catch(err=>{console.log('Could not set state trying again...');});
}


function stopClock() {
    clearInterval(intervalID);
}

// var intervalFake = setInterval(checkConsumer,10000);
