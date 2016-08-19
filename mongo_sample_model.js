/**-------------------------------------------
 * This is an example of a MongoModel Schema 
 * that explains how to define basic structure 
 * of a document
---------------------------------------------*/
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

/**
 * ProjectionsSchema Schema
 * Model that defines schema with different field names 
 * and their expected values
 * 
 */
var ProjectionsSchema = new Schema({
  	
  	interest_rate:String,
  	
  	projection_level:String,
  	
  	risk_level_id:{ //Sample foreign key
  	
  		type: ObjectId,
  		ref : 'RiskLevels'
	},
	description:String
});

mongoose.model('Projections', ProjectionsSchema);
