console.log(Date.now() + ' [Default Category model] Module activated ')

var crypto   = require('crypto')
var mongoose = require('../libs/mongoose'), Schema = mongoose.Schema

var schema = new Schema({
	id:     {type: String},
	name:
	{
		ru: {type: String},
		en: {type: String},
		de: {type: String},
		fr: {type: String},
		es: {type: String}
	},
})

exports.defaultCategory = mongoose.model('defaultCategory',schema)