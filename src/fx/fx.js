var BoardFX = require("./board_fx.js");
var PieceFX = require("./piece_fx.js");
var settings = require("../settings.js");
var gameEvent = require("../game_event.js");

var FX = function(onGraphicsLoadedCallback, context){
	// Init PIXI renderer and root container, aka stage
	this.renderer = PIXI.autoDetectRenderer(settings.canvasWidth, settings.canvasHeight);
	this.stage = new PIXI.Container();

	// Add renderer canvas to HTML view
	document.getElementById("canvasContainer").appendChild(this.renderer.view);
	
	// Graphics managers
	this.boardFX = new BoardFX(this.renderer, this.stage);
	this.pieceFX = new PieceFX(this.renderer, this.stage, this.boardFX);

	// Load graphics resources
	loadResources.call(this, onGraphicsLoadedCallback, context);
};

module.exports = FX;

function loadResources(onGraphicsLoadedCallback, context){
	PIXI.loader
	  	.add("assets/img/pieces_tileset.json")
	 	.load(function(){ 
	 		onGraphicsLoadedCallback.call(context);
	 	});
}