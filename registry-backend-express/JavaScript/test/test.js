'use-strict';

var app = require('../index.js');
var chai = require('chai');
var request = require('supertest');
var {create,edit} = require('./data.js');
var expect = chai.expect;
var Cookies;
var petition;
var diff = require('deep-diff').diff;
//var petition=10;

describe('Service registry API Integration Tests', function() {

  beforeEach(done => setTimeout(done, 500));
  describe('#GET /auth/mock', function() {
    it('should get session cookie', function(done) {
      request(app).get('/auth/mock').expect('Content-Type', /json/)
        .end(function(err, res) {
          expect(200);
          Cookies = res.headers['set-cookie'].pop().split(';')[0];
          done();
        });
    });
  });
  describe('# GET /servicelist', function(){
    it('should get service list data',function(done){
      var req = request(app).get('/servicelist');
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
  describe('# Create Petition',function(){
    it('should create a new petition and return the id',function(done){
      create.oidc.type='create';
      var req = request(app).post('/newpetition/create').send(
        create.oidc
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
  });
  describe('# GET Petition OIDC',function(){
    it('should fetch created petition',function(done){
      var req = request(app).get('/getpetition/'+petition);
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
  })
  describe('# Edit Petition OIDC',function(){
    it('should edit petition that was created',function(done){
      edit.oidc.type='edit';
      var req = request(app).post('/petition/edit/'+petition).send(
        edit.oidc
      );
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
  })
  describe('# DELETE Petition OIDC',function(){
    it('should delete petition that was created',function(done){
      var req = request(app).put('/petition/delete/'+petition)
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
  })
  describe('# Create Petition SAML',function(){
    it('should create a new petition and return the id',function(done){
      create.saml.type='create';
      var req = request(app).post('/newpetition/create').send(
        create.saml
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
  });
  describe('# GET Petition SAML',function(){
    it('should fetch created petition',function(done){
      var req = request(app).get('/getpetition/'+petition);
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
  })
  describe('# Edit Petition SAML',function(){
    it('should edit petition that was created',function(done){
      edit.saml.type='edit';
      var req = request(app).post('/petition/edit/'+petition).send(
        edit.saml
      );
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
  describe('# DELETE Petition SAML',function(){
    it('should delete petition that was created',function(done){
      var req = request(app).put('/petition/delete/'+petition)
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

  describe('# Create Service',function(){
    it('should create a new petition and return the id',function(done){
      create.oidc.type='create';
      var req = request(app).post('/newpetition/create').send(
        create.oidc
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
    it('should approve petition and create service',function(done){
      var req = request(app).put('/petition/approve/'+petition);
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
      var req = request(app).get('/getservice/'+service);
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
