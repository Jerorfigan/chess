var BoardManager = require("./board_manager.js");

var GameManager = function(){
	this.boardManager = new BoardManager();
	console.log("Game Manager initialized.");
};

GameManager.prototype.updateGameState = function(){
	//console.log((new Date()).getTime() + ": Updating game state...");
};

GameManager.prototype.drawGameState = function(){
	//console.log((new Date()).getTime() + ": Drawing game state...");
};

module.exports = GameManager;