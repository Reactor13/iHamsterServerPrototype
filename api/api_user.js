console.log('[API USER] API USER module activated')

var mongoose   = require('../libs/mongoose')


/**
 *    @UserAPI
 * 01 @createUser        - cоздание нового пользователя
 * 02 @getUserToken      - возвращает токен для пользователя. Если токена нет, то он будет создан.
 * 03 @saveProducts      - cоздание или обновление продуктов в словаре пользователя
 * 04 @saveCategories    - cоздание или обновление категорий в словаре пользователя
 * 05 @getUserProducts   - возвращает продукты из словаря пользователя
 * 06 @getUserCategories - возвращает категории из словаря пользователя
 */
 

/** @UserAPI экспорт функций */ 
exports.createUser         = createUser
exports.createUser         = createUser
exports.getUserToken       = getUserToken
exports.saveProducts       = saveProducts
exports.saveCategories     = saveCategories
exports.getUserProducts    = getUserProducts
exports.getUserCategories  = getUserCategories


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


/**
 * @UserProductsAPI
 * @getUserProducts - возвращает продукты из словаря пользователя
 */
function getUserProducts(requestData,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}

	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
	
	console.log(' ')
	console.log('[API] getUserProducts function')
	
	var User    = require('../models/user').User	
	var curUser		
	
	checkUser()

	/** Шаг 1: поиск пользователя по токену */
	function checkUser()
	{		
		var filter  = {'token' : requestData.token}
		var fields  = 'products'	
		User.findOne(filter,fields, function(err, user)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (user) {curUser = user; buildProducts()}
				else
				{
					console.log('[API] ... User with this token not found')
					return callback(403, 'User with this token not found')
				}
			}
		})
	}

	/** Шаг 2: Построекние списка продуктов пользователя */
	var answerResults = []
	function buildProducts()
	{
		var i,key
		
		answerResults = curUser.products.toObject()
		
		// Фильтрация переводов, цен лишних ключей если задан параметр выборки в запросе
		for (i = 0; i < answerResults.length; i++)
		{
			answerResults[i]._id = undefined
			if (requestData.language !== undefined && answerResults[i].name !== undefined)
			{					
				for (key in answerResults[i].name)
				{
					if (key != requestData.language) {answerResults[i].name[key] = undefined}
				}	
			}
			if (requestData.price !== undefined && answerResults[i].price !== undefined)
			{					
				for (key in answerResults[i].price)
				{
					if (key != requestData.price) {answerResults[i].price[key] = undefined}
				}	
			}
		}

		sendResponse()
	}

	/** Шаг 3: Завершение функции, возвращение результатов */
	function sendResponse()
	{
		console.log('[API] getUserProducts function completed')
		var answer = {"status": 'User pruducts build completed', "results":answerResults}
		return callback(null, JSON.stringify(answer))
	}	
}


/**
 * @UserProductsAPI
 * @getUserCategories - возвращает продукты из словаря пользователя
 */
function getUserCategories(requestData,callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}

	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
	
	console.log(' ')
	console.log('[API] getUserCategories function')
	
	var User    = require('../models/user').User	
	var curUser		
	
	checkUser()

	/** Шаг 1: поиск пользователя по токену */
	function checkUser()
	{		
		var filter  = {'token' : requestData.token}
		var fields  = 'categories'	
		User.findOne(filter,fields, function(err, user)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (user) {curUser = user; buildCategories()}
				else
				{
					console.log('[API] ... User with this token not found')
					return callback(403, 'User with this token not found')
				}
			}
		})
	}

	/** Шаг 2: Построекние списка категорий пользователя */
	var answerResults = []
	function buildCategories()
	{
		var i,key
		
		answerResults = curUser.categories.toObject()
		
		// Очистка лишних ключей и фильтрация переводов, если задан параметр выборки в запросе
		for (i = 0; i < answerResults.length; i++)
		{								
			answerResults[i]._id = undefined
			if (requestData.language !== undefined && answerResults[i].name !== undefined)
			{					
				for (key in answerResults[i].name)
				{
					if (key != requestData.language) {answerResults[i].name[key] = undefined}
				}	
			}
		}			
	
		sendResponse()
	}

	/** Шаг 3: Завершение функции, возвращение результатов */
	function sendResponse()
	{
		console.log('[API] getUserCategories function completed')
		var answer = {"status": "User categories build completed", "results":answerResults}
		return callback(null, JSON.stringify(answer))
	}	
}


function validateEmail(email)
{
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email)
}