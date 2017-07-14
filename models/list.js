console.log('[List Model] module activated ')

var crypto   = require('crypto')
var mongoose = require('../libs/mongoose'), Schema = mongoose.Schema

var schema = new Schema
({
	id:
	{
		type:   String,
		unique :  true,
		required: true
	},
	name:
	{
		type : String
	},
	users:
	[{
		email: {type: String},
		owner: {type: Boolean, default: false}
	}],
	entries:
	[{
		product_id : {type: String},
		from_user  : {type: String},
		comment    : {type: String}
	}]
})

exports.List = mongoose.model('List',schema)