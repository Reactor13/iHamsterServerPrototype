console.log('[API] API module activated')

var mongoose = require('../libs/mongoose')

exports.createUser         = createUser
exports.getDefaultProducts = getDefaultProducts
exports.getUsers           = getUsers
exports.createUser         = createUser
exports.saveProducts       = saveProducts

function getDefaultProducts(callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
		
	var Product = require ('../models/default_product.js').defaultProduct
	Product.find({}, function(err, products)
	{
		if (err)
		{
			return callback(500, 'Error in Database')
		}
		else
		{
			return callback(null, JSON.stringify(products))
		}
	})
}

function getUsers(callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
		
	var User = require('../models/user').User
	User.find({}, function(err, users)
	{
		if (err)
		{
			return callback(500, 'Error in Database')
		}
		else
		{
			return callback(null, JSON.stringify(users))
		}
	})
}

function createUser(newUser,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	console.log(' ')
	console.log('[API] createUser function')
	console.log('[API] ... email:'    + newUser.email)
	console.log('[API] ... password:' + newUser.password)	
	
	// Валидация пароля
	if (!newUser.password) 			                      return callback(403, 'Password is require')
	if (newUser.password.length < 3)                      return callback(403, 'Password is to short')
	if (newUser.password.length > 25)                     return callback(403, 'Password is to long')
	if (!newUser.password.match( /^[-0-9a-zA-Z_]{3,}$/) ) return callback(403, 'Password contain unacceptable symbols')
		
	// Валидация email
	if (!newUser.email) 			                      return callback(403, 'Email is require')
	if (!validateEmail(newUser.email))                    return callback(403, 'Email is not valid')

	console.log('[API] ... Validation completed')
	
	var User = require('../models/user').User
	User.findOne({'email': newUser.email }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				console.log('[API] ... This user already exists')
				return callback(403, 'This user already exists')
			}
			else
			{
				console.log('[API] ... User ' + newUser.email + ' not found')
				user          = new User()
				user.email    = newUser.email
				user.password = newUser.password
				user.generateToken()
				user.save(function(err, user, affected)
				{
					if (err)
					{
						return callback(500, 'Database error during user creation')
					}
					else
					{
						console.log('[API] ... User created')
						var answer = {status: 'User created', userToken: user.token}
						return callback(null, JSON.stringify(answer))
					}
				})
			}
		}
	})
}

function saveProducts(productsData,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	// Валидация данных JSON
	try         {var jsonData = JSON.parse(productsData.json)}
	catch (err) {return callback(403, 'Invalid JSON ' + err)}
	
	// Валидация наличия токета
	if (!productsData.token) return callback(403, 'User token is require')
	
	var User = require('../models/user').User
	User.findOne({'token': productsData.token }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				user.saveProducts(jsonData, function(err, results)
				{
					console.log('[API] ... Products saved')
					var answer = {status: 'Products saved', create: results.productsCreated, update: results.productsUpdated, total: results.totalProducts}
					return callback(null, JSON.stringify(answer))
				})			
			}
			else				
			{
				console.log('[API] ... User with this token not found')
				return callback(403, 'User with this token not found')
			}
		}
	})
}

function validateEmail(email)
{
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email)
}