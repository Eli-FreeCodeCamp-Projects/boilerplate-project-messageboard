'use strict';
const Ut = require('../utils/utils');
const bcrypt = require('bcrypt');
const ObjectId = require('mongoose').Types.ObjectId;
module.exports = class MongoHelper{
    static boardMatch = /^([A-z0-9-_]+)$/
    static isValidObjectId(id){
        try{
            if(ObjectId.isValid(id)){
                if((String)(new ObjectId(id)) === id){
                    return true;
                }
            }
            return false;
        }
        catch{
            return false;
        }
    }

    static isValidBoard(board){
        return Ut.isStrNotEmpty(board) && MongoHelper.boardMatch.test(board)
    }

    static isValidText(text){
        return Ut.isStrNotEmpty(text)
    }

    static isValidPassword(text){
        return Ut.isStrNotEmpty(text)
    }

    static getIsoDate(){
        const date = new Date()
         return date.toISOString()
    }

    static hashPassword(password, saltRounds){
        return new Promise((resolve, reject) => {
            bcrypt
                .hash(password, saltRounds)
                .then(hash => {
                    resolve(hash)
                })
                .catch(err => reject(err))
        })
    }

    static comparePassword(candidatePassword, hash){
        return new Promise((resolve, reject) => {
            bcrypt
                .compare(candidatePassword, hash)
                .then(res => {
                    resolve(res) // return true
                })
                .catch(err => reject(err))
                
        })
    }
}