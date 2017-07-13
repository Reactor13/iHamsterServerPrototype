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
			btn1.addEventListener  (MouseEvent.CLICK, createUser)
			
		}	
		
		function createUser(event:MouseEvent):void
		{
			var urlRequest    = new URLRequest()	
			var urlLoader     = new URLLoader()	
			var urlVars       = new URLVariables()
			
			var testJSON      = new Object
			testJSON.a        = 1
			testJSON.b        = 'str'
			
			urlLoader.addEventListener(Event.COMPLETE,        completeRequest)
			urlLoader.addEventListener(IOErrorEvent.IO_ERROR, errorRequest)
			urlVars.email          = "11111111@222122.ry"
			urlVars.password       = "123456"
			urlVars.json           = JSON.stringify(testJSON)
			urlRequest.data        = urlVars
			urlRequest.url         = "http://127.0.0.1:8080/api/createUser"
			urlRequest.method      = URLRequestMethod.POST
			urlRequest.contentType = "application/x-www-form-urlencoded"				
			urlLoader.load(urlRequest)
			
			
			function completeRequest(event:Event):void
			{
				trace ('[OK] Server answer: ' + urlLoader.data)
			}
		
			function errorRequest(event:IOErrorEvent):void
			{
				trace ('[ERROR] Server answer: ' + urlLoader.data)
			}
		}
	}
}