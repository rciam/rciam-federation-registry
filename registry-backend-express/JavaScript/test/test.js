'use-strict';

var app = require('../index.js');
var chai = require('chai');
var request = require('supertest');
var {create,edit} = require('./data.js');
var expect = chai.expect;
var Cookies;
var petition;
//var petition=10;

describe('Service registry API Integration Tests', function() {
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
  describe('#POST /newpetition/create',function(){
    it('should create a new petition and return the id',function(done){
      var req = request(app).post('/newpetition/create').send(
        create
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
          console.log(petition);
          done();
        })
    });
    it('should fetch edited petition',function(done){
      var req = request(app).post('/get/petition/'+petition);
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            expect(body.success).to.equal(true);
            console.log(body);
            done();
          })
    })
    it('should edit petition that was created',function(done){
      var req = request(app).post('/petition/edit/'+petition).send(
        edit
      );
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200)
          .end(function(err,res){
            let body = JSON.parse(res.text);
            console.log(body);
            expect(body.success).to.equal(true);
            done();
          })
    });
  });
});
