const express = require('express');
const {db} = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');
const {merge_data} = require('./merge_data.js');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/client',clientValidationRules(),validate,(req,res)=>{

  return db.task('add-client', async t => {
      res.setHeader('Content-Type', 'application/json');
      console.log(req.body);

      await t.client_details.findByClientId(req.body.client_id).then(async result=> {
        if(result){
          console.log(result)
          res.end(JSON.stringify({a:'1'}));
        }
        else{
            await t.client_details.add(req.body).then(async result=>{
              await t.client_grant_type.add(req.body.grant_types,result.id).then(console.log());
              await t.client_scope.add(req.body.scope,result.id);
              await t.client_redirect_uri.add(req.body.redirect_uris,result.id);
              await t.client_contact.add(req.body.contacts,result.id);

              console.log(result)
              res.end(JSON.stringify({a:'success'}));
            }).catch(err=>{
              console.log(err)
              res.end(JSON.stringify({a:'error'}));
            })
        }});

  });
});
app.get('/client/:RequesterId',(req,res)=>{
    items = [];

    return db.task('find-clients',async t=>{
        let connections = await t.client_details.findByRequesterId(req.params.RequesterId);
        if(connections.length<1){
          return res.json({
            success:false
          });
        }
          console.log(connections);
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
