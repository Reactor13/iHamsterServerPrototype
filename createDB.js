// Скрипт для создания новой базы данных

var async    = require ('async')
var mongoose = require ('./libs/mongoose')
var User     = require ('./models/user.js').User

async.series([
	open,
	dropDatabase,
	requireModels,
	createUsers
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
	require ('./models/user.js')
	
	async.each(Object.keys(mongoose.models), function(modelName, callback){
		mongoose.models[modelName].ensureIndexes(callback)
	}, callback)
}

function createUsers(callback) {
	var users = [
		{email: '1@1.ry', password : '12345'},
		{email: '2@2.ry', password : '12345'},
		{email: '3@3.ry', password : '12345'},
	]
	
	async.each(users, function(userData, callback){
		var user = new mongoose.models.User(userData)
		user.save(callback)
	},callback)
}