console.log('[API] API module activated')

var mongoose   = require('../libs/mongoose')

exports.createUser         = createUser
exports.getDefaultProducts = getDefaultProducts
exports.getUsers           = getUsers
exports.createUser         = createUser
exports.getUserToken       = getUserToken
exports.saveProducts       = saveProducts
exports.saveCategories     = saveCategories


/**
 * @DefaultAPI
 * Вывести все дефолтные продукты
 */
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


/**
 * @UserAPI
 * @Waring Функция для отладки
 * Вывести всех пользователей в БД
 */
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


/**
 * @UserAPI
 * @createUser - cоздание нового пользователя
 */
function createUser(newUser,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	console.log(' ')
	console.log('[API] createUser function')
	console.log('[API] ... email:'    + newUser.email)
	console.log('[API] ... password:' + newUser.password)	
	
	// Валидация пароля
	if (!newUser.password) 			                      return callback(403, 'Password is require')
	if (newUser.password.length < 3)                      return callback(403, 'Password is too short')
	if (newUser.password.length > 50)                     return callback(403, 'Password is too long')
	if (!newUser.password.match( /^[-0-9a-zA-Z_]{3,}$/) ) return callback(403, 'Password contain unacceptable symbols')
		
	// Валидация email
	if (!newUser.email) 			                      return callback(403, 'Email is require')
	if (newUser.email.length > 1024)                      return callback(403, 'Email is too long')
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


/**
 * @UserAPI 
 * @getUserToken - возвращает токен для пользователя. Если токена нет, то он будет создан.
 */
function getUserToken(requestData,callback)
{
	if (mongoose.connection.readyState!=1)  return callback(500, 'Database not connected')
	
	// Валидация наличия email
	if (!requestData.email)                 return callback(403, 'User email is require')
	if (requestData.email.length > 1024)    return callback(403, 'Email is too long')	

	// Валидация наличия пароля
	if (!requestData.password)              return callback(403, 'User password is require')
	if (requestData.password.length > 1024) return callback(403, 'Password is too long')	
	
	var User = require('../models/user').User
	User.findOne({'email': requestData.email}, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				if (user.checkPassword(requestData.password))
				{
					var answer = {"status" : "OK", "userToken": user.getToken()}
					return callback(null, JSON.stringify(answer))
				}
				else
				{
					console.log('[API] ... Password incorrect')
					return callback(403, 'Password incorrect')
				}
			}
			else				
			{
				console.log('[API] ... User not found')
				return callback(403, 'User not found')
			}
		}
	})
}


/**
 * @UserProductsAPI
 * @saveProducts - cоздание или обновление продуктов в словаре пользователя
 */
function saveProducts(requestData,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	// Валидация данных JSON
	try         {var jsonProductData = JSON.parse(requestData.json)}
	catch (err) {return callback(403, 'Invalid JSON ' + err)}
	
	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
	
	console.log(' ')
	console.log('[API] saveProducts function')
	console.log('[API] ... User token:'    + requestData.token)

	var User = require('../models/user').User
	User.findOne({'token': requestData.token }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				user.saveProducts(jsonProductData, function(err, results)
				{
					console.log('[API] saveProductsProducts function completed')
					var answer = {"status": 'Products saved', "results": results}
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


/**
 * @UserProductsAPI
 * @saveCategories - cоздание или обновление категорий в словаре пользователя
 */
function saveCategories(requestData,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	// Валидация данных JSON
	try         {var jsonCategoriesData = JSON.parse(requestData.json)}
	catch (err) {return callback(403, 'Invalid JSON ' + err)}
	
	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
	
	console.log(' ')
	console.log('[API] saveCategories function')
	console.log('[API] ... User token:'    + requestData.token)

	var User = require('../models/user').User
	User.findOne({'token': requestData.token }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				user.saveCategories(jsonCategoriesData, function(err, results)
				{
					console.log('[API] saveCategories function completed')
					var answer = {"status": 'Categories saved', "results": results}
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