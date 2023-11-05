'use strict';
let mongoose = require('mongoose')
const ObjectId = require('mongoose').Types.ObjectId;
const MongoHelper = require('../utils/mongoHelper');
const Ut = require('../utils/utils');

const hashSaltRounds = 8;

const ReplySchema = new mongoose.Schema({
    _id:{
        type: ObjectId,
        default: new ObjectId(),
    },
    text: {
        type: String,
        required: [
            true,
            "Threads text is required."
        ],
        trim: true,
        minLength: [
            1, 
            'Threads text must contain at least two characters!'
        ],
        maxLength: [
            500, 
            'Threads text must contain 500 characters maxi!'
        ]
    },
    delete_password: {
        type: String,
        required: true,
        trim: true
    },
    created_on: {
        type: Date,
        default: new Date(),
    },
    reported: {
        type: Boolean,
        default: false
    }
});

const threadsSchema = new mongoose.Schema(
    {
        board: {
            type: String,
            required: [
                true,
                "Threads board is required."
            ],
            trim: true,
            minLength: [
                2, 
                'Threads board must contain at least two characters!'
            ],
            maxLength: [
                30, 
                'Threads board must contain 30 characters maxi!'
            ],
            match: [
                /^([A-z0-9-_]+)$/, 
                'Board name can contain only Alphanumerical characters, "-" or "_".'
            ]
        },
        text: {
            type: String,
            required: [
                true,
                "Threads text is required."
            ],
            trim: true,
            minLength: [
                1, 
                'Threads text must contain at least two characters!'
            ],
            maxLength: [
                500, 
                'Threads text must contain 500 characters maxi!'
            ]
        },
        delete_password: {
            type: String,
            required: true,
            trim: true
        },
        created_on: {
            type: Date,
            default: new Date(),
        },
        bumped_on: {
            type: Date,
            default: new Date(),
        },
        reported: {
            type: Boolean,
            default: false
        },
        replies: {
            type: [ReplySchema],
        }
    },
    {
        statics: {
            getThreadKeys(){
                return [
                    "_id", "text", "created_on", "replies", "bumped_on"
                ]
            },
            getreplyKeys(){
                return [
                    "_id", "text", "created_on"
                ]
            },
            filterRepliesFields(replies){
                let result = null;
                if(Ut.isArray(replies)){
                    result = replies.map(obj=>{
                        return {
                            _id: obj._id.toString(),
                            text: obj.text,
                            created_on: obj.created_on.toISOString()
                        }
                    })
                }
                return result
            },
            filterThreadFields(thread){
                if(Ut.isObject(thread)){
                    return {
                        _id: thread._id.toString(),
                        text: thread.text,
                        created_on: thread.created_on.toISOString(),
                        bumped_on: thread.bumped_on.toISOString(),
                        replies: this.filterRepliesFields(thread.replies),
                    }
                }
                return null
            },
            filterThreadsFields(threads){
                let result = null;
                if(Ut.isArray(threads)){
                    result = threads.map(obj=>{
                        return this.filterThreadFields(obj)
                    })
                }
                return result
            },
            /**
             * 
             * @param {*} board 
             * @param {*} limit 
             * @param {*} limitReplies 
             * @returns 
             */
            getThreads(board, limit=10, limitReplies=3){
                return new Promise((resolve, reject) => {
                    if(!Ut.isStrNotEmpty(board)){
                        reject({'error': "Invalid Thread Board name"})
                    }
                    if(!Ut.isPositiveNumber(limit)){
                        reject({'error': "Invalid Thread limit"})
                    }
                    if(!Ut.isPositiveNumber(limitReplies)){
                        reject({'error': "Invalid Replies limit"})
                    }
                    this.find({board: board})
                        .limit(limit)
                        .slice('replies', limitReplies)
                        .then(threads=>{
                            resolve(this.filterThreadsFields(threads))
                        })
                        .catch((err)=>{
                            reject({error: "Unable to get threads from board", info: err})
                        })
                });
            },
            getThread(threadId){
                return new Promise((resolve, reject) => {
                    this.findById(threadId)
                        .then(thread=>{
                            resolve(thread)
                        })
                        .catch((err)=>{
                            reject({error: "Unable to delete thread!", info: err})
                        })
                });
            },
            addThread(board, text, password){
                return new Promise((resolve, reject) => {
                    if(!Ut.isStrNotEmpty(board) 
                        || !Ut.isStrNotEmpty(text) 
                        || !Ut.isStrNotEmpty(password)){
                        reject("Unable to add thread to board, only strings are accepted for properties (board, text and password)")
                    }
                    MongoHelper.hashPassword(password, hashSaltRounds)
                        .then(hash=>{
                            this.create({
                                board:board,
                                text:text,
                                delete_password:hash
                            })
                                .then(newThread=>{
                                    resolve(newThread)
                                })
                                .catch((err)=>{
                                    reject({error: "Unable to add thread to board", info: err})
                                })
                        })
                        .catch(err => reject(err))
                    
                });
            },
            reportThread(threadId){
                return new Promise((resolve, reject) => {
                    this.findByIdAndUpdate(
                            threadId,
                            {reported: true},
                            {returnDocument: 'after'}
                            )
                        .then(thread=>{
                            resolve(thread)
                        })
                        .catch((err)=>{
                            reject({error: "Unable to report thread!", info: err})
                        })
                });
            },
            isThreadPassWord(threadId, password){
                return new Promise((resolve, reject) => {
                    this.getThread(threadId)
                        .then(thread=>{
                            if(Ut.isObject(thread)){
                                MongoHelper.comparePassword(password, thread.delete_password)
                                    .then(isMatch=>{
                                        if(isMatch === true){
                                            resolve({isMatch, thread})
                                        }
                                        else{
                                            resolve({isMatch, thread: null})
                                        }
                                    })
                                    .catch((err)=>{
                                        reject({error: "Unable to compare reply passwords", info: err.message})
                                    })
                            }
                            else{
                                resolve({error: "Thread is empty or not exist in the data base", info: err.message})
                            }
                        })
                        .catch((err)=>{
                            reject({error: "Unable to get reply", info: err.message})
                        })
                });
            },
            deleteThread(threadId, password){
                return new Promise((resolve, reject) => {
                    this.isThreadPassWord(threadId, password)
                        .then(({isMatch, thread})=>{
                            if(isMatch === true){
                                this.deleteOne({_id: threadId})
                                    .then(deleted=>{  
                                        if(deleted.deletedCount === 1){
                                            resolve(true)
                                        }
                                        else{
                                            resolve(false)
                                        }
                                    })
                                    .catch((err)=>{
                                        reject({error: "Unable to delete thread!", info: err})
                                    })
                            }
                            else{
                                resolve(false)
                            }
                            
                        })
                        .catch((err)=>{
                            reject({error: "Unable to delete thread!", info: err})
                        })
                });
            },
            getReplies(threadId){
                return new Promise((resolve, reject) => {
                    this.getThread(threadId)
                        .then(thread=>{
                            if(Ut.isObject(thread)){
                                resolve(resolve(this.filterThreadFields(thread)))
                            }
                            else{
                                resolve(null)
                            }
                        })
                        .catch((err)=>{
                            reject({error: "Unable to delete thread!", info: err})
                        })
                });
            },
            getReply(threadId, replyId){
                return new Promise((resolve, reject) => {
                    this.findById(
                            {_id: threadId, 'replies._id': replyId}
                            )
                        .slice('replies', 1)
                        .then(thread=>{
                            if(Ut.isObject(thread) 
                                && Ut.isArray(thread.replies)
                                && thread.replies.length === 1){
                                    resolve(thread.toObject())
                            }
                            else{
                                resolve(null)
                            }
                        })
                        .catch((err)=>{
                            reject({error: "Unable to delete thread!", info: err})
                        })
                });
            },
            addReply(threadId, text, password){
                return new Promise((resolve, reject) => {
                    MongoHelper.hashPassword(password, hashSaltRounds)
                        .then(hash=>{
                            this.findByIdAndUpdate(
                                threadId, 
                                {
                                    $push: {replies: {text: text, delete_password: hash}},
                                    bumped_on: new Date()
                                },
                                {
                                    returnDocument: 'after',
                                    sort: {'replies.created_on': -1},
                                    markModified: 'bumped_on'
                                })
                            .then(thread=>{                            
                                resolve(thread)
                            })
                            .catch((err)=>{
                                reject({error: "Unable to add reply!", info: err})
                            })
                        })
                        .catch(err => reject(err))
                    
                });
            },
            /**
             * Report reply from thread
             * @param {string} threadId 
             * @param {string} replyId 
             * @returns {Promise} Return 
             * @see https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/
             * @see https://stackoverflow.com/questions/15691224/mongoose-update-values-in-array-of-objects
             */
            reportReply(threadId, replyId){
                return new Promise((resolve, reject) => {
                    this.findByIdAndUpdate(
                            {_id: threadId, 'replies._id': replyId},
                            {
                                $set:{[`replies.$[elem].reported`]: true}
                            },
                            {
                                returnDocument: 'after',
                                arrayFilters: [{ "elem._id": replyId }]
                            })
                        .slice('replies', 1)
                        .then(thread=>{
                            resolve(thread)
                        })
                        .catch((err)=>{
                            reject({error: "Unable to repport reply!", info: err})
                        })
                });
            },
            isValidReplyPassWord(threadId, replyId, password){
                return new Promise((resolve, reject) => {
                    this.getReply(threadId, replyId)
                        .then(thread=>{
                            if(Ut.isObject(thread)){
                                const reply = thread.replies[0];
                                MongoHelper.comparePassword(password, reply.delete_password)
                                    .then(isMatch=>{
                                        if(isMatch === true){
                                            resolve({isMatch, thread})
                                        }
                                        else{
                                            resolve({isMatch, thread: null})
                                        }
                                    })
                                    .catch((err)=>{
                                        reject({error: "Unable to compare reply passwords", info: err.message})
                                    })
                            }
                            else{
                                resolve({isMatch: false, thread: null})
                            }
                        })
                        .catch((err)=>{
                            reject({error: "Unable to get reply", info: err.message})
                        })
                });
            },
            /**
             * ToDo: Must validate password before deleting
             * @param {*} threadId 
             * @param {*} replyId 
             * @returns {Promise} 
             */
            deleteReply(threadId, replyId, password){
                return new Promise((resolve, reject) => {
                    this.isValidReplyPassWord(threadId, replyId, password)
                        .then(({isMatch, thread})=>{
                            if(isMatch === true){
                                this.updateOne(
                                    {_id: threadId, 'replies._id': replyId},
                                    {
                                        $pull: { replies: {_id: replyId}}
                                    },
                                    {
                                        returnDocument: 'after',
                                        secure: true
                                    })
                                .slice('replies', 1)
                                .then(deletedReply=>{
                                    if(Ut.isObject(deletedReply)){
                                        resolve(true)
                                    }
                                    else{
                                        resolve(false)
                                    }
                                })
                                .catch((err)=>{
                                    reject({error: "Unable to delete reply!", info: err})
                                })
                            }
                            else{
                                resolve(false)
                            }
                        })
                        .catch((err)=>{
                            reject({error: "Unable to delete reply!", info: err})
                        })
                    
                });
            },
            
            
        }
    }
);

module.exports = mongoose.model('Threads', threadsSchema);