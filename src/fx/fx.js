var BoardFX = require("./board_fx.js");
var PieceFX = require("./piece_fx.js");
var settings = require("../settings.js");

var FX = function(){
	// Init PIXI renderer and root container, aka stage
	this.renderer = PIXI.autoDetectRenderer(settings.canvasWidth, settings.canvasHeight);
	this.stage = new PIXI.Container();
	this.renderer.render(this.stage);

	// Add renderer canvas to HTML view
	document.body.appendChild(this.renderer.view);

	// Init flags
	this.flags = {idle: false, allResourcesLoaded: false};
	
	// Graphics objects
	this.board = null;
	this.piecies = null;

	// Load graphics/sound resources
	loadResources.call(this);
};

FX.prototype.getFlags = function(){
	return this.flags;
};

FX.prototype.update = function(gameState){
	// Create board if it doesn't exist
	if(!this.board){
		var boardFX = new BoardFX();
		this.board = boardFX.build();
		this.stage.addChild(this.board);
		this.renderer.render(this.stage);
	}

	// Create pieces if they don't already exist and we have board state
	if(!this.pieces && !!gameState.boardState){
		var pieceFX = new PieceFX();
		this.pieces = pieceFX.buildPieces(gameState.boardState);
		this.stage.addChild(this.pieces);
		this.renderer.render(this.stage);
	}else{
		// Update pieces if the logic board state doesn't match the graphical board state 
	}
};

module.exports = FX;

function loadResources(){
	var thisObj = this;
	PIXI.loader
	  	.add("assets/img/pieces_tileset.json")
	 	.load(function(){ thisObj.flags.idle = true; thisObj.flags.allResourcesLoaded = true; });
}