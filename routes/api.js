'use strict';
const Ut = require('../utils/utils');
const Thread = require('../models/Thread');
const { body, checkSchema, validationResult } = require('express-validator');
const threadSchema = require('../validation/threadSchema')
const mid = require('../middlewares/api-mid')
module.exports = function (app) {

  app.route('/api/threads/delete-all')
  .get(function (req, res) {
    Thread.deleteMany()
      .then((data)=>{
        res.json(data)
      })
      .catch((err)=>{
        res.json(err)
      })
  })
  
  app.route('/api/threads/:board')
    .get([
      mid.setApiContentType,
      checkSchema(threadSchema.getThreadSchema),
      mid.validateApi
    ],
      function (req, res) {
        const board = req.params.board
        Thread.getThreads(board)
          .then(threads => {
            res.json(threads)
          })
          .catch((err) => {
            res.json(err)
          })
      })

    .post([
      mid.setApiContentType,
      checkSchema(threadSchema.postThreadSchema),
      mid.validateApi
    ],
      function (req, res) {

        const board = req.params.board
        const text = req.body.text
        const password = req.body.delete_password
        Thread.addThread(board, text, password)
          .then(thread => {
            res.json(thread.toObject())
          })
          .catch((err) => {
            res.json(err)
          })
      })

    .put([
      mid.setApiContentType,
      checkSchema(threadSchema.putThreadSchema),
      mid.validateApi
    ],
      function (req, res) {
        const _id = req.body.thread_id
        Thread.reportThread(_id)
          .then(report => {
              res.status(200).send("reported")
          })
          .catch(e => {
              res.status(200).send("Unable to repport thread")
          })
      })

    .delete([
      mid.setApiContentType,
      checkSchema(threadSchema.deleteThreadSchema),
      mid.validateApi
    ],

      function (req, res) {
        const _id = req.body.thread_id
        const delete_password = req.body.delete_password
        Thread.deleteThread(_id, delete_password)
          .then(result => {
            if (result) {
                res.status(200).send('success')
            }
            else {
                res.status(200).send('incorrect password')
            }
          })
          .catch(e => {
            res.json(e)
          })
      })

  app.route('/api/replies/:board')
    .get([
      mid.setApiContentType,
      checkSchema(threadSchema.getRepliesSchema),
      mid.validateApi
    ],
      function (req, res) {
        const _id = req.query.thread_id
        Thread.getReplies(_id)
          .then(result => {
            res.json(result)
          })
          .catch(e => {
            res.json(e)
          })
      })

    .post([
      mid.setApiContentType,
      checkSchema(threadSchema.postReplySchema),
      mid.validateApi
    ],
      function (req, res) {
        const thread_id = req.body.thread_id
        const text = req.body.text
        const password = req.body.delete_password
        Thread.addReply(thread_id, text, password)
          .then(thread => {
            if (Ut.isObject(thread)) {
              res.json(thread.toObject())
            }
            else {
              res.json(`Thread with id ${thread_id} is not reachable.`)
            }
          })
          .catch((err) => {
            res.json(err)
          })
      })

    .put([
      mid.setApiContentType,
      checkSchema(threadSchema.putReplySchema),
      mid.validateApi
    ],
      function (req, res) {
        const thread_id = req.body.thread_id
        const reply_id = req.body.reply_id
        Thread.reportReply(thread_id, reply_id)
          .then(thread => {
            if (Ut.isObject(thread)) {
                res.status(200).send("reported")
            }
            else {
                res.status(200).send("Unable to report thread, inexistant in data base.")
            }
          })
          .catch(e => {
              res.status(200).send("Unable to repport thread")
          })
      })

    .delete([
      mid.setApiContentType,
      checkSchema(threadSchema.deleteReplySchema),
      mid.validateApi
    ],
      function (req, res) {
        const thread_id = req.body.thread_id
        const reply_id = req.body.reply_id
        const delete_password = req.body.delete_password
        Thread.deleteReply(thread_id, reply_id, delete_password)
          .then(isDeleted => {
            if (isDeleted === true) {
              res.status(200).send('success')
            }
            else {
              res.status(200).send('incorrect password')
            }
          })
          .catch(e => {
              res.status(200).send("Unable to delete reply")
          })
      })
};
