
const axios = require('axios');
const base64 = require('base-64');
var config = require('./config');
var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const options = {
  headers:{
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.EXPRESS_KEY
}};
const options_ams_user = {
  headers:{
    'Content-Type': 'application/json',
    'x-api-key': process.env.AMS_USER_TOKEN
  }
};
const options_ams_admin = {
  headers:{
    'Content-Type': 'application/json',
    'x-api-key': process.env.AMS_ADMIN_TOKEN
  }
};
const amsBaseUrl = process.env.AMS_BASE_URL + '/projects/' + process.env.AMS_PROJECT;
const amsProject = 'projects/' + process.env.AMS_PROJECT;



let tenants = [];
let pubUrls = {};
let topics = [];
let setStateArray = [];
let subscriptions = {};
let agents;
let acl = {"authorized_users":config.authorized_users};
var intervalID;
var setStateTask;

axios.get(process.env.EXPRESS_URL+'/agent/get_agents',options)
.then(async function (response) {
   agents = response.data.agents;
   console.log("Configuring Ams...");
   for(var i=0;i<agents.length;i++){
     let currentTopic = process.env.ENV + '_' + agents[i].tenant+'_'+agents[i].entity_type+'_'+agents[i].type + '_' + agents[i].integration_environment;
     let agentSub = process.env.ENV + '_' + agents[i].tenant + '_'+agents[i].entity_type + '_' + agents[i].type + '_' + agents[i].integration_environment + '_deployer'+ (agents[i].deployer_name?'_' + agents[i].deployer_name:"");
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
       pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol] = {};
     }
     if(!pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol][agents[i].integration_environment]){
       pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol][agents[i].integration_environment] = [];
     }
     pubUrls[agents[i].tenant][agents[i].entity_type][agents[i].entity_protocol][agents[i].integration_environment] = amsBaseUrl + "/topics/"+ currentTopic +":publish";
   }
   console.log('Ams Configuration Completed');

   var intervalID = setInterval(run, 10000);
}).catch(err=> {console.log(err)})

async function setupSub(sub,topic){
  const done = await axios.get(amsBaseUrl+ "/topics/"+topic+"/subscriptions",options_ams_admin).then(async response =>{
    if(!response.data.subscriptions.includes('/'+amsProject+'/subscriptions/'+sub)){
      console.log('\t'+"Creating Subscription...");
      return await axios.put(amsBaseUrl+"/subscriptions/"+sub,{"topic":amsProject+'/topics/'+topic,"ackDeadlineSeconds":10},options_ams_admin).then(async response => {
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
  return await axios.get(amsBaseUrl+ '/subscriptions/'+sub+':acl',options_ams_admin).then(async response =>{
    modify_acl = false;
    acl.authorized_users.forEach(autorised_user=>{
      if(!response.data.authorized_users.includes(autorised_user)){
        modify_acl = true;
      }
    })  
    if(modify_acl){
      console.log('\t'+"Modifying Acl for Subscription: "+ sub);
      return await axios.post(amsBaseUrl + "/subscriptions/"+ sub + ":modifyAcl" ,acl,options_ams_admin).then(response => {
        console.log(response.status===200?"\t"+"\t"+"Modified Acl for Subscription: "+sub:"\t"+"\t"+"Failed to Modify Acl for Subscription: " + topic);
        return (response.status === 200);
      }).catch(err => {
        console.log("\t"+"\t"+"Failed to Modify Acl for Subscription: " + sub)
        return false})
    }
    else {return true}
  }).catch(err=> {
    console.log("\t"+"\t"+"Failed to Get Acl for Subscription: " + sub)
  });
}

async function setupTopicAcl(topic){
  return await axios.get(amsBaseUrl+'/topics/'+topic+':acl',options_ams_admin).then(async response=>{
    if(response.status===200){
      modify_acl = false;
      acl.authorized_users.forEach(autorised_user=>{
        if(!response.data.authorized_users.includes(autorised_user)){
          modify_acl = true;
        }
      })
      
      if(modify_acl){
        console.log('\t'+"Modifying Acl for Topic: "+ topic);
        return await axios.post(amsBaseUrl + "/topics/"+ topic + ":modifyAcl" , acl,options_ams_admin).then(response => {
          console.log(response.status===200?"\t"+"\t"+"Modified Acl for Topic: "+topic:"\t"+"\t"+"Failed to Modify Acl for Topic: " + topic);
          return (response.status === 200);
        }).catch(err => {
          console.log("\t"+"\t"+"Failed to Modify Acl for Topic: " + topic)
          return false})
      }
      else{return true}
    }else {return false}
  }).catch(err=> {
    console.log("\t"+ "Unable to get Acl for Topic: " + topic)
    return false;})
}
async function setupTopic(topic) {
  console.log('setting ' + topic);
  const done = await axios.get(amsBaseUrl + "/topics/"+ topic, options_ams_admin).then(async response=> {
    return(response.status===200);
  }).catch(async err => {
    if(err.response.status===404){
      console.log("\t"+"Creating Topic: "+topic)
      return await axios.put(amsBaseUrl + "/topics/"+ topic, {},options_ams_admin).then( async response=> {
        console.log(response.status===200?"\t"+"\t"+"Created Topic: "+topic:"\t"+"\t"+"Failed to Create Topic: " + topic);
        return (response.status===200)
      }).catch(err => {
        console.log(err);
        console.log("\t"+"\t"+"Failed to Create Topic: " + topic); return false})
    }else{
      return false;
    }
  });
  return await setupTopicAcl(topic);
}

async function run() {
  if(setStateArray.length === 0){
    axios.get(process.env.EXPRESS_URL+'/agent/get_new_configurations',options)
    .then(async function (response) {
      // handle success
      let service;
      if(response.data.services&&response.data.services.length>0){
        // fix format of the data
        for(let index=0;index<response.data.services.length;index++){
          service = response.data.services[index];
          if(service.json.post_logout_redirect_uris&&service.json.post_logout_redirect_uris.length>0){
            service.json.redirect_uris = [...service.json.redirect_uris,...service.json.post_logout_redirect_uris]
          }
          for (var propName in service.json) {
            if (service.json[propName] === null || service.json[propName] === undefined) {
              delete service.json[propName];
            }
          }
          if(service.json.jwks){
            try{

              service.json.jwks = JSON.parse(service.json.jwks);
            }
            catch(err){
              console.log(err)
            }
          }
          let messages = [{"attributes":{},"data": Buffer.from(JSON.stringify(service.json)).toString("base64")}];

          let propagation_integration_environment = service.json.integration_environment;
          if ('merge_environments_on_deploy' in config && config.merge_environments_on_deploy) {
            propagation_integration_environment = config.merged_integration_environment_name;
          }

          console.log(pubUrls.toString());

          let done = await axios.post(pubUrls[service.json.tenant].service[service.json.protocol][propagation_integration_environment],{"messages":messages}, options_ams_user).then((res) => {
            if(res.status===200){
              let log = {
                topic: pubUrls[service.json.tenant].service[service.json.protocol][propagation_integration_environment],
                tenant: service.json.tenant,
                service_id: service.json.id,
                external_id: service.json.external_id,
                integration_environment: service.json.integration_environment,
                deployment_type: service.json.deployment_type,
                protocol: service.json.protocol
              };
              console.log('Successfully Pushed Message to Ams')
              
              console.log(JSON.stringify(log));
              setStateArray.push({id:service.json.id,state:'waiting-deployment',protocol:service.json.protocol,tenant:service.json.tenant,integration_environment:service.json.integration_environment});
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
    axios.put(process.env.EXPRESS_URL+'/agent/set_services_state',setStateArray,options).then((res)=>{
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
