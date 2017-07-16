console.log('[API] API module activated')

var mongoose   = require('../libs/mongoose')

exports.getDefaultProducts = getDefaultProducts
exports.getAllLists        = getAllLists
exports.getUsers           = getUsers


/**
 * @API
 * @getDefaultProducts - Вывести все дефолтные продукты
 */
function getDefaultProducts(callback)
{
	if (mongoose.connection.readyState!=1) {return callback(500, 'Database not connected')}
		
	var Product = require ('../models/default_product.js').defaultProduct
	Product.find({},{"_id":0, "__v":0}, function(err, products)
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
 * @API
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
 * @API
 * @Waring Функция для отладки
 * @getAllLists - вывести все списки в БД
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