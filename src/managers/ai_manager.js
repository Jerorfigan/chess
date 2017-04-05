var gameEvent = require("../game_event.js");

var AIManager = function(boardManager){
	this.boardManager = boardManager;

	// Register for events
	gameEvent.subscribe("PlayerMovedPiece", onPlayerMovedPiece, this);
};

module.exports = AIManager;

function onPlayerMovedPiece(){
	// Take turn
	// TODO
	gameEvent.fire("AIMovedPiece");
}