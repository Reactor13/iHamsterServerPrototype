console.log('[API] API module activated')

var mongoose   = require('../libs/mongoose')

exports.createUser         = createUser
exports.getDefaultProducts = getDefaultProducts
exports.getUsers           = getUsers
exports.createUser         = createUser
exports.saveProducts       = saveProducts
exports.getAllLists        = getAllLists
exports.createList         = createList
exports.getUserLists       = getUserLists

// Вывести все дефолтные продукты
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


// !!! Функция для отладки
// Вывести всех пользователей в БД
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
 * Создание или обновление продуктов в словаре пользователя
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


/**
 * @Waring Функция для отладки
 * Вывести все списки в БД
 */
function getAllLists(callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
		
	var List = require('../models/list').List
	List.find({}, function(err, lists)
	{
		if (err)
		{
			return callback(500, 'Error in Database')
		}
		else
		{
			return callback(null, JSON.stringify(lists))
		}
	})
}


/**
 * @UserProductsAPI
 * Создание или обновление продуктов в словаре пользователя
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
 * @ListAPI
 * Функция создает новый список в БД 
 */
function createList(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
	
	// Валидация наличия имени списка
	if (!requestData.name)             return callback(403, 'List nane is require')
	if (requestData.name.length > 255) return callback(403, 'List nane is too long')
		
	// Валидация наличия id списка
	if (!requestData.id)               return callback(403, 'List id is require')
	if (requestData.id.length > 255)   return callback(403, 'List id is too long')
	
	console.log(' ')
	console.log('[API] createList function')
	
	var User = require('../models/user').User
	User.findOne({'token': requestData.token }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				var List = require('../models/list').List
				List.findOne({'id': requestData.id }, function(err, list)
				{
					if (err) {return callback(500, 'Error in Database')}
					else
					{
						if (list)
						{
							console.log('[API] ... List with this ID already exists')
							return callback(403, 'List with this ID already exists')
						}
						else
						{
							list            = new List()
							list.id         = requestData.id
							list.name       = requestData.name
							list.users.push ({"email":user.email, owner:true})
							list.save(function(err, list, affected)
							{
								if (err) {return callback(500, 'Database error during list creation')}
								else
								{
									console.log('[API] createList function completed')
									var answer = {"status": 'List created', "list":list}
									return callback(null, JSON.stringify(answer))	
								}
							})
						}
					}
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
 * @ListAPI
 * Вывести списки, в которых участвует пользователь
 */
function getUserLists(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
	
	// Валидация наличия токета
	if (!requestData.token) return callback(403, 'User token is require')
		
	console.log(' ')
	console.log('[API] getUserLists function')
	
	var User = require('../models/user').User
	User.findOne({'token': requestData.token }, function(err, user)
	{
		if (err) {return callback(500, 'Error in Database')}
		else
		{
			if (user)
			{
				var List = require('../models/list').List
				List.find({'users.email': user.email }, function(err, lists)
				{
					if (err) {return callback(500, 'Error in Database')}
					else
					{
						console.log('[API] getUserLists function completed')
						var listsFilteredArr = new Array()
						var isListOwner      = false
						lists.forEach(function(list, i, arr)
						{
							isListOwner = false
							list.users.forEach(function(listUser, i, arr)
							{
								if (listUser.email==user.email) {isListOwner = true}
							})
							listsFilteredArr.push ( {"id":list.id, "name":list.name, "owner":isListOwner} )
						})
						var answer = {"status": 'List search completed', "lists": listsFilteredArr}
						return callback(null, JSON.stringify(answer))	
					}
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