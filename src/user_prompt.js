var R = require("../lib/ramda.min.js");
var settings = require("./settings.js");

var ui = {
	_gameContainer: null,
	_canvasContainer: null,
	_gameLogContainer: null,
	_log: null,
	_init: function(){
		this._gameContainer = document.getElementById("gameContainer");
		this._gameContainer.setAttribute("style", "width: " + settings.canvasWidth + "px;");
		this._canvasContainer = document.getElementById("canvasContainer");
		this._gameLogContainer = document.getElementById("gameLogContainer");
		this._log = createLog.call(this);
		this._gameLogContainer.appendChild(this._log._container);
	},
	showMenu: function(text, menuItems, onSelectionMadeCallback, context){
		var prompt = createPrompt.call(this, text),
			thisObj = this;

		R.forEach(function(menuItem){
			var button = createButton.call(
				this, 
				menuItem.label, 
				menuItem.value, 
				"display: block; margin: 5px auto 0 auto; width: 100px;", 
				function(evt){ 
					destroyPrompt.call(thisObj, prompt); onSelectionMadeCallback.call(context, menuItem.value); 
				}, 
				context
			);
			prompt.appendChild(button);
		}, menuItems);

		showPrompt.call(this, prompt);
	},
	log: function(message){
		this._log.appendLine(message);
	},
	resetLog: function(){
		this._log.reset();
	}
};

ui._init();

module.exports = ui;

function createPrompt(text){
	var container = document.createElement("div"),
		prompt = document.createElement("div");
	
	container.setAttribute("style", "position: absolute; width: " + settings.canvasWidth/2 + "px; background-color: white; border: 1px solid black; margin: 0; padding: 15px;"); 
	container.appendChild(prompt);

	prompt.innerText = text;
	prompt.setAttribute("style", "text-align: center; margin: 10px auto;");

	return container;
}

function showPrompt(prompt){
	this._canvasContainer.appendChild(prompt);

	// Center prompt vertically and horizontally in canvas
	prompt.style.top = (settings.canvasHeight/2 - parseInt(prompt.clientHeight)/2) + "px";
	prompt.style.left = (settings.canvasWidth/2 - parseInt(prompt.clientWidth)/2) + "px";
}

function destroyPrompt(prompt){
	this._canvasContainer.removeChild(prompt);
}

function createButton(label, value, styleString, onClickCallback, context){
	var button = document.createElement("button");
	
	button.innerText = label;
	button.nodeValue = value;
	button.setAttribute("style", styleString); 
	button.onclick = function(evt){
		onClickCallback.call(context, evt);
	};

	return button;
}

function createLog(){
	var log = {
		_container: null,
		_textarea: null,
		_init: function(){
			this._container = document.createElement("div");
			this._container.setAttribute("style", ""); 

			this._textarea = document.createElement("textarea");
			this._textarea.setAttribute("style", "display: block; width: " + settings.canvasWidth + "px; height: 100px; padding: 5px; resize: none; box-sizing: border-box;"); 
			this._textarea.readOnly = true;

			this._container.appendChild(this._textarea);
		},
		reset: function(){
			this._textarea.value = "";
		},
		appendLine: function(text){
			this._textarea.value += text + "\n";
			this._textarea.scrollTop = this._textarea.scrollHeight;
		}
	};

	log._init();

	return log;
}