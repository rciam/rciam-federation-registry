'use-strict';

var app = require('../index.js');
var chai = require('chai');
var request = require('supertest');
var expect = chai.expect;
var Cookies;
describe('Todos list API Integration Tests', function() {
  describe('#GET / tasks', function() {
    it('should get all tasks', function(done) {
      request(app).get('/test').expect('Content-Type', /json/)
        .end(function(err, res) {
          let ss = JSON.parse(res.text);
          expect(200);
          expect(ss.services).to.equal('yesd')
          done();
        });
    });
  });
  describe('Get Petition',function(){
    it('Should Create Session',function(done){
      request(app).get('/auth/mock').expect('Content-Type',/json/)
        .end(function(err,res){
          console.log(res);
          Cookies = res.headers['set-cookie'].pop().split(';')[0];
          console.log(Cookies);
          done();
        })
    })
    it('Should Access Protected Endpoint',function(done){
      var req = request(app).get('/test/auth');
      // Set cookie to get saved user session
      req.cookies = Cookies;
      req.set('Accept','application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          let ss = JSON.parse(res.text);
          expect(200);
          expect(ss.services).to.equal('yesd')
          done();
        })
    });
  });
});
