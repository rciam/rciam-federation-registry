const express = require('express');
const {db} = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser')
const {check,validationResult,body}= require('express-validator');
const {clientValidationRules,validate} = require('./validator.js');


const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/client',clientValidationRules(),validate,(req,res)=>{

  return db.task('add-client', async t => {
      res.setHeader('Content-Type', 'application/json');
      console.log(req.body);

      await t.client_details.findByClientId(req.body.clientId).then(async result=> {
        if(result){
          console.log(result)
          res.end(JSON.stringify({a:'1'}));
        }
        else{
            await t.client_details.add(req.body).then(async result=>{
              await t.client_grant_type.add(req.body.grantTypes,result.id).then(console.log());
              await t.client_scope.add(req.body.scope,result.id);
              await t.client_redirect_uri.add(req.body.redirectUris,result.id);
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
