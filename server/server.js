console.log('[Server] Server module activated')

var fs           = require('fs');
var http         = require('http');
var url          = require('url');
var qs           = require('querystring');
var mongoose     = require('../libs/mongoose'), Schema = mongoose.Schema
var api          = require('../api/api')
var serverConfig = require('../config/server.json');

var appServer = new http.Server(function(req,res)
{
	var urlParsed              = url.parse(req.url, true);
	var clientIP               = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var clientHost             = req.headers.host;
	var clientOrigin           = req.headers.origin;
	var requestPostData        = '';
	
	console.log(' ')
	console.log('[Server] New request from : ' + clientIP + ', host :' + clientHost + ', origin : ' + clientOrigin);
	console.log('[Server] ... ' + req.method + ' ' + req.url)
	
	/** @POST Обработка POST запросов */
	if (req.method == 'POST')
	{
        req.on('data', function (data) {requestPostData += data; if (requestPostData.length > 1e6) {req.connection.destroy()}});
        req.on('end',  function () 
		{
            console.log('[Server] ... requestPostData.length: ' + (requestPostData.length/1024) + " Kb")
			requestPostData = qs.parse(requestPostData)			
			switch (urlParsed.pathname)
			{
				case "/api/createUser":
					api.createUser(requestPostData,   function(err, answer) {answerServer(err, answer)})
					break;
				case "/api/getUserLists":
					api.getUserLists(requestPostData, function(err, answer) {answerServer(err, answer)})
					break;
				case "/api/createList":
					api.createList(requestPostData,   function(err, answer) {answerServer(err, answer)})
					break;
				case "/api/saveProducts":
					api.saveProducts(requestPostData, function(err, answer) {answerServer(err, answer)})
					break;
				default:
					answerServer(404,'[ERROR] Incorrect request')
					break;
			}
        });
    }
	
	/** @GET Обработка GET запросов */
	if (req.method == 'GET')
	{
		switch (urlParsed.pathname)
		{
			case "/":
				fs.readFile('./templates/server-hello.txt', {encoding: 'utf-8'}, function(err, data){
					if (err) throw err
					answerServer(err, data + 'Server, version: ' + serverConfig.serverVersion , 'text')
				})
				break;
			case "/api/echo":
				if (urlParsed.query.message!=null) {answerServer(null, 'Echo: ' + urlParsed.query.message, 'text')}
				else                               {answerServer(403,  'There is no echo message...')}
				break;
			case "/api/getUsers":
				api.getUsers(function(err, answer)    {answerServer(err, answer)})
				break;
			case "/api/getAllLists":
				api.getAllLists(function(err, answer) {answerServer(err, answer)})
				break;
			case "/api/getDefaultProducts":
				api.getDefaultProducts(function(err, answer) {answerServer(err, answer)})
				break;
			default:
				answerServer(404,'[ERROR] Incorrect request')
				break;
		}
	}
	
	// Функция возвращает ответ сервер
	function answerServer(err, answer, contentType)
	{
		var headers
		if (err)
		{
			switch (err)
			{
				case 403: res.statusCode = 403; break;		
				default:  res.statusCode = 404; break;
			}
			res.writeHead(res.statusCode, {'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin':'*'})
			res.end(answer)	
		}
		else
		{
			switch (contentType)
			{
				case "text":
					headers = {'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin':'*'}
					break;
				default:
					headers = {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*'}
					break;
			}
		
			res.writeHead(200, headers)
			res.end(answer)
		}
	}
})

function startServer()
{
	appServer.listen (serverConfig.serverPort, serverConfig.serverIP)
	console.log('[Server] ... Server is running on ' + serverConfig.serverIP + ':' + serverConfig.serverPort)
}

function stopServer()
{
	appServer.close()
	console.log('[Server] ... Server closed')
}

exports.appServer   = appServer
exports.startServer = startServer
exports.stopServer  = stopServer