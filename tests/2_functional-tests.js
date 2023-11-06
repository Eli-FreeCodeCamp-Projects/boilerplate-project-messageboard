const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let threadId, threadIdForReply, replyId;
suite('Functional Tests', function() {
    this.timeout(8000);
    suite('Test route /api/threads/:board', ()=>{
        test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
            chai
                .request(server)
                .post('/api/threads/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    text: 'My test thread',
                    delete_password: 'azerty'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.strictEqual(res.body.text, 'My test thread');
                    assert.isArray(res.body.replies);
                    assert.isString(res.body.bumped_on);
                    assert.isString(res.body.created_on);
                    assert.isString(res.body._id);
                    threadId = res.body._id
                    done();
                });
        });

        test('Creating a new thread: for replies test', function (done) {
            chai
                .request(server)
                .post('/api/threads/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    text: 'My Thread for replies test',
                    delete_password: 'azerty'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.strictEqual(res.body.text, 'My Thread for replies test');
                    assert.isArray(res.body.replies);
                    assert.isString(res.body.bumped_on);
                    assert.isString(res.body.created_on);
                    assert.isString(res.body._id);
                    threadIdForReply = res.body._id
                    done();
                });
        });

        test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
            chai.request(server)
                .get('/api/threads/general')
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body, 'response should be an object');
                    assert.isTrue(res.body.length <= 10, "Response will return the 10 most recent threads ")
                    assert.isTrue(res.body[0].replies.length <= 3, "One Thread will contain 3 most recent replies")
                    done();
                });
        });

        test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function (done) {
            chai
                .request(server)
                .delete('/api/threads/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadId,
                    delete_password: 'bad'
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'incorrect password');
                    done();
                });
        });

        test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
            chai
                .request(server)
                .put('/api/threads/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                      thread_id: threadId
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'reported');
                    done();
                });
        });

        test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
            chai
                .request(server)
                .delete('/api/threads/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadId,
                    delete_password: 'azerty'
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'success');
                    done();
                });
        });

        
    })

    suite('Test routes /api/replies/:board', ()=>{
        test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
            chai
                .request(server)
                .post('/api/replies/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadIdForReply,
                    text: 'My first reply',
                    delete_password: 'azerty'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.strictEqual(res.body.text, 'My Thread for replies test');
                    assert.isTrue(res.body.created_on !== res.body.bumped_on)
                    assert.isString(res.body.created_on);
                    assert.isString(res.body._id);
                    assert.isArray(res.body.replies);
                    assert.isObject(res.body.replies[0])
                    assert.strictEqual(res.body.replies[0].text, 'My first reply');
                    assert.isString(res.body.replies[0]._id);
                    assert.isFalse(res.body.replies[0].reported);
                    replyId = res.body.replies[0]._id
                    done();
                });
        });

        test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
            chai.request(server)
                .get('/api/replies/general?thread_id='+threadIdForReply)
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.strictEqual(res.body._id, threadIdForReply);
                    assert.strictEqual(res.body.text, 'My Thread for replies test');
                    assert.isArray(res.body.replies);
                    assert.isObject(res.body.replies[0])
                    assert.strictEqual(res.body.replies[0].text, 'My first reply');
                    assert.isString(res.body.replies[0]._id);
                    done();
                });
        });

        test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function (done) {
            chai
                .request(server)
                .delete('/api/replies/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadIdForReply,
                    reply_id: replyId,
                    delete_password: 'bad'
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'incorrect password');
                    done();
                });
        });

        test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
            chai
                .request(server)
                .put('/api/replies/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadIdForReply,
                    reply_id: replyId
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'reported');
                    done();
                });
        });

        test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function (done) {
            chai
                .request(server)
                .delete('/api/replies/general')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    thread_id: threadIdForReply,
                    reply_id: replyId,
                    delete_password: 'azerty'
                })
                .end(function (res) {
                    assert.equal(res.statusCode, 200);
                    assert.strictEqual(res.rawResponse, 'success');
                    done();
                });
        });

    })
});

teardown(function() {
    chai.request(server)
      .get('/')
  });

