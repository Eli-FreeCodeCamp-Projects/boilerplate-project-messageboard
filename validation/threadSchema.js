'use strict';
const ObjectId = require('mongoose').Types.ObjectId;
const bcrypt = require('bcrypt');
const Thread = require('../models/Thread.js');
const Ut = require('../utils/utils.js');
const MongoHelper = require('../utils/mongoHelper.js');

const threadSchema = {
    _id:{
        isString: { errorMessage: "Thread id should be string" },
        exists: { errorMessage: "Thread id is required" },
        trim: true,
        customSanitizer: {
        options: (value) => {
                return new ObjectId(value);
            }
        }
    },
    board:{
        isString: { errorMessage: "Board should be string" },
        trim: true,
        exists: { errorMessage: "Board is required" },        
        escape: true,
        custom:{
            options: (value, params) =>{
                if(!MongoHelper.isValidBoard(value)){
                    params.errorMessage = 'Invalid board name, field must contain only alphanumeric and [-_] characters';
                    return false;
                }
                return true;
            }
        }
    },
    text: {
        isString: { errorMessage: "Thread text should be string" },
        trim: true,
        exists: { errorMessage: "Thread text is required" },        
        escape: true,
    },
    delete_password: {
        isString: { errorMessage: "Delete password should be string" },
        trim: true,
        exists: { errorMessage: "Delete password is required" },        
        escape: true,
    }
}

const getThreadSchema = {
    board: threadSchema.board
}

const postThreadSchema = {
    board: threadSchema.board,
    text: threadSchema.text,
    delete_password: threadSchema.delete_password
}

const putThreadSchema = {
    report_id: threadSchema._id
}

const deleteThreadSchema = {
    thread_id: threadSchema._id,
    delete_password: threadSchema.delete_password
}

const getRepliesSchema = {
    thread_id: threadSchema._id
}

const postReplySchema = {
    thread_id: threadSchema._id,
    text: threadSchema.text,
    password: threadSchema.password
}

const putReplySchema = {
    reply_id: threadSchema._id,
    report_id: threadSchema._id
}

const deleteReplySchema = {
    reply_id: threadSchema._id,
    report_id: threadSchema._id
}


exports.getThreadSchema = getThreadSchema;
exports.postThreadSchema = postThreadSchema;
exports.putThreadSchema = putThreadSchema;
exports.deleteThreadSchema = deleteThreadSchema;
