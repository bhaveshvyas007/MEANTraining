'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  File = mongoose.model('File'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  fs = require('fs'),
  CryptoJS = require('crypto-js'),
  encryptor = require('file-encryptor');
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
      }
      else if(!req.file) {
        return res.status(400).send({
          message: 'Please upload file'
        });
      } else {

        var file = new File();
        file.user = req.user;
        file.filepath = config.uploads.fileUpload.dest + req.file.filename;
        file.filename = req.file.originalname;
        file.filetype = req.file.mimetype;
        file.title = req.body.title || 'Auto Title';
        file.content = req.body.content || 'Auto Content';
        file.key = '123456' || CryptoJS.randomBytes(16); //randomBytes fn not working

        encryptor.encryptFile(file.filepath, file.filepath+'.dat', file.key, function(err) {
          // Encryption complete.remove original file
          fs.unlink(file.filepath);
        });

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

exports.getFile = function (req, res) {
  var filePath = config.uploads.fileUpload.dest;
  var key = '123456';
  var dest = config.uploads.fileUpload.dest+'temp/'+req.file.filename;
  // Decrypt file.
  encryptor.decryptFile(req.file.filepath+'.dat', dest, key, function(err) {
    // Decryption complete.
    var stat = fs.statSync(dest);
    res.writeHead(200, {
      'Content-Type': req.file.filetype,
      'Content-Length': stat.size,
      'Content-disposition': 'attachment; filename=' + req.file.filename
    });

    var readStream = fs.createReadStream(dest);
    // We replaced all the event handlers with a simple call to readStream.pipe()

    readStream.on('open', function () {
      // This just pipes the read stream to the response object (which goes to the client)
      readStream.pipe(res);
    });

  });



  // res.setHeader('Content-disposition', 'attachment; filename=' + req.file.filename);
  // var filestream = fs.createReadStream(dest);
  // filestream.pipe(res);
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
  File.find({
    user :req.user._id
  }).sort('-created').populate('user', 'displayName').exec(function (err, files) {
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
