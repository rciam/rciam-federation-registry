var request = require('supertest');
var chai = require('chai');
var server = require('../index.js');
var expect = chai.expect;
var should = chai.should;
var {create,edit} = require('./data.js');
const base64url = require('base64url');
let token = {}

const createUserToken = (user) => {
  let header = base64url.encode(JSON.stringify({"alg":"none"}));
  const payload = base64url.encode(JSON.stringify({"user":user}));
  token = `Bearer ${header}.${payload}`;
  return token
}

const setUser = (user) => {
  let header = base64url.encode(JSON.stringify({"alg":"none"}));
  const payload = base64url.encode(JSON.stringify({"user":user}));
  token = `Bearer ${header}.${payload}`;
  return token
}

const postPetitionError = async (data,tenant,result,done) => {
  var req = request(server).post('/tenants/'+tenant+'/petitions').set({Authorization: token}).send({...data});
  req.set('Accept','application/json')
  .expect('Content-Type',/json/)
  .expect(422)
    .end(function(err,res){
      let body = JSON.parse(res.text);
      expect(res.statusCode).to.equal(422);
      expect(body).to.eql(result)
      done();
    })
}
const putPetition = async (data,result,done) => {
  var req = request(server).put('/tenants/'+data.tenant+'/petitions/'+data.petition).set({Authorization: token}).send(data.body);
  req.set('Accept','application/json')
    .expect('Content-Type',/json/)
    .expect(result.status)
    .end(function(err,res){
      let body = JSON.parse(res.text);
      expect(res.statusCode).to.equal(result.status);
      expect(body).to.eql(result.body)
      done();});
}





const checkAvailability = async (value,protocol,tenant,environment,result,done) => {
  var req = request(server).get('/tenants/'+tenant+'/check-availability?value=' + value+ '&protocol='+ protocol+'&environment='+environment).set({Authorization: token});
  req.set('Accept','application/json')
  .expect('Content-Type',/json/)
  .expect(200)
    .end(function(err,res){
      let body = JSON.parse(res.text);
      expect(body.available).to.be.a('boolean');
      expect(res.statusCode).to.equal(200);
      expect(body.available).to.equal(result);
      done();
    })
}


module.exports = {
  setUser,postPetitionError,checkAvailability,putPetition
}
