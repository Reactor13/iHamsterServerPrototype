// Скрипт для создания новой базы данных

var fs              = require('fs')
var async           = require ('async')
var mongoose        = require ('./libs/mongoose')
var User            = require ('./models/user.js').User

async.series([
	open,
	findUsers,
	findUserProduct
], function(err) {
	if (err)
	{
		console.error(arguments)
		console.log('Error during new data base creation')
	}
	else
	{
		console.log('Done')
	}
	mongoose.disconnect()
	process.exit(err ? 255 : 0)
})

function open(callback){
	mongoose.connection.on('open',callback)
}


function findUsers(callback)
{
	var User = require('./models/user').User
	
	User.find({'products.name.ru':'Хлеб'}, function(err, user)
	{
		console.log (JSON.stringify(user))
		callback(null)
	})
}

function findUserProduct(callback)
{
	var User = require('./models/user').User
	
	var filter  = { 'email' : '1@1.ru' };
	var fields  = { 'products': {$elemMatch: { 'id': 'id_bread_001' }},'_id': 0,'categories':0,'email':0,'hashedPassword':0,'created':0,'salt':0,'__v':0 } 
	var options = {};
	User.find(filter,fields,options,function(err, userProduct)
	{
		console.log (' ')
		console.log ('----> ' + JSON.stringify(userProduct))
		callback(null)
	})	
}