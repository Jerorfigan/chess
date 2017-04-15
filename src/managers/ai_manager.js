var gameEvent = require("../game_event.js");
var R = require("../../lib/ramda.min.js");
var settings = require("../settings.js");

var AIManager = function(boardManager){
	this.boardManager = boardManager;
	this.player = settings.aiPlayer;

	// Register for events
	gameEvent.subscribe("NextTurn", onNextTurn, this);
	gameEvent.subscribe("GameStarted", onGameStarted, this);
};

module.exports = AIManager;

/**
 * Delegates to the routines necessary in order to cause the AI to take a turn.
 */
function aiTakeTurn(){
	// Have the AI make a random move for its opener to promote diversity of play
	var currTurnID = this.boardManager.getTurnID();
	if(currTurnID == 1 || currTurnID == 2){
		makeRandomValidMove.call(this);
	}else{
		makeSmartMove.call(this);	
	}
}

/**
 * Causes the AI to perform a smart move based on a breadth-first search of viable moves
 * based on a heuristic.
 */
function makeSmartMove(){
	// Add dummy blank node to move sequence list
	var dummyMoveSeq = {moves: [], quality: 0, endgame: false},
		moveSeqList = [dummyMoveSeq],
	// Set [depth threshold]
	// Set [branch threshold]
		maxDepth = settings.aiSkillLevel == 1 ? 2 : (settings.aiSkillLevel == 2 ? 4 : 5),
		maxBranch = settings.aiSkillLevel == 1 ? 2 : (settings.aiSkillLevel == 2 ? 3 : 3),
	// Save current board state as initial board state
		initialBoardState = this.boardManager.saveBoardState(),
		thisObj = this;

	function think(){
		// Pop first move sequence from front of list and call it current move sequence
		var currMoveSeq = moveSeqList.shift();

		// If current move sequence is endgame sequence
		if(currMoveSeq.endgame){
			// Append to end of move sequence list and continue
			moveSeqList.push(currMoveSeq);
		}else{
			// If current move sequence is not dummy node
			if(currMoveSeq.moves.length > 0){
				// Perform all moves in sequence
				R.forEach(function(move){
					thisObj.boardManager.movePieceToSqr(move.piece, move.to, true);
				}, currMoveSeq.moves);
			}
			// Save current board state as base search state
			// Reset new move sequence list
			// Set current player flag based on current move sequence move list length
			var baseSearchBoardState = this.boardManager.saveBoardState(),
				newMoveSeqList = [],
				currPlayer = currMoveSeq.moves.length % 2 == 0 ? this.player : this.boardManager.getOtherPlayer(this.player); 

			// Get all possible moves for current player for current board state
			var allMovesForPlayer = this.boardManager.getAllMovesForPlayer(currPlayer);

			// For each possible move. Wrap in try-catch to allow for special exceptions to get us out of
			// forEach loop to expedite search.
			try{
				R.forEach(function(currPieceMoveSet){
					var currPiece = currPieceMoveSet.pieceID;

					R.forEach(function(currMove){
						// Set current new move sequence to clone of current move sequence
						var currNewMoveSeq = R.clone(currMoveSeq);

						// If current move is valid
						if(thisObj.boardManager.canPieceMoveToSqr(currPiece, currMove)){
							// Perform current move
							var gameOverFlags = thisObj.boardManager.movePieceToSqr(currPiece, currMove, true);

							// Get heuristic value of board state after current move with regard to player making the move
							var quality = getQualValOfCurrBoardForPlayer.call(thisObj, currPlayer);
							
							// If current player is AI
							if(currPlayer == thisObj.player){
								// Add heuristic value to current new move sequence quality property
								currNewMoveSeq.quality += quality;
							}else{
								// Subtract heuristic value from current new move sequence quality property
								currNewMoveSeq.quality -= quality;
							}

							// Set endgame property on current new move sequence
							currNewMoveSeq.endgame = gameOverFlags.checkmate || gameOverFlags.stalemate;

							// Insert current move into current new move sequence
							currNewMoveSeq.moves.push({piece: currPiece, to: currMove});

							// Is there a checkmate one move away?
							if(gameOverFlags.checkmate && currNewMoveSeq.moves.length == 1){
								// No brainer, do it
								moveSeqList = [];
								newMoveSeqList = [];
								newMoveSeqList.push(currNewMoveSeq);
								throw "CheckmateFoundOneMoveAway";
							}

							// Insert current new move sequence into new move sequence list
							newMoveSeqList.push(currNewMoveSeq);

							var compFunc = null;

							// If player is AI
							if(currPlayer == thisObj.player){
								// Sort new move sequence list by descending quality, so that we prioritize searching sequences containing the best moves for AI player
								compFunc = function(a,b){ return b.quality - a.quality; };
							}else{
								// Sort new move sequence list by ascending quality, so that we prioritize searching sequences containing the best moves for opponent player
								compFunc = function(a,b){ return a.quality - b.quality; };
							}

							// Sort new move sequence list by descending/ascending quality based on current player 
							newMoveSeqList = R.sort(compFunc, newMoveSeqList);

							// Truncate new move sequence list to [branch threshold]
							newMoveSeqList = newMoveSeqList.slice(0, maxBranch);

							// Restore board state to base search state
							thisObj.boardManager.loadBoardState(baseSearchBoardState);
						}
					}, currPieceMoveSet.moves);
				}, allMovesForPlayer);
			}catch(e){
				// Swallow special error messages designed to get us out of above forEach loop to expedite search.
				// Re-throw anything else.
				switch(e){
					case "CheckmateFoundOneMoveAway": break;
					default: 
						throw e;
				}
			}

			// Concatenate move sequence list with new move sequence list (appending all items in new move sequence list to the back of move sequence list)
			moveSeqList = moveSeqList.concat(newMoveSeqList);

			// Restore board state to initial board state
			thisObj.boardManager.loadBoardState(initialBoardState);
		}

		// Are we done thinking?
		if(
			// No more move sequences to search
			moveSeqList.length == 0 || 
			// Hit max depth in BFS tree
			moveSeqList[0].moves.length == maxDepth || 
			// Only endgame sequences left in list
			R.filter(function(moveSeq){ return !moveSeq.endgame; }, moveSeqList).length == 0
		){
			// Call the done method
			doneThinking.call(this);
		}else{
			// Keep thinking
			setTimeout(function(){ think.call(thisObj); }, 1);
		}

	}

	function doneThinking(){
		// Log AI time spent thinking
		var endTime = new Date(),
			secondsSpentThinking = (endTime.getTime() - startTime.getTime()) / 1000;
		console.log("AI spent " + secondsSpentThinking + " seconds analyzing next move.");

		// If move sequence list is empty
		if(moveSeqList.length == 0){
			// Report that AI could not find valid move 
			console.log("AI could not find valid move");
		// If move sequence list contains only 1 move sequence
		}else if(moveSeqList.length == 1){
			// Perform the move
			this.boardManager.movePieceToSqr(moveSeqList[0].moves[0].piece, moveSeqList[0].moves[0].to);
		}else{
			// Perform the move leading to the best possible outcomes

			var qualityTotalByMove = {};

			// Foreach move sequence in move sequence list
			R.forEach(function(moveSeq){
				if(moveSeq.moves.length > 0){
					// Add move sequence quality value to running total hashed by first move in sequence
					var moveKey = moveSeq.moves[0].piece + "-" + moveSeq.moves[0].to;
					if(!qualityTotalByMove[moveKey]) qualityTotalByMove[moveKey] = 0;
					qualityTotalByMove[moveKey] += moveSeq.quality;
				}
			}, moveSeqList);

			// Perform move with highest associated quality total
			var moveKeyWithHighestQuality = null;
			R.forEachObjIndexed(function(qualityTotal, moveKey){
				if(!moveKeyWithHighestQuality || qualityTotal > qualityTotalByMove[moveKeyWithHighestQuality]){
					moveKeyWithHighestQuality = moveKey;
				}
			}, qualityTotalByMove);

			var chosenMove = {pieceID: moveKeyWithHighestQuality.split("-")[0], sqrID: moveKeyWithHighestQuality.split("-")[1]};

			// Perform move
			this.boardManager.movePieceToSqr(chosenMove.pieceID, chosenMove.sqrID);
		}
	}

	// Use function that repeatedly calls itself after timeout instead of while loop so we don't block rendering/other game events
	console.log("AI is thinking...");
	var startTime = new Date();
	think.call(this);
}

/**
 * Returns the quality value for the current board state with respect to the specified player, where higher is better.
 */
function getQualValOfCurrBoardForPlayer(player){
	var quality = 0,
		pieceMetrics = this.boardManager.getPieceMetricsForPlayer(player),
		oppCapPieceCnt = this.boardManager.getPieceCntForPlayer(this.boardManager.getOtherPlayer(player), "CAPTURED");

	// Factor in piece value of uncaptured allied pieces, captured opponent pieces and attacked allied pieces
	quality += 
		pieceMetrics.uncapturedCnt.queens * settings.piecePointValueQueen + 
		pieceMetrics.uncapturedCnt.bishops * settings.piecePointValueBishop + 
		pieceMetrics.uncapturedCnt.knights * settings.piecePointValueKnight +
		pieceMetrics.uncapturedCnt.rooks * settings.piecePointValueRook +
		pieceMetrics.uncapturedCnt.pawns * settings.piecePointValuePawn;

	quality += 
		oppCapPieceCnt.queens * settings.piecePointValueQueen + 
		oppCapPieceCnt.bishops * settings.piecePointValueBishop + 
		oppCapPieceCnt.knights * settings.piecePointValueKnight +
		oppCapPieceCnt.rooks * settings.piecePointValueRook +
		oppCapPieceCnt.pawns * settings.piecePointValuePawn;

	quality += 
		-pieceMetrics.attackedCnt.queens * settings.piecePointValueQueen + 
		-pieceMetrics.attackedCnt.bishops * settings.piecePointValueBishop + 
		-pieceMetrics.attackedCnt.knights * settings.piecePointValueKnight +
		-pieceMetrics.attackedCnt.rooks * settings.piecePointValueRook +
		-pieceMetrics.attackedCnt.pawns * settings.piecePointValuePawn;

	// Factor in number of squares attacked and number of squares defended. Divive by 10 so that we weight
	// piece value deltas higher.
	quality += (pieceMetrics.numSqrsAttacked + pieceMetrics.numSqrsDefended) / 10;

	return quality;
}

/**
 * Causes the AI to perform a random valid move. 
 */
function makeRandomValidMove(){
	// Simple random move algorithm to start with
	var excludedPieces = [],
		chosenSqr = null,
		limit = 0;

	do{
		// Select a random non-captured piece, and remember which pieces we've tried to move so we
		// don't keep trying to move a piece that has no valid moves
		var nonCapturedPieces = this.boardManager.getAllPiecesForPlayer(this.player, "UNCAPTURED", excludedPieces);
		if(nonCapturedPieces.length == 0){
			console.log("AI could not find valid move");
			break;
		}
		var chosenPiece = nonCapturedPieces[Math.floor(nonCapturedPieces.length * Math.random())];
		excludedPieces.push(chosenPiece);

		// Select the first valid move for this piece, if it has one
		var moves = this.boardManager.getSqrsPieceCan(chosenPiece);
		for(var i = 0; i < moves.length; i++){
			// Validate move in case AI is in check
			if(this.boardManager.canPieceMoveToSqr(chosenPiece, moves[i])){
				chosenSqr = moves[i];
				break;
			}
		}
		limit++;
		if(limit > 2000){
			throw "Infinite loop prevented";
		}
	}while(!chosenSqr);
	
	if(chosenSqr){
		this.boardManager.movePieceToSqr(chosenPiece, chosenSqr);
	}
}

/**
 * Event handler for 'NextTurn' event.
 * @param {string} eventName the name of the fired event
 * @param {object} data the data for the event
 */
function onNextTurn(eventName, data){
	if(this.boardManager.whosTurnIsIt() == this.player){
		aiTakeTurn.call(this);
	}
}

/**
 * Event handler for 'GameStarted' event.
 * @param {string} eventName the name of the fired event
 * @param {object} data the data for the event
 */
function onGameStarted(eventName, data){
	if(this.boardManager.whosTurnIsIt() == this.player){
		aiTakeTurn.call(this);
	}
}