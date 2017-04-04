var BoardManager = require("./board_manager.js");
var FX = require("../fx/fx.js");

var GameManager = function(){
	this.boardManager = new BoardManager();
	this.fx = new FX();
	this.gameState = {flags: {}};
	this.firstDraw = true;
	console.log("Game Manager initialized.");
};

GameManager.prototype.updateGameState = function(){

};

GameManager.prototype.drawGameState = function(){
	// Send entire board state on first draw and tell graphics to draw it.
	// For subsequent draw calls, only send player moves as they occur.
	if(this.firstDraw){
		this.firstDraw = false;
		this.gameState['boardState'] = this.boardManager.getState();
		this.gameState.flags['drawBoard'] = true;
	}else{
		delete this.gameState['boardState'];
		this.gameState.flags['drawBoard'] = false;
	}

	this.fx.draw(this.gameState);
};

module.exports = GameManager;