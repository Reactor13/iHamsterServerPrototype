package
{
	import flash.display.*
	import flash.geom.*
	import flash.filters.DropShadowFilter
	import flash.text.*
	import flash.net.*
	import flash.xml.*
	import flash.events.*
	import flash.utils.*
	import flash.system.*
	import flash.filesystem.*
    import flash.sensors.Geolocation
	import flash.desktop.NativeApplication
	import flash.desktop.SystemIdleMode
	import flash.ui.Keyboard	
	import flash.text.AntiAliasType
	import flash.text.TextFormat
	import flash.media.Sound
	import flash.net.URLRequest
	import flash.media.SoundChannel
	import flash.media.SoundMixer
	import flash.media.SoundTransform
	import flash.media.AudioPlaybackMode
		  	
	public class Main extends MovieClip
	{		
		public function Main()
		{			
			trace ("Main ready")
			
			var SettingsFile   : File       = File.applicationDirectory.resolvePath("data/products.json")					   
			var SettingsStream : FileStream = new FileStream()	
			var fileLength     : int        = 0
			var inputString    : String     = ""
			
			if (SettingsFile.exists)
			{
				SettingsStream.open (SettingsFile, FileMode.READ)
				fileLength   = SettingsStream.bytesAvailable
				inputString  = SettingsStream.readUTFBytes(fileLength)
				SettingsStream.close()
			}
			
			var jsonData     : Object = JSON.parse(inputString)
			var product      : Object = new Object()
			var newJsonData  : Array  = new Array()
			var productIndex : int = 0
			
			for(var key:String in jsonData.products) {
				
				product	= jsonData.products[key]
				trace('-----------------')				
				trace(key)
								
				newJsonData[productIndex++]          = new Object()
				newJsonData[productIndex-1].id         = key
				newJsonData[productIndex-1].calories   = product.calories
				newJsonData[productIndex-1].category   = product.category
				
				newJsonData[productIndex-1].name       = new Object()
				newJsonData[productIndex-1].name.ru    = product.name.RUS
				newJsonData[productIndex-1].name.en    = product.name.ENG
				
				newJsonData[productIndex-1].price      = new Object()
				newJsonData[productIndex-1].price.RUS  = product.price.RU
				newJsonData[productIndex-1].price.GBR  = product.price.GB
			}	
			
			var outString  = JSON.stringify(newJsonData)
			SettingsFile   = File.desktopDirectory.resolvePath("products_p.json")					   
			SettingsStream = new FileStream()	
			
			SettingsFile.preventBackup = true
			SettingsStream.open(SettingsFile, FileMode.WRITE)
			SettingsStream.writeUTFBytes(outString)
			SettingsStream.close()
		}		
	}
}