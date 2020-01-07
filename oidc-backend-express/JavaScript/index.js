const express = require('express');
const {db} = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');
const {Issuer} = require('openid-client');
const app = express();

app.use(cors());
app.use(bodyParser.json());


// We create oidc_client to access the userinfo method
oidc_client = Issuer.discover('https://aai-dev.egi.eu/oidc/').then((issuer)=>{
 return oidc_client = new issuer.Client({
   client_id: 'backend-express',
 });
});

// Add a new client/petition
// Secured
app.post('/client',clientValidationRules(),validate,(req,res)=>{
  res.setHeader('Content-Type', 'application/json');
  const access_token = req.headers.authorization.replace("Bearer ","");
  oidc_client.userinfo(access_token).then(function (userinfo) {
    if(userinfo){
      return db.task('add-client', async t => {
          await t.client_details.findByClientId(req.body.client_id).then(async result=> {
            if(result){
              res.end(JSON.stringify({response:'client_id_exists'}));
            }
            else{
                await t.client_details.add(req.body,userinfo).then(async result=>{
                  await t.client_grant_type.add(req.body.grant_types,result.id).then(console.log());
                  await t.client_scope.add(req.body.scope,result.id);
                  await t.client_redirect_uri.add(req.body.redirect_uris,result.id);
                  await t.client_contact.add(req.body.contacts,result.id);
                  res.end(JSON.stringify({response:'success'}));
                }).catch(err=>{
                  console.log(err)
                  res.end(JSON.stringify({response:'error'}));
                })
            }});
      });
    }
    else{
      res.end(JSON.stringify({response:'user_not_authorized'}));
    }
  })
});


// Delete client/petition
// Not yet fully implemented
// Not secure
app.get('/client/delete/:id',(req,res)=>{
    return db.task('delete-client', async t => {
      res.setHeader('Content-Type', 'application/json');
      await t.client_details.findByClientId(req.params.id).then(async result=>{
        if(result){
          try{
            await t.client_grant_type.delete(result.id).then(response =>console.log(response));
            await t.client_scope.delete(result.id);
            await t.client_redirect_uri.delete(result.id);
            await t.client_contact.delete(result.id);
            await t.client_details.delete(result.id);
            res.end(JSON.stringify({response:'success'}));
          }
          catch{
            res.end(JSON.stringify({response:'error'}));
          }
        }
        else{
          res.end(JSON.stringify({response:'does_not_exist'}));
        }
      });
    });
})

// Find all clients/petitions from curtain user to create preview list
// Secured
app.post('/clients/user',(req,res)=>{
  const access_token = req.headers.authorization.replace("Bearer ","");
  oidc_client.userinfo(access_token).then(function (userinfo) {
    if(userinfo){
      return db.task('find-clients', async t => {
        res.setHeader('Content-Type', 'application/json');
        let connections = await t.client_details.findByuserIdentifier(userinfo.sub);
        if(connections.length<1){
          return res.end(JSON.stringify({
            success:false
          }));
        }
        return res.end(JSON.stringify({
          success:true,
          connections
        }));
      });
    }
    else {
      return res.end(JSON.stringify({
        success:false
      }));
    }
  });
});


// Check:
// 1) If user is authorized
// 2) If user is saved in DB
// 3) Save new user
app.post('/user',(req,res)=>{
  const access_token = req.headers.authorization.replace("Bearer ","");
  oidc_client.userinfo(access_token).then(function (userinfo) {
    if(userinfo){
      return db.task('user-check',async t=>{
        res.setHeader('Content-Type', 'application/json');
        let user = await t.user_info.findBySub(userinfo.sub);
        if(user){
          return res.end(JSON.stringify({
            success:true,
            response:"user-exists"
          }));
        }
        else {
          await t.user_info.add(userinfo).then(async result=>{
            await t.user_edu_person_entitlement.add(userinfo.eduperson_assurance,result.id);
            return res.end(JSON.stringify({
              success:true,
              response:"user-added"
            }));
          })
        }
      })
    }
    else {
      return res.end(JSON.stringify({success:false}));
    }
  });
});



// It should return one connection with only the necessary data for the form
// Not secured
app.get('/getclient/:id',(req,res)=>{
  console.log("we got the request");
  console.log(req);

  const access_token = req.headers.authorization.replace("Bearer ","");
  oidc_client.userinfo(access_token).then(function (userinfo) {
    if(userinfo){
      return db.task('find-clients',async t=>{
        await t.client_details.findConnectionByIdAndSub(userinfo.sub,req.params.id).then(async connection=>{
          if(connection){
            const grant_types = await t.client_grant_type.findByConnectionId(req.params.id);
            const scopes = await t.client_scope.findByConnectionId(req.params.id);
            const redirect_uris = await t.client_redirect_uri.findByConnectionId(req.params.id);
            const contacts = await t.client_contact.findByConnectionId(req.params.id);
            connection = merge_data(connection,grant_types,'grant_types');
            connection = merge_data(connection,scopes,'scope');
            connection = merge_data(connection,redirect_uris,'redirect_uris');
            connection = merge_data(connection,contacts,'contacts');
            return res.json({
              success:true,
              connection
            });
          }
          else{
            return res.json({
              success:false
            });
          }
        });
      });
    }
    else {
      return res.end(JSON.stringify({success:false}));
    }
    });
});





// I am not Using this
// It returns all connections for curtain user with Timestamps Flags Requester Reciever
app.get('/client/:RequesterId',(req,res)=>{
    items = [];
    return db.task('find-clients',async t=>{
        let connections = await t.client_details.findByRequesterId(req.params.RequesterId);
        if(connections.length<1){
          return res.json({
            success:false
          });
        }
          connections.map((item,index)=>{
           items.push(item.id)
          //connections[index].grant_types = await t.grant_types.findByConnectionId(connections)
        })
        const grant_types = await t.client_grant_type.findByConnectionId(items);
        const scopes = await t.client_scope.findByConnectionId(items);
        const redirect_uris = await t.client_redirect_uri.findByConnectionId(items);
        const contacts = await t.client_contact.findByConnectionId(items);
        connections = merge_data(connections,grant_types,'grant_types');
        connections = merge_data(connections,scopes,'scope');
        connections = merge_data(connections,redirect_uris,'redirect_uris');
        connections = merge_data(connections,contacts,'contacts');
        return res.json({
          success:true,
          connections
        });
    });
});



// Generic GET handler;
function GET(url, handler) {
    app.get(url, async (req, res) => {
        try {
            const data = await handler(req);
            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.json({
                success: false,
                error: error.message || error
            });
        }
    });
}

const port = 5000;

app.listen(port, () => {
    console.log('\nReady for GET requests on http://localhost:' + port);
});
