var BoardFX = require("./board_fx.js");
var PieceFX = require("./piece_fx.js");
var settings = require("../settings.js");

var FX = function(){
	// Init PIXI renderer and root container, aka stage
	this.renderer = PIXI.autoDetectRenderer(settings.canvasWidth, settings.canvasHeight);
	this.stage = new PIXI.Container();
	
	// Init flags
	this.flags = {idle: false, allResourcesLoaded: false};
	
	// Init FX sub-managers
	this.boardFX = new BoardFX(this.renderer, this.stage);
	this.pieceFX = new PieceFX(this.renderer, this.stage, this.boardFX);

	// Add renderer canvas to HTML view
	document.body.appendChild(this.renderer.view);

	// Load graphics/sound resources
	loadResources.call(this);
};

FX.prototype.getFlags = function(){
	return this.flags;
};

FX.prototype.draw = function(gameState, flags){
	var entitiesDrawnCnt = 0;

	// Only re-draw board when we're told
	if(flags.drawBoard){
		this.boardFX.draw();
		this.pieceFX.drawAllPiecesFromBoardState(gameState.boardState);
		entitiesDrawnCnt++;
	}

	if(entitiesDrawnCnt > 0){
		this.renderer.render(this.stage);
	}
};

module.exports = FX;

function loadResources(){
	var thisObj = this;
	PIXI.loader
	  	.add("assets/img/pieces_tileset.json")
	 	.load(function(){ thisObj.flags.idle = true; thisObj.flags.allResourcesLoaded = true; });
}