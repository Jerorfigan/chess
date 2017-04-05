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
};

GameManager.prototype.updateGameState = function(){
	// Only update game state when graphics is idle (not busy loading images or animating)
	if(this.fx.getFlags().idle){
		if(this.isPlayerTurn){
			if(this.playerManager.hasTakenTurn()){
				this.isPlayerTurn = false;
			}
		}else{
			this.aiManager.takeTurn();
			this.isPlayerTurn = true;
		}
	}
};

GameManager.prototype.updateGameGraphics = function(){
	// Only update game graphics once graphics is fully loaded (not busy loading images/other resource files)
	if(this.fx.getFlags().allResourcesLoaded){
		this.fx.update(this.gameState);
	}
};

module.exports = GameManager;