var BoardFX = require("./board_fx.js");
var PieceFX = require("./piece_fx.js");
var settings = require("../settings.js");
var gameEvent = require("../game_event.js");

var FX = function(onGraphicsLoadedCallback, context){
	// Init PIXI renderer and root container, aka stage
	this.renderer = PIXI.autoDetectRenderer(settings.canvasWidth, settings.canvasHeight);
	this.stage = new PIXI.Container();

	// Add renderer canvas to HTML view
	document.body.appendChild(this.renderer.view);
	
	// Graphics managers
	this.boardFX = new BoardFX();
	this.pieceFX = new PieceFX(); 

	// Graphics objects
	this.board = null;
	this.piecies = null;

	// Load graphics resources
	loadResources.call(this, onGraphicsLoadedCallback, context);

	// Register for events
	gameEvent.subscribe("BoardSetup", onBoardSetup, this);
	gameEvent.subscribe("BoardUpdated", onBoardUpdated, this);
};

module.exports = FX;

function loadResources(onGraphicsLoadedCallback, context){
	PIXI.loader
	  	.add("assets/img/pieces_tileset.json")
	 	.load(function(){ 
	 		onGraphicsLoadedCallback.call(context);
	 	});
}

function onBoardSetup(eventName, data){
	this.board = this.boardFX.build();
	this.stage.addChild(this.board);

	this.pieces = this.pieceFX.buildPieces(data.pieces);
	this.stage.addChild(this.pieces);

	this.renderer.render(this.stage);
}

function onBoardUpdated(eventName, data){
	this.stage.removeChild(this.pieces);
	this.pieces = this.pieceFX.buildPieces(data.pieces);
	this.stage.addChild(this.pieces);

	this.renderer.render(this.stage);
}