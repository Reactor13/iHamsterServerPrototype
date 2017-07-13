console.log('[User model] User model module activated ')

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
	token:
	{
		type : String
	},
	created:
	{
		type: Date,
		default: Date.now
	},
	dictionary:
	{
		products:
		[{
			id: {type: String},
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
		}],
		categories:
		[{
			id: {type: String},
			name:
			{
				ru: {type: String},
				en: {type: String},
				de: {type: String},
				fr: {type: String},
				es: {type: String}
			}
		}]
	}
})

schema.methods.encryptPassword = function(password)
{
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex')
}

schema.methods.generateToken = function()
{
	this.token = crypto.randomBytes(64).toString('hex')
	return
}

schema.methods.saveProducts = function(productsData,callback)
{
	var productsCreated = 0
	var productsUpdated = 0
	var flagUpdated     = false
	var i,j,k	

	for(i in productsData)
	{
		flagUpdated = false
		for (j in this.dictionary.products)
		{	
			if (isNaN(j)) break;			
			if (productsData[i].id == this.dictionary.products[j].id)
			{
				console.log ("[USER] ---> Update product " + productsData[i].id)
				productsUpdated ++								
				flagUpdated = true
				this.dictionary.products[j] = productsData[i]
				break;
			}
		}
		if (!flagUpdated)
		{
			console.log ("[USER] ---> Create product " + productsData[i].id)
			productsCreated ++
			this.dictionary.products[this.dictionary.products.length++] = productsData[i]
		}
	}
	
	this.save()
	return callback(null, {productsCreated:productsCreated,productsUpdated:productsUpdated,totalProducts:this.dictionary.products.length})
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

//function 