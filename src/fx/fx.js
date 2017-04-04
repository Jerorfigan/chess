var BoardFX = require("./board_fx.js");
var PieceFX = require("./piece_fx.js");
var settings = require("../settings.js");

var FX = function(){
	this.renderer = PIXI.autoDetectRenderer(settings.canvasWidth, settings.canvasHeight);
	this.stage = new PIXI.Container();
	document.body.appendChild(this.renderer.view);
	this.boardFX = new BoardFX(this.renderer, this.stage);
	this.pieceFX = new PieceFX(this.renderer, this.stage);
};

FX.prototype.draw = function(gameState){
	var entitiesDrawnCnt = 0;

	// Only re-draw board when we're told
	if(gameState.flags.drawBoard){
		this.boardFX.draw();
		this.pieceFX.drawPieces(gameState.boardState);
		entitiesDrawnCnt++;
	}

	if(entitiesDrawnCnt > 0){
		this.renderer.render(this.stage);
	}
};

module.exports = FX;