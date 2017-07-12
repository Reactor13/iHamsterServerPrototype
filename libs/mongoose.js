console.log('[Mongoose] Mongoose Lib module activated')

var mongoose = require('mongoose')
var config   = require('../config/server.json')
var db       = mongoose.connection

mongoose.connect(config.mongoose.uri)
db.on  ('error', function() {console.error('[Mongoose] ... MongoDB not connected')})
db.once('open',  function() {console.log  ('[Mongoose] ... MongoDB connected')})

module.exports = mongoose