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
  describe('#GET /auth/mock', function() {
    it('should get session cookie', function(done) {
      request(server).get('/auth/mock').expect('Content-Type', /json/)
        .end(function(err, res) {
          expect(200);
          Cookies = res.headers['set-cookie'].pop().split(';')[0];
          done();
        });
    });
  });
  describe('# GET /servicelist', function(){
    it('should get service list data',function(done){
      var req = request(server).get('/servicelist');
      req.cookies = Cookies;
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
      .end(function(err,res){
        let body = JSON.parse(res.text);
        expect(body.success).to.equal(true);
        done();
      })
    })
  });
  describe('# OIDC Petition lifecycle',function(){
    it('should create a new petition and return the id',function(done){
      var req = request(server).post('/petition').send({
        type:'create',
        ...create.oidc
      }
      );
      req.cookies = Cookies;
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
    });
    it('should fetch created petition',function(done){
      var req = request(server).get('/petition/'+petition);
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            should(diff(create.oidc,body.petition)).not.exist();
            done();
          })
    });
    it('should edit petition that was created',function(done){
      var req = request(server).put('/petition/'+petition).send({
        type:'create',
        ...edit.oidc
      });
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            done();
          })
    });
    it('should delete petition that was created',function(done){
      var req = request(server).delete('/petition/'+petition)
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            done();
          })
    });
  });
  describe('# SAML Petition lifecycle',function(){
    it('should create a new petition and return the id',function(done){
      var req = request(server).post('/petition').send({
        type:'create',
        ...create.saml
      });
      req.cookies = Cookies;
      req.set('Accept','application/json')
      .expect('Content-Type',/json/)
      .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
    });
    it('should fetch created petition',function(done){
      var req = request(server).get('/petition/'+petition);
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            done();
          })
    });
    it('should edit petition that was created',function(done){
      var req = request(server).put('/petition/'+petition).send({
        type:'create',
        ...edit.saml
      });
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            done();
          })
    });
    it('should delete petition that was created',function(done){
      var req = request(server).delete('/petition/'+petition)
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            done();
          })
    });
  });
  describe('# Service lifecycle',function(){
    describe('# Create Service',function(){
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/petition').send({
          type:'create',
          ...create.oidc
        });
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
      });
      it('should approve petition and create service',function(done){
        var req = request(server).put('/petition/approve/'+petition);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.service_id).to.be.a('number');
          service = body.service_id;
          done();
        })
      });
      it('should get created service',function(done){
        var req = request(server).get('/service/'+service);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          done();
        })
      });
    });
    describe('# Edit Service',function(){
      it('should create a new edit petition and return the id',function(done){
        var req = request(server).post('/petition').send({
          type:'edit',
          service_id:service,
          ...edit.oidc
        });
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          done();
        })
      });
      it('should approve petition and edit service',function(done){
        var req = request(server).put('/petition/approve/'+petition);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.service_id).to.be.a('number');
          service = body.service_id;
          done();
        })
      });
      it('should get edited service',function(done){
        var req = request(server).get('/service/'+service);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          should(diff(edit.oidc,body.service)).not.exist();
          done();
        })
      });
    });
    describe('# Delete Service',function(){
      it('should create a new delete petition',function(done){
        var req = request(server).put('/service/delete/'+service);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.id).to.be.a('number');
          petition = body.id
          expect(body.success).to.equal(true);
          done();
        })
      });
      it('should approve petition and delete service',function(done){
        var req = request(server).put('/petition/approve/'+petition);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          done();
        })
      });
      it('should fail to get deleted service',function(done){
        var req = request(server).get('/service/'+service);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(false);
          done();
        })
      });
    });
  });
  describe('# Admin Actions',function(){
    describe('# Reject Petition',function(){
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/petition').send({
          type:'create',
          ...create.oidc
        });
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
      });
      it('should reject petition',function(done){
        var req = request(server).put('/petition/reject/'+petition);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          done();
        })
      });
    });
    describe('# Request Changes Petition',function(){
      it('should create a new petition and return the id',function(done){
        var req = request(server).post('/petition').send({
          type:'create',
          ...create.oidc
        });
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
      });
      it('should request changes petition',function(done){
        var req = request(server).put('/petition/changes/'+petition).send({
          comment:"comment"
        });
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          expect(body.id).to.be.a('number');
          petition = body.id;
          done();
        })
      });
      it('should delete petition',function(done){
        var req = request(server).delete('/petition/'+petition);
        req.cookies = Cookies;
        req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
        .end(function(err,res){
          let body = JSON.parse(res.text);
          expect(body.success).to.equal(true);
          done();
        })
      });
    });
  });
});
