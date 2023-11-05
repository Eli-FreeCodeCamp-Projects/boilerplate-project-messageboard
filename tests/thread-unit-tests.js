const chai = require('chai');
const assert = chai.assert;
const Ut = require('../utils/utils');
const Thread = require('../models/Thread');
let testIds={}

const IsValidCommonThread = (thread)=>{
    assert.isObject(
        thread, 
        'The method sould return a thread object'
    )
    assert.isString(
        thread._id.toString(), 
        'Thread should have a string _id value'
    )
    assert.isString(
        thread.text, 
        'Thread should have a string text value'
    )
    assert.isArray(
        thread.replies,
        'Thread object must contain an array of replies.'
    )
}
const IsValidShowThread = (thread)=>{
    IsValidCommonThread(thread)
    assert.isString(
        thread.created_on, 
        'Thread should have a string created_on value'
    )
    assert.isString(
        thread.bumped_on, 
        'Thread should have a string bumped_on value'
    )
}
const IsValidObjectThread = (thread)=>{
    IsValidCommonThread(thread)
    assert.isTrue(
        Ut.isObject(thread.bumped_on), 
        'Thread should have a bumped_on date object value.'
    )
    assert.isTrue(
        Ut.isObject(thread.created_on), 
        'Thread should have a created_on date object value'
    )
    assert.isString(
        thread.delete_password, 
        'Thread should have a string delete_password value'
    )
    assert.isBoolean(
        thread.reported, 
        'Thread should have a boolean reported value'
    )
}

const IsValidCommonReplyThread = (reply)=>{
    assert.isObject(
        reply, 
        'The method sould return a reply object'
    )
    assert.isString(
        reply._id.toString(), 
        'reply should have a string _id value'
    )
    assert.isString(
        reply.text, 
        'reply should have a string text value'
    )
}

const IsValidShowReplyThread = (reply)=>{
    IsValidCommonReplyThread(reply)
    assert.isString(
        reply.created_on, 
        'reply should have a string created_on value'
    )
}

const IsValidObjectReplyThread = (reply)=>{
    IsValidCommonReplyThread(reply)
    assert.isTrue(
        Ut.isObject(reply.created_on), 
        'reply should have a created_on date object value.'
    )
    assert.isString(
        reply.delete_password, 
        'reply should have a delete_password date object value'
    )
    assert.isBoolean(
        reply.reported, 
        'reply should have a boolean reported value'
    )
}
suite('Mongo db unit tests', function(){
    this.timeout(8000);
    suite('Test Thread model with invalid values', function(){
        test('test addThread method with non string password property', function(done) {
            Thread.addThread('testBoard', 'Add unit test thread', {$gt: 'hello'})
                .then(()=>{
                    done(new Error("addThread method should fail and reject promise"));
                })
                .catch((err) => {
                    assert.strictEqual(
                        err, "Unable to add thread to board, only strings are accepted for properties (board, text and password)",
                        'Error message should be a defined string.');
                    done();
                });
        });

        test('test addThread method with non string text property', function(done) {
            Thread.addThread('testBoard', {$gt: 'hello'}, 'azerty')
                .then(()=>{
                    done(new Error("addThread method should fail and reject promise"));
                })
                .catch((err) => {
                    assert.strictEqual(
                        err, "Unable to add thread to board, only strings are accepted for properties (board, text and password)",
                        'Error message should be a defined string.');
                    done();
                });
        });

        test('test addThread method with non string board property', function(done) {
            Thread.addThread({$gt: 'hello'}, 'text', 'azerty')
                .then(()=>{
                    done(new Error("addThread method should fail and reject promise"));
                })
                .catch((err) => {
                    assert.strictEqual(
                        err, "Unable to add thread to board, only strings are accepted for properties (board, text and password)",
                        'Error message should be a defined string.');
                    done();
                });
        });
    });
    suite('Test Thread model with valid values', ()=>{
        test('test addThread method', function(done) {
            Thread.addThread('testBoard', 'Add unit test thread', 'azerty')
                .then(thread=>{
                    IsValidObjectThread(thread)
                    assert.strictEqual(
                        thread.replies.length, 0,
                        'Array of replies should have length 0');
                        testIds.threadId = thread._id.toString();
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test second addThread method', function(done) {
            Thread.addThread('testBoard', 'Add unit test thread', 'azerty')
                .then(thread=>{
                    IsValidObjectThread(thread);
                    assert.strictEqual(
                        thread.replies.length, 0,
                        'Array of replies should have length 0');
                        testIds.threadIdReplyTest = thread._id.toString();
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test reportThread method', function(done) {
            Thread.reportThread(testIds.threadId)
                .then(thread=>{
                    IsValidObjectThread(thread)
                    assert.isTrue(
                        thread.reported,
                        'Thread sould be reported'
                        )
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test getThreads method', function(done) {
            Thread.getThreads('testBoard')
                .then(threads=>{
                    IsValidShowThread(threads[0])
                    IsValidShowThread(threads[1])
                    assert.isArray(
                        threads,
                        'The method sould return an array of threads.'
                        )
                    assert.isTrue(
                        threads.length >= 2,
                        'Array of threads should have length equal or upper to 2');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test getThread method', function(done) {
            Thread.getThread(testIds.threadId)
                .then(thread=>{
                    IsValidObjectThread(thread)
                    assert.strictEqual(
                        thread.replies.length, 0,
                        'Array of replies should have length 0');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test isThreadPassWord method with valid password', function(done) {
            Thread.isThreadPassWord(testIds.threadId, 'azerty')
                .then(({isMatch, thread})=>{
                    IsValidObjectThread(thread)
                    assert.isTrue(
                        isMatch,
                        'Valid massword should match');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test isThreadPassWord method with invalid password', function(done) {
            Thread.isThreadPassWord(testIds.threadId, 'BadPassword')
                .then(({isMatch, thread})=>{
                    assert.isNull(
                        thread,
                        "If password not match thread should be null.")
                    assert.isFalse(
                        isMatch,
                        'Valid massword should not match');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test deleteThread method with invalid password', function(done) {
            Thread.deleteThread(testIds.threadId, 'BadPassword')
                .then((isDeleted)=>{
                    assert.isFalse(
                        isDeleted,
                        'Delete should fails with invalid password');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test deleteThread method with valid password', function(done) {
            Thread.deleteThread(testIds.threadId, 'azerty')
                .then((isDeleted)=>{
                    assert.isTrue(
                        isDeleted,
                        'Delete should success with valid password');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test if thread has realy been deleted by find it', function(done) {
            Thread.getThread(testIds.threadId)
                .then(thread=>{
                    assert.isNull(
                        thread,
                        "If thread don't exist in the data base, should be null ");
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });


        test('test addReply method', function(done) {
            Thread.addReply(testIds.threadIdReplyTest, 'Add reply to unit test thread', 'azerty')
                .then(thread=>{
                    IsValidObjectThread(thread)
                    IsValidObjectReplyThread(thread.replies[0])
                    assert.strictEqual(
                        thread.replies.length, 1,
                        'Array of replies should have length 0');
                    testIds.replyId = thread.replies[0]._id.toString();
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test add second reply', function(done) {
            Thread.addReply(testIds.threadIdReplyTest, 'Add reply 2 to unit test thread', 'azerty')
                .then(thread=>{
                    IsValidObjectThread(thread)
                    IsValidObjectReplyThread(thread.replies[0])
                    IsValidObjectReplyThread(thread.replies[1])
                    assert.strictEqual(
                        thread.replies.length, 2,
                        'Array of replies should have length 2');
                    testIds.replyId2 = thread.replies[0]._id.toString();
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test getReplies method', function(done) {
            Thread.getReplies(testIds.threadIdReplyTest)
                .then(thread=>{
                    IsValidShowThread(thread)
                    IsValidShowReplyThread(thread.replies[0])
                    IsValidShowReplyThread(thread.replies[1])
                    assert.strictEqual(
                        thread.replies.length, 2,
                        'Array of replies should have length 2');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test getReply method', function(done) {
            Thread.getReply(testIds.threadIdReplyTest, testIds.replyId)
                .then(thread=>{
                    IsValidObjectThread(thread)
                    IsValidObjectReplyThread(thread.replies[0])
                    assert.strictEqual(
                        thread.replies.length, 1,
                        'Array of replies should have length 1');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test reportReply method', function(done) {
            Thread.reportReply(testIds.threadIdReplyTest, testIds.replyId)
                .then(thread=>{
                    IsValidObjectThread(thread)
                    IsValidObjectReplyThread(thread.replies[0])
                    assert.strictEqual(
                        thread.replies.length, 1,
                        'Array of replies should have length 1'
                    );
                    assert.isTrue(
                        thread.replies[0].reported,
                        'Reply should be reported.');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test isValidReplyPassWord method with invalid password', function(done) {
            Thread.isValidReplyPassWord(testIds.threadIdReplyTest, testIds.replyId, "BadPassword")
                .then(({isMatch, thread})=>{
                    assert.isFalse(
                        isMatch,
                        'Password should not match.'
                    );
                    assert.isNull(
                        thread,
                        'Thread must be null.'
                    );
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test isValidReplyPassWord method with valid password', function(done) {
            Thread.isValidReplyPassWord(testIds.threadIdReplyTest, testIds.replyId, "azerty")
                .then(({isMatch, thread})=>{
                    IsValidObjectThread(thread)
                    IsValidObjectReplyThread(thread.replies[0])
                    assert.strictEqual(
                        thread.replies.length, 1,
                        'Array of replies should have length 1'
                    );
                    assert.isTrue(
                        isMatch,
                        'Password should match.');
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test deleteReply method with invalid password', function(done) {
            Thread.deleteReply(testIds.threadIdReplyTest, testIds.replyId, "BadPassword")
                .then((isDeleted)=>{
                    assert.isFalse(
                        isDeleted,
                        'Reply should not be deleted.'
                    );
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

        test('test deleteReply method with valid password', function(done) {
            Thread.deleteReply(testIds.threadIdReplyTest, testIds.replyId, "azerty")
                .then((isDeleted)=>{
                    assert.isTrue(
                        isDeleted,
                        'Reply should be deleted.'
                    );
                    done();
                })
                .catch((err) => {
                    done(new Error(err));
                });
        });

    });
});