console.log('[Default Product model] Module activated ')

var crypto   = require('crypto')
var mongoose = require('../libs/mongoose'), Schema = mongoose.Schema

var schema = new Schema({
	id:        {type: String},
	calories : {type: Number},
	category:  {type: String},
	name:
	{
		ru: {type: String},
		en: {type: String},
		de: {type: String},
		fr: {type: String},
		es: {type: String}
	},
	price:
	{
		rus: {type: Number},
		gbr: {type: Number},
		usa: {type: Number},
		fra: {type: Number},
		esp: {type: Number},
		bra: {type: Number},
		blr: {type: Number}
	}
})

exports.defaultProduct = mongoose.model('defaultProduct',schema)