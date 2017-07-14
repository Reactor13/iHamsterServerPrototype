// Скрипт для создания новой базы данных

var fs              = require('fs')
var async           = require ('async')
var mongoose        = require ('./libs/mongoose')
var List            = require ('./models/list.js').User
var User            = require ('./models/user.js').User
var defaultProduct  = require ('./models/default_product.js').defaultProduct
var defaultCategory = require ('./models/default_category.js').defaultCategory

async.series([
	open,
	dropDatabase,
	requireModels,
	createUsers,
	createCategories,
	createProducts,
	createLists
], function(err) {
	if (err)
	{
		console.error(arguments)
		console.log('Error during new data base creation')
	}
	else
	{
		console.log('New data base has been created')
	}
	mongoose.disconnect()
	process.exit(err ? 255 : 0)
})

function open(callback){
	mongoose.connection.on('open',callback)
}

function dropDatabase(callback){
	var db = mongoose.connection.db
	db.dropDatabase(callback)
}

function requireModels(callback){
	require ('./models/list.js')
	require ('./models/user.js')
	require ('./models/default_product.js')
	
	async.each(Object.keys(mongoose.models), function(modelName, callback){
		mongoose.models[modelName].ensureIndexes(callback)
	}, callback)
}

function createUsers(callback) {
	var users = [
		{email: '1@1.ry', password : '12345', dictionary: {products:[{id:"test",name:{ru:"тест"}}]} },
		{email: '2@2.ry', password : '12345'},
		{email: '3@3.ry', password : '12345'},
	]
	
	async.each(users, function(userData, callback){
		var user = new mongoose.models.User(userData)
		user.save(callback)
	},callback)
}

function createCategories(callback) {
	var categories = 
	[
		{
			id  : "id_bread",
			name: {ru:"Хлеб", en:"Bread"}
		}
	]
	
	async.each(categories, function(categoryData, callback){
		var category = new mongoose.models.defaultCategory(categoryData)
		category.save(callback)
	},callback)
}

function createProducts(callback) {
	
	products = require('./data/products.json')
	
	async.each(products, function(productData, callback){
		var product = new mongoose.models.defaultProduct(productData)
		product.save(callback)
	},callback)
}

function createLists(callback) {
	
	lists = require('./data/lists.json')
	
	async.each(lists, function(listData, callback){
		var list = new mongoose.models.List(listData)
		list.save(callback)
	},callback)
}