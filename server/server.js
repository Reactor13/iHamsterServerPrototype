console.log('[Server] Server module activated')

var fs           = require('fs');
var http         = require('http');
var url          = require('url');
var mongoose     = require('../libs/mongoose'), Schema = mongoose.Schema
var serverConfig = require('../config/server.json');

var appServer = new http.Server(function(req,res)
{
	var urlParsed              = url.parse(req.url, true);
	var correctRequest         = new Boolean(false);
	var incorrectRequestReason = new String();
	var clientIP               = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var clientHost             = req.headers.host;
	var clientOrigin           = req.headers.origin;
	
	if (clientOrigin == undefined || clientOrigin == null || clientOrigin == 'null') {clientOrigin = '*'}
	console.log('[Server] New request from : ' + clientIP + ', host :' + clientHost + ', origin : ' + clientOrigin);
	console.log('[Server] ... ' + req.method + ' ' + req.url)
	
	if (urlParsed.pathname == '/')
	{
		res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
		correctRequest = true;
		
		fs.readFile('./templates/server-hello.txt', {encoding: 'utf-8'}, function(err, data) 
		{
			if (err)
			{
				console.error(err)
				res.statusCode = 500
				res.end('Server error')
				return
			}
			else
			{
				res.end(data + 'Server, version: ' + serverConfig.serverVersion)
			}
			
		});
	}
	
	if (urlParsed.pathname == '/api/echo' && urlParsed.query.message)
	{
		if (urlParsed.query.message.length < 10)
		{
			res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'})
			res.end('Echo: ' + urlParsed.query.message)
			correctRequest = true
			return
		}
		else
		{
			correctRequest         = false;
			incorrectRequestReason = 'Echo message is too long.'
			return
		}
	}	
	
	if (urlParsed.pathname == '/users')
	{
		var User = require('../models/user').User
		User.find({}, function(err, users){
			if (err)
			{
				res.statusCode = 500
				res.end('[ERROR] Server error')	
			}
			else
			{
				res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*'})
				res.end(JSON.stringify(users))
			}
		})
		
		correctRequest = true
	}
	
	if (correctRequest == false)
	{
		res.statusCode = 404
		res.end('[ERROR] Incorrect request. ' + incorrectRequestReason)	
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