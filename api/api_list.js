console.log('[API List] API module activated')

var mongoose   = require('../libs/mongoose')
var async      = require('async')


/**
 *    @ListAPI
 * 01 @createList       - функция создает новый список в БД 
 * 02 @getUserLists     - вывести списки, в которых участвует пользователь
 * 03 @getListEntries   - вывести полную информацию для списка
 * 04 @saveList         - сохранить продукты в список
 * 05 @clearListEntries - очистить купреленные записи в списке
 */
 
 
/** @ListAPI экспорт функций */      
 exports.createList       = createList
 exports.getUserLists     = getUserLists 
 exports.getListEntries   = getListEntries 
 exports.saveList         = saveList
 exports.clearListEntries = clearListEntries


/** 
 * @ListAPI
 * @createList - функция создает новый список в БД 
 */
function createList(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1) return callback(500, 'Database not connected')
	
	// Валидация наличия токета
	if (!requestData.token)                return callback(403, 'User token is require')
	
	// Валидация наличия имени списка
	if (!requestData.name)                 return callback(403, 'List nane is require')
	if (requestData.name.length > 255)     return callback(403, 'List nane is too long')

	// Валидация наличия id списка
	if (!requestData.id)                   return callback(403, 'List id is require')
	if (requestData.id.length > 255)       return callback(403, 'List id is too long')
	
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
 * @getUserLists - вывести списки, в которых участвует пользователь
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
								if (listUser.email==user.email && listUser.owner) {isListOwner = true}
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


/**
 * @ListAPI
 * @getListEntries - вывести полную информацию для списка
 */
function getListEntries(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1)  return callback(500, 'Database not connected')
	
	// Валидация наличия токета
	if (!requestData.token)                 return callback(403, 'User token is require')
		
	// Валидация наличия id списка
	if (!requestData.list_id)               return callback(403, 'List id is require')
	
	console.log(' ')
	console.log('[API] getListEntries function')
	console.log('[API] ... token: '    + requestData.token)
	console.log('[API] ... list_id: '  + requestData.list_id)	

	var User    = require('../models/user').User
	var List    = require('../models/list').List
	var curUser
	var curList
	
	checkUser(requestData.token)

	/** Шаг 1: поиск пользователя по токену */
	function checkUser()
	{		
		User.findOne({'token': requestData.token }, function(err, user)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (user) {curUser = user; findList()}
				else
				{
					console.log('[API] ... User with this token not found')
					return callback(403, 'User with this token not found')
				}
			}
		})
	}
	
	/** Шаг 2: поиск списка по list_id */
	function findList()
	{		
		List.findOne({'id': requestData.list_id }, function(err, list)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (list) {curList = list; checkAccess()}
				else
				{
					console.log('[API] ... List with this ID not found')
					return callback(403, 'List with this ID not found')
				}
			}
		})
	}
	
	/** Шаг 3: проверка, что данный пользователь учатсвует в синхронизации списка */
	function checkAccess()
	{
		var accessGranted = false
		
		curList.users.forEach(function(curListUser, i, arr)
		{								
			if (curListUser.email==curUser.email ) {accessGranted = true}
		})
		
		if (accessGranted) {buildListEntries()}
		else
		{
			console.log('[API] ... For this user access denied to this list.')
			return callback(403, 'For this user access denied to this list.')
		}
	}
	
	/** Шаг 4: построение набора элементов в списке */
	var listEntries = []
	function buildListEntries()
	{
		listEntries = curList.entries
		buildProducts()
	}
	
	/** Шаг 5: построение описания продуктов */
	var products = []
	function buildProducts()
	{
		async.eachSeries (listEntries, function(listEntriesData, callback)
		{								
			if (products.findIndex(product => product.id == listEntriesData.product_id) == -1)
			{
				var filter  = { 'email' : listEntriesData.from_user };
				var fields  = { 'products': {$elemMatch: { 'id':listEntriesData.product_id  }},'_id': 0,'categories':0,'email':0,'hashedPassword':0,'created':0,'salt':0,'__v':0,'token':0 } 
				User.findOne(filter,fields,function(err, userProduct)
				{				
					if (userProduct)
					{
						if (userProduct.products === undefined)
						{
							products.push ({'id':listEntriesData.product_id, 'error':'product no found'})
						}
						else
						{
							products.push ({'id':userProduct.products[0].id, 'user':listEntriesData.from_user,'category':userProduct.products[0].category, 'name':userProduct.products[0].name})					
						}				
						callback(null)
					}
					else
					{
						products.push ({'id':listEntriesData.product_id, 'error':'user no found'})
						callback(null)
					}
				})			
			}
			else
			{
				callback(null)
			}
		},function(err)
		{				
			buildCategories()
		})		
		
	}
	
	/** Шаг 6: построение описания категорий */
	var categories = []
	function buildCategories()
	{
		async.eachSeries (products, function(productData, callback)
		{			
			if (productData.user === undefined)
			{				
				callback(null)
			}
			else
			{	
				if (categories.findIndex(category => category.id == productData.category) == -1)
				{
					var filter  = { 'email'     : productData.user };
					var fields  = { 'categories': {$elemMatch: { 'id':productData.category }},'_id': 0,'products':0,'email':0,'hashedPassword':0,'created':0,'salt':0,'__v':0,'token':0 } 
					User.findOne(filter,fields,function(err, userCategory)
					{								
						if ( userCategory.categories === undefined)
						{
							categories.push ({'id': productData.category, 'error':'category not found'})
						}
						else
						{
							categories.push ({'id': userCategory.categories[0].id, 'user':productData.user, 'name':userCategory.categories[0].name})					
						}				
						callback(null)
					})		
				}
				else
				{
					callback(null)
				}
			}				
		},function(err)
		{				
			sendResponse()
		})			
	}
	
	/** Шаг 7: Завершение функции, возвращение результатов */
	function sendResponse()
	{
		console.log('[API] getListEntries function function completed')
		var answer = {"status": 'List entries build completed', "name":curList.name, "entries":listEntries, "products":products, "categories":categories}
		return callback(null, JSON.stringify(answer))
	}	
}


/**
 * @ListAPI
 * @saveList - сохранить продукты в список
 * Если список не существует в базе, то он будет создан
 */
function saveList(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1)   return callback(500, 'Database not connected')
	
	// Валидация наличия токета
	if (!requestData.token)                  return callback(403, 'User token is require')
	
	// Валидация наличия id списка
	if (!requestData.list_id)                return callback(403, 'List id is require')
	if (requestData.list_id.length > 1024)   return callback(403, 'List id is too long')
		
	// Валидация имени списка при его указании
	if (requestData.name !==undefined && requestData.name.length > 255) return callback(403, 'List name is too long')
	
	// Валидация данных JSON
	if (requestData.json !== undefined)
	{	
		try         {var jsonData = JSON.parse(requestData.json)}
		catch (err) {return callback(403, 'Invalid JSON ' + err)}
	}
	
	var User    = require('../models/user').User
	var List    = require('../models/list').List
	var curUser
	var curList

	checkUser(requestData.token)

	/** Шаг 1: поиск пользователя по токену */
	function checkUser()
	{		
		User.findOne({'token': requestData.token }, function(err, user)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (user) {curUser = user; findList()}
				else
				{
					console.log('[API] ... User with this token not found')
					return callback(403, 'User with this token not found')
				}
			}
		})
	}
	
	/** Шаг 2: поиск списка по list_id. Если список не найден, то он будет автоматически создан */
	function findList()
	{
		List.findOne({'id': requestData.list_id }, function(err, list)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (list) {curList = list; checkAccess()}
				else
				{					
					if (!requestData.name) {return callback(403, 'For new list name is require')}
					else
					{					
						list      = new List()
						list.id   = requestData.list_id					
						list.name = requestData.name
						list.users.push ({"email":curUser.email, owner:true})					
						list.save(function(err, list, affected)
						{
							if (err) {return callback(500, 'Database error during list creation')}
							else
							{
								console.log('[API] New list created')
								curList = list
								checkAccess()
							}
						})
					}
				}
			}
		})
	}
	
	/** Шаг 3: проверка, что данный пользователь учатсвует в синхронизации списка */
	function checkAccess()
	{
		var accessGranted = false
		
		curList.users.forEach(function(curListUser, i, arr)
		{								
			if (curListUser.email==curUser.email ) {accessGranted = true}
		})
		
		if (accessGranted) {modifyListData()}
		else
		{
			console.log('[API] ... For this user access denied to this list.')
			return callback(403, 'For this user access denied to this list.')
		}
	}
	
	
	/** Шаг 4: предварительное сохранение записей в список */	
	var answerResults = []
	function modifyListData()
	{		
		if (requestData.name !== undefined)
		{
			curList.name = requestData.name; 
			answerResults.push ( {'name': requestData.name} )			
		}
		if (requestData.json !== undefined)
		{
			curList.saveData(jsonData,curUser.email, function(err, results)
			{						
				answerResults.push ( {'entries': results} )				
			})	
		}		
		saveListData()
	}
	
	/** Шаг 5: Сохранение данных в базу данных */
	function saveListData()
	{		
		curList.save(function(err, user, affected)
		{
			if (err) {return callback(500, 'Database error during list data saving')}
			else 	 {sendResponse()}
		})		
	}

	/** Шаг 6: Завершение функции, возвращение результатов */
	function sendResponse()
	{
		console.log('[API] saveList function function completed')
		var answer = {"status": 'Save list Completed', "results":answerResults}
		return callback(null, JSON.stringify(answer))
	}	
}

/**
 * @ListAPI
 * @clearListEntries - очистить купреленные записи в списке
 */
function clearListEntries(requestData,callback)
{
	// Проверка соединения с БД
	if (mongoose.connection.readyState!=1)   return callback(500, 'Database not connected')
	
	
	// Валидация наличия json со списком элементов на удаление
	try         {var jsonData = JSON.parse(requestData.json)}
	catch (err) {return callback(403, 'Invalid JSON ' + err)}
	
	// Валидация наличия токета
	if (!requestData.token)                  return callback(403, 'User token is require')
	
	// Валидация наличия id списка
	if (!requestData.list_id)                return callback(403, 'List id is require')
	if (requestData.list_id.length > 1024)   return callback(403, 'List id is too long')
	
	var User    = require('../models/user').User
	var List    = require('../models/list').List
	var curUser
	var curList
	
	checkUser()

	/** Шаг 1: поиск пользователя по токену */
	function checkUser()
	{		
		User.findOne({'token': requestData.token }, function(err, user)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (user) {curUser = user; findList()}
				else
				{
					console.log('[API] ... User with this token not found')
					return callback(403, 'User with this token not found')
				}
			}
		})
	}
	
	/** Шаг 2: поиск списка по list_id */
	function findList()
	{		
		List.findOne({'id': requestData.list_id }, function(err, list)
		{
			if (err) {return callback(500, 'Error in Database')}
			else
			{
				if (list) {curList = list; checkAccess()}
				else
				{
					console.log('[API] ... List with this ID not found')
					return callback(403, 'List with this ID not found')
				}
			}
		})
	}
	
	/** Шаг 3: проверка, что данный пользователь учатсвует в синхронизации списка */
	function checkAccess()
	{
		var accessGranted = false
		
		curList.users.forEach(function(curListUser, i, arr)
		{								
			if (curListUser.email==curUser.email ) {accessGranted = true}
		})
		
		if (accessGranted) {clearEntries()}
		else
		{
			console.log('[API] ... For this user access denied to this list.')
			return callback(403, 'For this user access denied to this list.')
		}
	}
	
	/** Шаг 4: Очистка записей */
	var answerResults = []
	function clearEntries()
	{
		curList.clearData(jsonData, function(err, results)
		{						
			answerResults.push ( {'entries': results} )
			saveListData()
		})			
	}
	
	/** Шаг 5: Сохранение данных в базу данных */
	function saveListData()
	{		
		curList.save(function(err, user, affected)
		{
			if (err) {return callback(500, 'Database error during list data saving')}
			else 	 {sendResponse()}
		})		
	}
	
	/** Шаг 6: Завершение функции, возвращение результатов */
	function sendResponse()
	{
		console.log('[API] clearListEntries function completed')
		var answer = {"status": 'Clear list entries completed', "results":answerResults}
		return callback(null, JSON.stringify(answer))
	}	
}