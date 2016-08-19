/**-----------------------------------------
 * This is an example of a NodeJS controller 
 * that handles basic CRUD operation
------------------------------------------*/
'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
mongoose = require('mongoose'),
Q = require('q');

var Projection = mongoose.model('ProjectionsContent');

/**
 * Genearlized method to catch errors
 * @param   {[Object]}     [the object containing the error]
 * @return  {[String]} err [the error message]
 */
var getErrorMessage = function(err) {

  if (err.errors) {
  
    for (var errName in err.errors) {
  
      if (err.errors[errName].message) return err.errors[errName].message;
    }
  } else {
  
    return 'Unknown server error';
  }
};

/**
 * Create a Projection
 * This function adds a new projection (just a term used here)
 * into mongodb
 * @param {[Object]} [req] [the request coming from client]
 * @param {[Object]} [res] [the response needs to be sent to client]
 * @returns {[Object]} [Result of the operation]
 * 
 */
exports.create = function (req, res) {
  
  var p               = new Projection();
  p.description       = req.body.description?req.body.description:'';
  p.risk_level_id     = req.body.risk_level_id;
  
  validateUniqueBeforeSave(p.risk_level_id).then(function (result){

    p.save(function(err) {
  
      if (err) {
  
        return res.status(400).send( {message: getErrorMessage(err)})   
      }
      res.json({message:'New projection content created successfully'});
    });
  }, function (err){
    
    return res.status(400).send( {message: err.message})   
  });
};

/**
 * This function is a sub function that is being used before saving the value
 * the purpose of this function is avoid duplicate values in DB
 * @param  {[String]} risk_level_id [id from risk_levels table]
 * @return {[Object]}               [Result of validation being applied]
 * 
 */
function validateUniqueBeforeSave (risk_level_id){

  var deferred = Q.defer();

  Projection.findOne({risk_level_id:risk_level_id}, function(err, h) { 

    if (err) {

      deferred.reject( {message: getErrorMessage(err)})   
    }

    if(h){

      deferred.reject( {message: "Value already exist for this risk level"})   
    } else{
      
      deferred.resolve();
    }
  });
  return deferred.promise;
}

/**
 * This function represents the read operation from MongoDB
 * @param {[Object]} [req] [the request coming from client]
 * @param {[Object]} [res] [the response needs to be sent to client]
 * @returns {[Object]} [Result of the operation i.e the Row found by query]
 * 
 */
exports.read = function (req, res) {
  
  Projection.findById(req.params.id, function(err,projection) { 
  
    if (err) {
      return res.status(400).send( {message: getErrorMessage(err)})   
    }
    res.json(projection);
  });
};

/**
 * This function represents the update operation of MongoDB
 * @param {[Object]} [req] [the request coming from client]
 * @param {[Object]} [res] [the response needs to be sent to client]
 * @returns {[Object]} [Result of the operation i.e whether row gets updated or not]
 * 
 */
exports.update = function (req, res) {
  var p               = {};
  p.description       = req.body.description?req.body.description:'';
  p.risk_level_id     = req.body.risk_level_id;

  Projection.findById(req.params.id , p, function(err, h) {
    if(err){

      return res.status(400).send( {message: getErrorMessage(err)})   
    }

    if(h.risk_level_id != p.risk_level_id){

      validateUniqueBeforeSave(p.risk_level_id).then(function (result){

        Projection.findByIdAndUpdate(req.params.id , p, function(err, projection) {

          if (err) {

            return res.status(400).send( {message: getErrorMessage(err)})   
          }
          res.json({message:'Projection content updated successfully'});
        });
      }, function (err){
        
        return res.status(400).send( {message: err.message})   
      });
    } else{
      
      Projection.findByIdAndUpdate(req.params.id , p, function(err, projection) {

        if (err) {

          return res.status(400).send( {message: getErrorMessage(err)})   
        }
        res.json({message:'Projection content updated successfully'});
      });
    }
  });
};

/**
 * This function represents the delete operation of A MongoDB document
 * @param {[Object]} [req] [the request coming from client]
 * @param {[Object]} [res] [the response needs to be sent to client]
 * @returns {[Object]} [Result of the operation i.e whether the Row gets deleted by query]
 * 
 */
exports.delete = function (req, res) {

  Projection.findByIdAndRemove(req.params.id , function(err, projection) {

    if (err) {
      return res.status(400).send( {message: getErrorMessage(err)})   
    }
    res.json({message:'Projection content deleted successfully'});
  });
};

/**
 * This function represents the readAll operation from MongoDB
 * @param {[Object]} [req] [the request coming from client]
 * @param {[Object]} [res] [the response needs to be sent to client]
 * @returns {[Object]} [Result of the operation i.e All the Row found of a mongo document]
 * 
 */
exports.list = function (req, res) {

  Projection.find(function(err, projections) {

    if (err) {
      return res.status(400).send({message: getErrorMessage(err)});
    } 
    res.json(projections);
  }).populate('risk_level_id');//.sort({projection_level:'asc'});
};
