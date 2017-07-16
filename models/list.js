console.log('[List Model] module activated ')

var crypto   = require('crypto')
var mongoose = require('../libs/mongoose'), Schema = mongoose.Schema

var schema = new Schema
({
	id:
	{
		type:   String,
		unique :  true,
		required: true
	},
	name:
	{
		type : String
	},
	users:
	[{
		email: {type: String},
		owner: {type: Boolean, default: false}
	}],
	entries:
	[{
		entry_id   : {type: String},
		product_id : {type: String},
		from_user  : {type: String},
		comment    : {type: String},
		purchased  : {type: Boolean, default: false}		
	}]
})

/** @saveData - cохраняет или обновляет записи в списке */
schema.methods.saveData = function(entriesData,callback)
{
	var results     = []
	var updateIndex = 0
	var keyIndex    = 0
			
	if (!Array.isArray(entriesData)) {entriesData = [].concat(entriesData)}
	entriesData.forEach(function(newEntry, i, arr)
	{
		if (newEntry.hasOwnProperty('entry_id'))
		{
			updateIndex = this.entries.findIndex(entry => entry.entry_id == newEntry.entry_id)
			
			if (updateIndex != -1)
			{
				for (keyIndex in newEntry) {this.entries[updateIndex][keyIndex] = newEntry[keyIndex]}
				results.push ({"entry":newEntry.entry_id,"status":"updated"})
			}
			else
			{
				if ((newEntry.from_user !== undefined)&&(newEntry.product_id !== undefined))
				{
					this.entries.push (newEntry)				
					results.push ({"entry":newEntry.entry_id,"status":"saved"})
				}
				else
				{
					results.push ({"entry":newEntry.entry_id,"error":"from_user or product_id missed"})
				}
			}			
		}
		else
		{
			results.push ({"entry":newEntry,"error":"not valid"})
		}
	}, this)
	
	this.save()
	return callback(null,results)
}

/** @clearData - удаляет записи в списке */
schema.methods.clearData = function(entriesData,callback)
{
	var results     = []
	var removeIndex = 0
	var keyIndex    = 0
			
	if (!Array.isArray(entriesData)) {entriesData = [].concat(entriesData)}
	entriesData.forEach(function(removeEntry, i, arr)
	{
		if (removeEntry.hasOwnProperty('entry_id'))
		{			
			removeIndex = this.entries.findIndex(entry => entry.entry_id == removeEntry.entry_id)
			
			if (removeIndex != -1)
			{
				this.entries.splice (removeIndex,1)
				results.push ({"entry":removeIndex.entry_id,"status":"removed"})
			}
			else
			{
				results.push ({"entry":removeIndex.entry_id,"error":"not found"})
			}	
		}
		else
		{
			results.push ({"entry":removeEntry,"error":"not valid"})
		}
	}, this)
	
	this.save()
	return callback(null,results)
}

exports.List = mongoose.model('List',schema)