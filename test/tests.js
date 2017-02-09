const assert = require("assert");
const DiscovererClient = require('../client');
const DiscovererServer = require('../server');
const request = require('request');
const uuid = require('uuid');

describe('#discoverer server test', function () {
  this.timeout(1000);

  const listenHost = 'localhost';

  const listenPort = 3000;

  const server = new DiscovererServer(listenHost, listenPort);

  const serverUrl = `http://${listenHost}:${listenPort}`

  const discovererUrl = `http://${listenHost}:${listenPort}/discoverer`

  let testService = {
    instancePort: 80,
    serviceName: `testService-${uuid()}`,
    instanceId: uuid()
  }

  it('start test server', function (done) {
    server.start(() => {
      done();
    });
  })

  it('should throw 404 error', function (done) {
    request.get(`${discovererUrl}/not-exist/${uuid()}`, {
      json: true
    }, function (err, req, body) {
      if (err) throw err;
      assert.ok(body.status = 404);
      done();
    })
  })

  it('should get index page', function (done) {
    request.get(`${serverUrl}`, { json: true }, function (err, req, body) {
      if (err) throw err;
      assert.ok(body['routes'])
      done();
    })
  })

  it('should registe a client', function (done) {
    request.post(`${discovererUrl}/registe`, { json: true, body: testService }, function (err, req, body) {
      if (err) throw err;
      assert.ok(body);
      assert.equal(body.registed.serviceName, testService.serviceName)
      done();
    })
  })

  it('should see itself', function (done) {
    request.get(`${discovererUrl}/clients`, { json: true }, function (err, req, body) {
      if (err) throw err;
      assert.ok(body.services[testService.serviceName][testService.instanceId]);
      done();
    })
  })

  it('should check expired and remove expired instances', function (done) {
    request.get(`${discovererUrl}/checkExpired`, { json: true }, function (err, req, body) {
      if (err) throw err;
      assert.ok(body.removedCount >= 0);
      done();
    })
  })

  it('should stop the discoverer server', function () {
    server.stop();
  })

})


describe('#discoverer client test', function () {
  // disable timeout
  this.timeout(0);
  const server = new DiscovererServer();
  const client = new DiscovererClient();

  it('start discoverer server', function (done) {
    server.start(() => {
      done();
    });
  })


  it('should registe success', function (done) {
    client.registe(function (body) {
      assert.ok(body.registed.instanceId)
      assert.ok(client.heartbreak)
      done();
    });
  })

  it('should get itself', function (done) {
    client.clients(function (body) {
      assert.ok(body.services[client.serviceName][client.instanceId])
      done();
    })
  })

  it('should renew this instance', function (done) {
    client.renew(body => {
      assert.ok(body.renewed);
      done();
    })
  })

  it('should unregiste this instance', function (done) {
    client.unregiste(body => {
      assert.ok(body.unregisted);
      done();
    })
  })

  it('stop heartBreak', function () {
    client.stopHeartBreak()
  })

  it('should stop the discoverer server', function () {
    server.stop();
  })


})

