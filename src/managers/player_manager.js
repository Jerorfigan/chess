var PlayerManager = function(gameState, boardManager){
	this.gameState = gameState;
	this.boardManager = boardManager;
};

PlayerManager.prototype.hasTakenTurn = function(){
	// TODO
	return true;
};

module.exports = PlayerManager;