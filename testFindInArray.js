// Скрипт для создания новой базы данных

var fs              = require('fs')
var async           = require ('async')
var mongoose        = require ('./libs/mongoose')
var User            = require ('./models/user.js').User

async.series([
	open,
	findUsers
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


function findUsers(callback)
{
	var User = require('./models/user').User
	
	User.find({'dictionary.products.name.ru':'батон'}, function(err, user)
	{
		console.log (JSON.stringify(user))
		callback(null)
	})
}