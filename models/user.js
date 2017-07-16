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
	products:
	[{
		id:        {type: String, required: true},
		category : {type: String},
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
		id:     {type: String, required: true},
		color:  {type: String},
		name:
		{
			ru: {type: String},
			en: {type: String},
			de: {type: String},
			fr: {type: String},
			es: {type: String}
		}
	}]
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

schema.methods.getToken = function()
{
	if (this.token === undefined)
	{
		this.generateToken()
		this.save()
	}
	return this.token 
}


/** @saveProducts - cохраняет или обновляет продукты в словаре пользователя */
schema.methods.saveProducts = function(productsData,callback)
{
	var updateIndex     = 0
	var keyIndex        = 0
	var results         = []
	
	if (!Array.isArray(productsData)) {productsData = [].concat(productsData)}
	productsData.forEach(function(newProduct, i, arr)
	{
		if (newProduct.hasOwnProperty('id'))
		{
			console.log( "[USER] --> " + i + ": " + JSON.stringify(newProduct.id) + " valid")
			updateIndex = this.products.findIndex(function (product, index, arr) {return product.id == this}, newProduct.id)
			
			if (updateIndex != -1)
			{
				if (newProduct.hasOwnProperty('name'))
				{
					for (keyIndex in newProduct.name) {this.products[updateIndex].name[keyIndex] = newProduct.name[keyIndex]}
				}
				if (newProduct.hasOwnProperty('price'))
				{
					for (keyIndex in newProduct.price) {this.products[updateIndex].price[keyIndex] = newProduct.price[keyIndex]}
				}
				results.push ({"product":newProduct.id,"status":"updated"})
			}
			else
			{
				this.products.push (newProduct)
				results.push ({"product":newProduct.id,"status":"saved"})
			}
		}
		else
		{
			results.push ({"product":newProduct,"status":"not valid"})
			console.log( "[USER] --> " + i + ": " + JSON.stringify(newProduct) + " not valid");
		}
		
	}, this);
	
	this.save()
	return callback(null, results)
}


/** @saveCategories - cохраняет или обновляет категории в словаре пользователя */
schema.methods.saveCategories = function(categoriesData,callback)
{
	var updateIndex = 0
	var keyIndex    = 0
	var results     = new Array()
	
	if (!Array.isArray(categoriesData)) {categoriesData = [].concat(categoriesData)}
	categoriesData.forEach(function(newCategory, i, arr)
	{
		if (newCategory.hasOwnProperty('id'))
		{
			console.log( "[USER] --> " + i + ": " + JSON.stringify(newCategory.id) + " valid")
			updateIndex = this.categories.findIndex(function (category, index, arr)	{return category.id == this}, newCategory.id)
			
			if (updateIndex != -1)
			{
				if (newCategory.hasOwnProperty('name'))
				{
					for (keyIndex in newCategory.name) {this.categories[updateIndex].name[keyIndex] = newCategory.name[keyIndex]}
				}
				results.push ({"category":newCategory.id,"status":"updated"})
			}
			else
			{
				this.categories.push (newCategory)
				results.push ({"category":newCategory.id,"status":"saved"})
			}
		}
		else
		{
			results.push ({"category":newCategory, "status":"not valid"})
			console.log( "[USER] --> " + i + ": " + JSON.stringify(newCategory) + " not valid");
		}
	}, this);
	
	this.save()
	return callback(null, results)
}

schema.virtual('password')
	.set(function(passord){
		this._plainPassword = passord
		this.salt           = Math.random() + ''
		this.hashedPassword = this.encryptPassword(passord)
	})
	.get(function() { return this._plainPassword })

schema.methods.checkPassword = function(password){
	return this.encryptPassword(password) === this.hashedPassword
}
	
exports.User = mongoose.model('User',schema)