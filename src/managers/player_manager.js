var gameEvent = require("../game_event.js");

var PlayerManager = function(gameState, boardManager){
	this.gameState = gameState;
	this.boardManager = boardManager;

	gameEvent.subscribe("BoardSquareSelected", this.onPlayerSelectedSquare, this);
};

PlayerManager.prototype.hasTakenTurn = function(){
	// TODO
	return true;
};

PlayerManager.prototype.onPlayerSelectedSquare = function(eventName, data){
	console.log("Player selected square: " + data.sqrID);
};

module.exports = PlayerManager;