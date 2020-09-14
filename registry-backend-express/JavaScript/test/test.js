'use-strict';

var server = require('../index.js');
var chai = require('chai');
var request = require('supertest');
var {create,edit} = require('./data.js');
var expect = chai.expect;
var should = chai.should;
var Cookies;
var petition,service;
var diff = require('deep-diff').diff;
//var petition=10;

describe('Service registry API Integration Tests', function() {
  after(async () => {
    require('../index.js').stop();
  });
  beforeEach(done => setTimeout(done, 500));
  describe('# OIDC Petition lifecycle',function(){
    it('should create a new petition and return the id',function(done){
      var req = request(server).post('/petitions').send({
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
    it('should fetch created petition',function(done){
      var req = request(server).get('/petitions/'+petition+'?type=open');
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
    it('should edit petition that was created',function(done){
      var req = request(server).put('/petitions/'+petition).send({
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
    it('should delete petition that was created',function(done){
      var req = request(server).delete('/petitions/'+petition)
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
    });
  });
  describe('# SAML Petition lifecycle',function(){
    it('should create a new petition and return the id',function(done){
      var req = request(server).post('/petitions').send({
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
    it('should fetch created petition',function(done){
      var req = request(server).get('/petitions/'+petition+'?type=open');
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
    });
    it('should edit petition that was created',function(done){
      var req = request(server).put('/petitions/'+petition).send({
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
    it('should delete petition that was created',function(done){
      var req = request(server).delete('/petitions/'+petition)

      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
    });
  });
  describe('# Service lifecycle',function(){
    describe('# Create Service',function(){
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/petitions').send({
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
      it('should approve petition and create service',function(done){
        var req = request(server).put('/petitions/'+petition+'/review').send({type:'approve'});

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
      it('should mock deployment of service configuration',function(done){
        let messages = [];
        messages.push(
          {
             "message":{
                "attributes":{
                   "key":"value"
                },
                "data":Buffer.from(JSON.stringify({id:service,state:'deployed'})).toString("base64"),
                "messageId":"136969346945"
             },
             "subscription":"projects/myproject/subscriptions/mysubscription"
          }
        );

        var req = request(server).post('/services/deployment').send({
          messages
        });
        req.expect(200).end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        });


      });
      it('should get created service',function(done){
        var req = request(server).get('/services/'+service);

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
    });
    describe('# Edit Service',function(){
      it('should create a new edit petition and return the id',function(done){
        var req = request(server).post('/petitions').send({
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
      it('should approve petition and edit service',function(done){
        var req = request(server).put('/petitions/'+petition+'/review').send({type:'approve'});

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
      it('should mock deployment of service configuration',function(done){
        let messages = [];
        messages.push(
          {
             "message":{
                "attributes":{
                   "key":"value"
                },
                "data":Buffer.from(JSON.stringify({id:service,state:'deployed'})).toString("base64"),
                "messageId":"136969346945"
             },
             "subscription":"projects/myproject/subscriptions/mysubscription"
          }
        );

        var req = request(server).post('/services/deployment').send({
          messages
        });
        req.expect(200).end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        });
      });
      it('should get edited service',function(done){
        var req = request(server).get('/services/'+service);
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
        var req = request(server).post('/petitions').send({
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
        var req = request(server).put('/petitions/'+petition+'/review').send({type:'approve'});

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
      it('should mock deployment of service configuration',function(done){
        let messages = [];
        messages.push(
          {
             "message":{
                "attributes":{
                   "key":"value"
                },
                "data":Buffer.from(JSON.stringify({id:service,state:'deployed'})).toString("base64"),
                "messageId":"136969346945"
             },
             "subscription":"projects/myproject/subscriptions/mysubscription"
          }
        );

        var req = request(server).post('/services/deployment').send({
          messages
        });
        req.expect(200).end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();
        });
      });
      it('should fail to get deleted service',function(done){
        var req = request(server).get('/services/'+service);

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
        var req = request(server).post('/petitions').send({
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
      it('should reject petition',function(done){
        var req = request(server).put('/petitions/'+petition+'/review').send({type:'reject'});

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
        var req = request(server).post('/petitions').send({
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
        var req = request(server).put('/petitions/'+petition+'/review').send({type:'changes',comment:"comment"});
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
        var req = request(server).delete('/petitions/'+petition);

        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          expect(res.statusCode).to.equal(200);
          done();});
      });
    });

  });
  describe('# Test Group Actions',function(){
    it('# POST /groups/:group_id/invitations',function(done){
      var req = request(server).post('/groups/5/invitations').send({
        email:'test_email@mail.com',
        group_manager:false
        }
      );
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# PUT /groups/:group_id/invitations/:id',function(done){
      var req = request(server).put('/groups/5/invitations/4');
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# DELETE /groups/:group_id/invitations/:id',function(done){
      var req = request(server).delete('/groups/5/invitations/4');
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# GET /invitations',function(done){
      var req = request(server).get('/invitations');
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# PUT /invitations',function(done){
      var req = request(server).put('/invitations').send({
        code:'generated_code_for_tests'
      });
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# PUT /invitations/:invite_id/:action/',function(done){
      var req = request(server).put('/invitations/1/accept');
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('# PUT /invitations/:invite_id/:action/',function(done){
      var req = request(server).put('/invitations/3/decline');
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        expect(res.statusCode).to.equal(200);
        done();
      });
    });


  });

});
