'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  File = mongoose.model('File'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config'));
/**
 * Create a File
 */

exports.create = function (req, res) {
  var user = req.user;
  var message = null;
  var upload = multer(config.uploads.fileUpload).single('uploadFile');
  if (user) {
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading File'
        });
      } else {

       var file = new File();
       file.user = req.user;
       file.filepath = config.uploads.fileUpload.dest + req.file.filename;
       file.filename = req.file.originalname;
       file.filetype = req.file.mimetype;
       file.title = req.body.title || 'Auto Title';
       file.content = req.body.content || 'Auto Content';

       file.save(function (err) {
         if (err) {
           return res.status(400).send({
             message: errorHandler.getErrorMessage(err)
           });
         } else {
           res.json(file);
         }
       });
     }
   });
  } else {
   console.log('else user');
   res.status(400).send({
     message: 'User is not signed in'
   });
  }
};

/**
 * Show the current file
 */
exports.read = function (req, res) {
  res.json(req.file);
};

/**
 * Update a file
 */
exports.update = function (req, res) {
  var file = req.file;

  file.title = req.body.title;
  file.content = req.body.content;

  file.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(file);
    }
  });
};

/**
 * Delete an file
 */
exports.delete = function (req, res) {
  var file = req.file;

  file.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(file);
    }
  });
};

/**
 * List of files
 */
exports.list = function (req, res) {
  console.log(req.user);
  File.find({user :req.user._id}).sort('-created').populate('user', 'displayName').exec(function (err, files) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(files);
    }
  });
};

/**
 * file middleware
 */
exports.fileByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'File is invalid'
    });
  }

  File.findById(id).populate('user', 'displayName').exec(function (err, file) {
    if (err) {
      return next(err);
    } else if (!file) {
      return res.status(404).send({
        message: 'No file with that identifier has been found'
      });
    }
    if(req.user && file.user.id !== req.user.id){
      return res.status(403).json({
        message: 'User is not authorized'
      });
    }

    req.file = file;
    next();
  });
};
