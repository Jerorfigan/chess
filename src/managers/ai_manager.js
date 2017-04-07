var gameEvent = require("../game_event.js");

var AIManager = function(boardManager){
	this.boardManager = boardManager;

	// Register for events
	gameEvent.subscribe("PlayerMovedPiece", onPlayerMovedPiece, this);
};

module.exports = AIManager;

function onPlayerMovedPiece(){
	if(this.boardManager.getCurrentTurn() == 2){
		this.boardManager.movePiece("h7", "h5");
	}
	if(this.boardManager.getCurrentTurn() == 4){
		this.boardManager.movePiece("a7", "a5");
	}

	gameEvent.fire("AIMovedPiece");
}