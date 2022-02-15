
function ReplyHandler() {

  var mongo = require('mongodb').MongoClient;
  var ObjectId = require('mongodb').ObjectID;
  var url = process.env.DB;

    // get
    this.replyList = function(req, res) {
        var board = req.params.board;
        mongo.connect(url,function(err,db) {
          var collection = db.collection(board);
          collection.find({_id: new ObjectId(req.query.thread_id)},
          {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0
          })
          .toArray(function(err,doc){
            res.json(doc[0]);
          });
        });
        
      };

      // post
      this.newReply = function(req, res) {
        var board = req.params.board;
        var reply = {
          _id: new ObjectId(),
          text: req.body.text,
          created_on: new Date(),
          reported: false,
          delete_password: req.body.delete_password
          };
        mongo.connect(url,function(err,db) {
          if (err && !db) {
            return res.json({'error': "not connected with database"})
          } else if (db && !err) {
            console.log("connected and do whatever you want with db")
            var collection = db.collection(board);
          collection.findAndModify(
            {_id: new ObjectId(req.body.thread_id)},
            [],
            {
              $set: {bumped_on: new Date()},
              $push: { replies: reply  }
            },
            function(err, doc) {
              if (err) {
                console.log(err);
              } else {
                console.log(doc)
              }
            });
          }

        });
        
        return res.redirect('/b/'+board+'/'+req.body.thread_id);
      };

      // put - report

      this.reportReply = function(req, res) {
        var board = req.params.board;
        mongo.connect(url,function(err,db) {
          var collection = db.collection(board);
          collection.findAndModify(
            {
              _id: new ObjectId(req.body.thread_id),
              "replies._id": new ObjectId(req.body.reply_id)
            },
            [],
            { $set: { "replies.$.reported": true } },
            function(err, doc) {
            });
        });
        res.send('reported');
      };

      // delete

      this.deleteReply = function(req, res) {
        var board = req.params.board;
        mongo.connect(url,function(err,db) {
          var collection = db.collection(board);
          collection.findAndModify(
            {
              _id: new ObjectId(req.body.thread_id),
              replies: { $elemMatch: { _id: new ObjectId(req.body.reply_id), delete_password: req.body.delete_password } },
            },
            [],
            { $set: { "replies.$.text": "[deleted]" } },
            function(err, doc) {
              if (doc.value === null) {
                res.send('incorrect password');
              } else {
                res.send('success');
              }
            });
        });
      };

}

module.exports = ReplyHandler;