console.log('[User model] User model module activated')

var crypto   = require('crypto')
var mongoose = require('../libs/mongoose'), Schema = mongoose.Schema

var schema = new Schema({
	email: 
	{
		type: String,
		unique : true,
		required: true
	},
	hashedPassword:
	{
		type: String,
		required: true
	},
	salt:
	{
		type : String,
		required: true
	},
	created:
	{
		type: Date,
		default: Date.now
	}
})

schema.methods.encryptPassword = function(password){
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex')
}

schema.virtual('password')
	.set(function(passord){
		this._plainPassword = passord
		this.salt           = Math.random() + ''
		this.hashedPassword = this.encryptPassword(passord)
	})
	.get(function() { return this._plainPassword })

schema.methods.checkPassword = function(passord){
	return this.encryptPassword(password) === this.hashedPassword
}
	
exports.User = mongoose.model('User',schema)