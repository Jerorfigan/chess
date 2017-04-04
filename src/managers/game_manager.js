var BoardManager = require("./board_manager.js");
var FX = require("../fx/fx.js");
var settings = require("../settings.js");
var PlayerManager = require("./player_manager.js");
var AIManager = require("./ai_manager.js");

var GameManager = function(){
	// Init game state
	this.gameState = {playerColor: "white", isPlayerTurn: true, boardState: null};

	// Init managers
	this.boardManager = new BoardManager(this.gameState);
	this.playerManager = new PlayerManager(this.gameState, this.boardManager);
	this.aiManager = new AIManager(this.gameState, this.boardManager);

	// Init graphics
	this.fx = new FX();

	// Init game manager flags
	this.fxFlags = {drawBoard: true};
};

GameManager.prototype.updateGameState = function(){
	// Only update game state when graphics is idle (not busy loading images or animating)
	if(this.fx.getFlags().idle){
		if(this.isPlayerTurn){
			if(this.playerManager.hasTakenTurn()){
				this.isPlayerTurn = false;
				this.fxFlags.drawBoard = true;
			}
		}else{
			this.aiManager.takeTurn();
			this.isPlayerTurn = true;
			this.fxFlags.drawBoard = true;
		}
	}
};

GameManager.prototype.drawGameState = function(){
	// Only draw game state when graphics is fully loaded (not busy loading images/other resource files)
	if(this.fx.getFlags().allResourcesLoaded){
		// Tell graphics to draw board on first call, and only when it changes on subsequent calls
		this.fx.draw(this.gameState, this.fxFlags);
		this.fxFlags.drawBoard = false;
	}
};

module.exports = GameManager;