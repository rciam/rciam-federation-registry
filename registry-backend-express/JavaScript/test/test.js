'use-strict';
require('dotenv').config();
var server = require('../index.js');
var chai = require('chai');
var request = require('supertest');
var {create,edit,users,validationResponses,validationRequests,agents,postServices} = require('./data.js');
var expect = chai.expect;
var should = chai.should;
var petition,service,group,code,invitation;
var diff = require('deep-diff').diff;
const {postPetitionError,checkAvailability,setUser,putPetition} = require('./helpers.js');
let userToken = {}
var config = require('../config');

//var petition=10;



describe('Service registry API Integration Tests', function() {
  after(async () => {
    require('../index.js').stop();
  });
  beforeEach(done => setTimeout(done, 2000));
  userToken = setUser(users.egi.admin_user);
  describe('# Petition Validation Testing For Creation Requests', function(){
    it('should catch all null none protocol specific values',function(done){
      postPetitionError({type:'create'},'egi',validationResponses.create.null,done);
    })
    it('should catch all null fields in a oidc service',function(done){
      postPetitionError({type:'create',protocol:'oidc'},'egi',validationResponses.create.oidc_null,done);
    })
    it('should catch all null fields in a saml service',function(done){
      postPetitionError({type:'create',protocol:'saml'},'egi',validationResponses.create.saml_null,done);
    })
    it('should catch oidc wrong field types',function(done){
      postPetitionError(validationRequests.oidc_types,'egi',validationResponses.create.oidc_types,done);
    })
    it('should catch saml wrong field types',function(done){
      postPetitionError(validationRequests.saml_types,'egi',validationResponses.create.saml_types,done);
    })
    it('should catch oidc wrong field values',function(done){
      postPetitionError(validationRequests.oidc_values,'egi',validationResponses.create.oidc_values,done);
    })
    it('should cactch saml wrong field values',function(done){
      postPetitionError(validationRequests.saml_values,'egi',validationResponses.create.saml_values,done);
    })
  })
  describe('# OIDC Petition lifecycle',function(){
    describe('# Create Petition',function(){
      it('should check availability of client_id',function(done){
        checkAvailability(create.oidc.client_id,'oidc','egi',create.oidc.integration_environment,true,done);
      })
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken})
        .send({
          type:'create',
          ...create.oidc
        }
        );
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.id).to.be.a('number');
            expect(res.statusCode).to.equal(200);
            petition = body.id;
            done();
          })
      });
      it('should check that client_id is no longer available',function(done){
        checkAvailability(create.oidc.client_id,'oidc','egi',create.oidc.integration_environment,false,done);
      });
      it('should fetch created petition',function(done){
        var req = request(server).get('/tenants/egi/petitions/'+petition+'?type=open').set({Authorization: userToken});
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
            .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(res.statusCode).to.equal(200);
              should(diff(create.oidc,body.petition)).not.exist();
              done();
            })
      });
    })
    describe('# Edit Create Petition',function(){
      it('should fail to edit petition because user is not an owner', function(done){
        userToken = setUser(users.egi.end_user);
        putPetition(
          {petition:petition,body:{type:'create',...create.saml},tenant: 'egi'},
          {body:{error:'Could not find petition with id: '+petition},status:403},
          done
        );
      })
      it('should fail to edit petition because of protocol missmatch',function(done){
        userToken = setUser(users.egi.admin_user);
        putPetition(
          {petition:petition,body:{type:'create',...create.saml},tenant: 'egi'},
          {body:{error:'Tried to edit protocol'},status:403},
          done
        );
      });
      it('should fail to edit petition because of type missmatch',function(done){
        putPetition(
          {petition:petition,body:{type:'edit',...edit.oidc,service_id:1},tenant: 'egi'},
          {body:{error:'Tried to edit registration type'},status:403},
          done
        );
      });
      it('should fail to edit petition because client_id is not available',function(done){
        putPetition(
          {petition:petition,body:{type:'create',...edit.oidc,client_id:'client1'},tenant: 'egi'},
          {body:{error:'Protocol id is not available'},status:422},
          done
        );
      });
      it('should fail to edit petition not petition found',function(done){
        putPetition(
          {petition:0,body:{type:'create',...edit.oidc},tenant: 'egi'},
          {body:{error:'Could not find petition with id: 0'},status:403},
          done
        );
      });
      it('should edit petition that was created',function(done){
        var req = request(server).put('/tenants/egi/petitions/'+petition).set({Authorization: userToken}).send({
          type:'create',
          ...edit.oidc
        });
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();});
      });
    })
    describe('# Delete Petition',function(){
      it('should delete petition that was created',function(done){
        var req = request(server).delete('/tenants/egi/petitions/'+petition).set({Authorization: userToken})
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();});
      });
    })
  });
  describe('# SAML Petition lifecycle',function(){
    describe('# Create Petition',function(){
      it('should check availability of entity_id',function(done){
        checkAvailability(create.saml.entity_id,'saml','egi',create.saml.integration_environment,true,done);
      })
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken}).send({
          type:'create',
          ...create.saml
        });
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.id).to.be.a('number');
            expect(res.statusCode).to.equal(200);
            petition = body.id;
            done();
          })
      });
      it('should check that entity_id is no longer available',function(done){
        checkAvailability(create.saml.entity_id,'saml','egi',create.saml.integration_environment,false,done);
      });
      it('should fetch created petition',function(done){
        var req = request(server).get('/tenants/egi/petitions/'+petition+'?type=open').set({Authorization: userToken});
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();});
      });
    })
    describe('# Edit Create Petition',function(){
      it('should fail to edit petition because entity_id is not available',function(done){

        putPetition(
          {petition:petition,body:{type:'create',...edit.saml,entity_id:'https://saml-id-1.com'},tenant: 'egi'},
          {body:{error:'Protocol id is not available'},status:422},
          done
        );
      });
      it('should edit petition that was created',function(done){
        var req = request(server).put('/tenants/egi/petitions/'+petition).set({Authorization: userToken}).send({
          type:'create',
          ...edit.saml
        });
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();});
      });
    })
    describe('# Delete Petition',function(){
      it('should delete petition that was created',function(done){
        var req = request(server).delete('/tenants/egi/petitions/'+petition).set({Authorization: userToken});
        req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();});
      });
    })
  });
  describe('# Service lifecycle',function(){
    describe('# Create Service',function(){
      describe('# Create Petition',function(){
        it('should create a new petition and return the id',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken}).send({
          type:'create',
          ...create.oidc
        });

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.id).to.be.a('number');
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });
      });
      describe('# Review Petition',function(){
          it('should fail to approve petition because user is from another tenant',function(done){
            userToken = setUser(users.eosc.admin_user);
            var req = request(server).put('/tenants/eosc/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'approve'});
            req.set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(403)
            .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(body.error).to.equal("No petition found");
              expect(res.statusCode).to.equal(403);
              done();
            })
          });
          it('should fail to approve petition because user is not an owner nor admin',function(done){
            userToken = setUser(users.egi.manager_user);
            var req = request(server).put('/tenants/egi/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'approve'});
            req.set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(401)
            .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(body.error).to.be.eql("Requested action not authorised");
              expect(res.statusCode).to.equal(401);
              done();
            })
          });
          it('should approve petition and create service',function(done){
            userToken = setUser(users.egi.admin_user);
            var req = request(server).put('/tenants/egi/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'approve'});
            req.set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(body.service_id).to.be.a('number');
              expect(res.statusCode).to.equal(200);
              service = body.service_id;
              done();
            })
          });
          it('should create deployment tasks for service deployment',function(done){
            var req = request(server).put('/agent/set_services_state').set('X-Api-Key',process.env.AMS_AGENT_KEY).send(
            [{
              tenant:"egi",
              id:service,
              protocol:"oidc",
              state:"waiting-deployment"
            }]);
            req.set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
              expect(res.statusCode).to.equal(200);
              done();
            })
          });
          it('should mock deployment of service configuration',function(done){
            let messages = [];
            messages.push(
              {
                 "message":{
                    "attributes":{
                       "key":"value"
                    },
                    "data":Buffer.from(JSON.stringify({id:service,state:'deployed',agent_id:1})).toString("base64"),
                    "messageId":"136969346945"
                 },
                 "subscription":"projects/myproject/subscriptions/mysubscription"
              }
            );

            var req = request(server).post('/ams/ingest').set({Authorization: process.env.AMS_AUTH_KEY}).send({
              messages
            });
            req.expect(200).end(function(err,res){
              expect(res.statusCode).to.equal(200);
              done();
            });


          });
          it('should get created service',function(done){
            var req = request(server).get('/tenants/egi/services/'+service).set({Authorization: userToken});
            req.set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(res.statusCode).to.equal(200);
              done();});
          });
      });
    });
    describe('# Invite a user to owners group',function(){
      describe('# Send invitation',function(){
        it('should get group_id of service just created',function(done){
          var req = request(server).get('/tenants/egi/services').set({Authorization: userToken});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            body.services.forEach((item)=>{if(item.service_id===service){group=item.group_id}});
            expect(res.statusCode).to.equal(200);
            done();
          });
        });
        it('should fail to create invitation, body validation null',function(done){
          var req = request(server).post('/tenants/egi/groups/'+group+'/invitations').set({Authorization: userToken});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(422)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(res.statusCode).to.equal(422);
            expect(body).to.eql([
              { email: 'Required Field' },
              { group_manager: 'Required Field' }
            ]);
            done();
          });
        });
        it('should fail to create invitation, body validation types',function(done){
          var req = request(server).post('/tenants/egi/groups/'+group+'/invitations').set({Authorization: userToken}).send({
            email:'string',
            group_manager:'string'
            }
          );
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(422)
          .end(function(err,res){
            expect(res.statusCode).to.equal(422);
            let body = JSON.parse(res.text);
            expect(body).to.eql([
              { email: 'Must be an email' },
              { group_manager: 'Must be a boolean' }
            ])
            code = body.code;
            done();
          });
        });
        it('should create invitation to manage service',function(done){
          var req = request(server).post('/tenants/egi/groups/'+group+'/invitations').set({Authorization: userToken}).send({
            email:'test_email@mail.com',
            group_manager:false
            }
          );
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            let body = JSON.parse(res.text);
            code = body.code;
            done();
          });
        });
      })
      describe('# Activate invitation',function(){
        it('should fail to activate invitation user that is already an owner',function(done){
          var req = request(server).put('/tenants/egi/invitations/activate_by_code').set({Authorization: userToken}).send({code});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(406)
          .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(res.statusCode).to.equal(406);
              expect(body.error).to.equal('member');
            done();
          });
        });
        it('should activate invitation with different user',function(done){
          userToken = setUser(users.egi.manager_user);
          var req = request(server).put('/tenants/egi/invitations/activate_by_code').set({Authorization: userToken}).send({code});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
              let body = JSON.parse(res.text);
              expect(body.id).to.be.a('number');
              invitation = body.id;
              expect(res.statusCode).to.equal(200);
            done();
          });
        });
        it('should fail to activate invitation with different user due to one time code',function(done){
          userToken = setUser(users.egi.end_user);
          var req = request(server).put('/tenants/egi/invitations/activate_by_code').set({Authorization: userToken}).send({code});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(204)
          .end(function(err,res){
              expect(res.statusCode).to.equal(204);
            done();
          });
        })
      });
      describe('# Accept invitation',function(){
        it('should accept invitation to group',function(done){
          userToken = setUser(users.egi.manager_user);
          var req = request(server).put('/tenants/egi/invitations/'+invitation+'/accept').set({Authorization: userToken});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            expect(res.statusCode).to.equal(200);
            done();
          });
        });
        it('should check role for new member',function(done){
          var req = request(server).post('/tenants/egi/groups/'+group+'/invitations').set({Authorization: userToken}).send({
            email:'test_email@mail.com',
            group_manager:false
            }
          );
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(406)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(res.statusCode).to.equal(406);
            expect(body.error).to.equal("Can't access this resource")
            done();
          });
        });
        it('should check new member can view service',function(done){
          var req = request(server).get('/tenants/egi/services/'+service).set({Authorization: userToken});
          req.set('Accept','application/json')
          .expect('Content-Type',/json/)
          .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(res.statusCode).to.equal(200);
            done();});
          });
        });
      });
    describe('# Edit Service',function(){
      it('should create a new edit petition and return the id',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken}).send({
          type:'edit',
          service_id:service,
          ...edit.oidc
        });

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });
      it('should fail to create new petition because of open petition',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken}).send({
          type:'edit',
          service_id:service,
          ...edit.oidc
        });

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(403)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(res.statusCode).to.equal(403);
          expect(body.error).to.equal('Cannot create new petition because there is an open petition existing for target service');
          done();
        })
      });
      it('should approve petition and edit service',function(done){
        var req = request(server).put('/tenants/egi/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'approve'});

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.service_id).to.be.a('number');
          expect(res.statusCode).to.equal(200);
          service = body.service_id;
          done();
        })
      });
      it('should create deployment tasks for service deployment',function(done){
        var req = request(server).put('/agent/set_services_state').set('X-Api-Key',process.env.AMS_AGENT_KEY).send(
        [{
          tenant:"egi",
          id:service,
          protocol:"oidc",
          state:"waiting-deployment"
        }]);
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        })
      });
      it('should mock deployment of service configuration',function(done){
        let messages = [];
        messages.push(
          {
             "message":{
                "attributes":{
                   "key":"value"
                },
                "data":Buffer.from(JSON.stringify({id:service,state:'deployed',agent_id:1})).toString("base64"),
                "messageId":"136969346945"
             },
             "subscription":"projects/myproject/subscriptions/mysubscription"
          }
        );

        var req = request(server).post('/ams/ingest').set({Authorization: process.env.AMS_AUTH_KEY}).send({
          messages
        });
        req.expect(200).end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        });
      });
      it('should get edited service',function(done){
        var req = request(server).get('/tenants/egi/services/'+service).set({Authorization: userToken});
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(res.statusCode).to.equal(200);
          should(diff(edit.oidc,body.service)).not.exist();
          done();
        })
      });
    });
    describe('# Delete Service',function(){
      it('should create a new delete petition',function(done){
        var req = request(server).post('/tenants/egi/petitions').set({Authorization: userToken}).send({
          type:'delete',
          service_id:service
        });

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });

      it('should approve petition and delete service',function(done){
        var req = request(server).put('/tenants/egi/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'approve'});

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
      it('should create deployment tasks for service deployment',function(done){
        var req = request(server).put('/agent/set_services_state').set('X-Api-Key',process.env.AMS_AGENT_KEY).send(
        [{
          tenant:"egi",
          id:service,
          protocol:"oidc",
          state:"waiting-deployment"
        }]);
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        })
      });
      it('should mock deployment of service configuration',function(done){
        let messages = [];
        messages.push(
          {
             "message":{
                "attributes":{
                   "key":"value"
                },
                "data":Buffer.from(JSON.stringify({id:service,state:'deployed',agent_id:1})).toString("base64"),
                "messageId":"136969346945"
             },
             "subscription":"projects/myproject/subscriptions/mysubscription"
          }
        );

        var req = request(server).post('/ams/ingest').set({Authorization: process.env.AMS_AUTH_KEY}).send({
          messages
        });
        req.expect(200).end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        });
      });
      it('should fail to get deleted service',function(done){
        var req = request(server).get('/tenants/egi/services/'+service).set({Authorization: userToken});

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(204);
          done();
        })
      });
    });
  });
  describe('# Admin Actions',function(){
    describe('# Reject Petition',function(){
      it('should create a new petition and return the id',function(done){
        userToken = setUser(users.eosc.end_user);
        var req = request(server).post('/tenants/eosc/petitions').set({Authorization: userToken}).send({
          type:'create',
          ...create.oidc
        });
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.id).to.be.a('number');
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });
      it('should fail to reject petition because user no reviewing rights',function(done){
        var req = request(server).put('/tenants/eosc/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'reject'});
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(401)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.error).to.equal('Requested action not authorised')
          expect(res.statusCode).to.equal(401);
          done();});
      });
      it('should reject petition',function(done){
        userToken = setUser(users.eosc.admin_user);
        var req = request(server).put('/tenants/eosc/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'reject'});
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
    });
    describe('# Request Changes Petition',function(){
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/tenants/eosc/petitions').set({Authorization: userToken}).send({
          type:'create',
          ...create.oidc
        });

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.id).to.be.a('number');
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });
      it('should request changes petition',function(done){
        var req = request(server).put('/tenants/eosc/petitions/'+petition+'/review').set({Authorization: userToken}).send({type:'changes',comment:"comment"});
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.id).to.be.a('number');
          expect(res.statusCode).to.equal(200);
          petition = body.id;
          done();
        })
      });
      it('should delete petition',function(done){
        var req = request(server).delete('/tenants/eosc/petitions/'+petition).set({Authorization: userToken});

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
    });

  });
  describe('# Deployer Agent',function(){
    it('should get configured deployer agents',function(done){
      var req = request(server).get('/tenants/egi/agents').set({Authorization: userToken});
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)

      .expect(200)

      .end(function(err,res){
        let body = JSON.parse(res.text);
        expect(res.statusCode).to.equal(200);
        done();
      })
    });
    it('should delete an agent',function(done){
      var req = request(server).delete('/tenants/egi/agents/1').set({Authorization: userToken});
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      })
    });
    it('should update an agent',function(done){
      var req = request(server).put('/tenants/egi/agents/2').send(agents.put);
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      })
    });
    it('should get updated agent',function(done){
      var req = request(server).get('/tenants/egi/agents/2').send(agents.put);
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        let body = JSON.parse(res.text);
        expect(res.statusCode).to.equal(200);
        expect(body).to.eql(agents.put)
        done();
      })
    });
    it('should delete existing configuration',function(done){
      var req = request(server).delete('/tenants/egi/agents').set({Authorization: userToken});
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      })
    });
    it('should create new agents for tenant',function(done){
      var req = request(server).post('/tenants/egi/agents').send(agents.post);
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      })
    });
    it('should get configured deployer agents',function(done){
      var req = request(server).get('/tenants/egi/agents').set({Authorization: userToken});
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        let body = JSON.parse(res.text);
        body.agents.forEach((agent,index)=> {delete body.agents[index].id; delete body.agents[index].tenant;})
        expect(res.statusCode).to.equal(200);
        expect(body).to.eql(agents.post);
        done();
      })
    });
  });
  describe('# POST SERVICES',function(){
    it('should create multiple service',function(done){
      userToken = setUser(users.egi.admin_user);
      var req = request(server).post('/tenants/egi/services').set({Authorization: userToken}).send(postServices);
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();});
    })
  });
});
