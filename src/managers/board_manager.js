var R = require("../../lib/ramda.min.js");
var gameEvent = require("../game_event.js");

var BoardManager = function(gameState){	
	this.gameState = gameState;

	// Constants
	this.pieceStartPos = {
		WK: "e1", WQ: "d1", WBc: "c1", WBf: "f1",  WNb: "b1", WNg: "g1", WRa: "a1", WRh: "h1", WPa: "a2", WPb: "b2", WPc: "c2", WPd: "d2", WPe: "e2", WPf: "f2", WPg: "g2", WPh: "h2",
		BK: "e8", BQ: "d8", BBc: "c8", BBf: "f8",  BNb: "b8", BNg: "g8", BRa: "a8", BRh: "h8", BPa: "a7", BPb: "b7", BPc: "c7", BPd: "d7", BPe: "e7", BPf: "f7", BPg: "g7", BPh: "h7"
	};
	this.pieces = ["K", "Q", "Bc", "Bf", "Nb", "Ng", "Ra", "Rh", "Pa", "Pb", "Pc", "Pd", "Pe", "Pf", "Pg", "Ph"];
	this.players = ["W", "B"];
	
	// Init maps
	this.piece2board = {};
	this.board2piece = {};
	initPiece2Board.call(this);
	initBoard2Piece.call(this);

	gameEvent.fire("BoardSetup", {pieces: this.board2piece});
};

BoardManager.prototype.isValidMove = function(fromSqrID, toSqrID){
	var pieceID = this.board2piece[fromSqrID],
		destPieceID = this.board2piece[toSqrID],
		toSqrIsEmpty = destPieceID == null ? true : false,
		toSqrContainsOpponentPiece = destPieceID != null && destPieceID.charAt(0) != pieceID.charAt(0) ? true : false,
		validMoves = getValidMoves(pieceID, fromSqrID);

	return R.contains(toSqrID, validMoves) && (toSqrIsEmpty || toSqrContainsOpponentPiece);
};

BoardManager.prototype.movePiece = function(sourceSqrID, targetSqrID){
	if(!this.board2piece[sourceSqrID]) throw "Attempt to move piece from empty square";

	console.log("Moving " + this.board2piece[sourceSqrID] + " from " + sourceSqrID + " to " + targetSqrID);

	// Update board2piece map
	var movingPieceID = this.board2piece[sourceSqrID];
	delete this.board2piece[sourceSqrID];
	if(this.board2piece[targetSqrID]){
		// Capturing
		// TODO
	}else{
		this.board2piece[targetSqrID] = movingPieceID;
	}
	// Update piece2board map
	var movingPiece = this.piece2board[movingPieceID];
	movingPiece.rank = targetSqrID.charAt(1);
	movingPiece.file = targetSqrID.charAt(0);

	gameEvent.fire("BoardUpdated", {pieces: this.board2piece});
};

BoardManager.prototype.squareHasPlayerPiece = function(sqrID, player){
	return this.board2piece[sqrID] && this.board2piece[sqrID].charAt(0) == player; 
};

module.exports = BoardManager;

function initPiece2Board(){
	var thisObj = this;
	R.forEach(function(player){
		R.forEach(function(piece){
			var pieceID = player + piece;
			thisObj.piece2board[pieceID] = {
				rank: thisObj.pieceStartPos[pieceID].charAt(1),
				file: thisObj.pieceStartPos[pieceID].charAt(0),
				pieceAbbrev: piece.charAt(0)
			};
		}, thisObj.pieces);
	}, this.players);
}

function initBoard2Piece(){
	var thisObj = this;
	R.forEachObjIndexed(function(startPos, pieceID){
		thisObj.board2piece[startPos] = pieceID;
	}, this.pieceStartPos);
}

function getValidMoves(pieceID, sqrID){
	var validMoves = [],
		offsets = [],
		fileNumeral = sqrID.charCodeAt(0) - 96, // 1 thru 8 corresponding to a thru h
		rankNumeral = parseInt(sqrID.charAt(1));

	function addRankAndFileStrafeOffsets(offsets){
		// Build offets for strafing across a given rank
		for(var fileOffset = (-fileNumeral + 1); fileOffset <= (8 - fileNumeral); fileOffset++){
			if(fileOffset == 0) continue;
			offsets.push({fileOffset: fileOffset, rankOffset: 0});
		}

		// Build offsets for strafing across a given file
		for(var rankOffset = (-rankNumeral + 1); rankOffset <= (8 - rankNumeral); rankOffset++){
			if(rankOffset == 0) continue;
			offsets.push({fileOffset: 0, rankOffset: rankOffset});
		}
	}

	function addDiagonalStrafeOffsets(offsets){
		// Build offsets for strafing the diagonals
		var directions = ["NW", "NE", "SW", "SE"];
		for(var i = 0; i < directions.length; i++){
			var dir = directions[i],
				fileOffset = dir == "NW" || dir == "SW" ? 1 : -1,
				rankOffset = dir == "NW" || dir == "NE" ? 1 : -1;
			while(
				(fileOffset + fileNumeral) >= 1 &&
				(fileOffset + fileNumeral) <= 8 && 
				(rankOffset + rankNumeral)   >= 1 &&
				(rankOffset + rankNumeral)   <= 8
			)
			{
				offsets.push({fileOffset: fileOffset, rankOffset: rankOffset});
				dir == "NW" || dir == "SW" ? fileOffset++ : fileOffset--;
				dir == "NW" || dir == "NE" ? rankOffset++ : rankOffset--;
			}
		}
	} 

	switch(pieceID.charAt(1)){
		case "K":
			for(var fileOffset = fileNumeral > 1 ? -1 : 0; fileOffset <= (fileNumeral < 8 ? 1 : 0); fileOffset++){
				for(var rankOffset = rankNumeral > 1 ? -1 : 0; rankOffset <= (rankNumeral < 8 ? 1 : 0); rankOffset++){
					if(fileOffset == 0 && rankOffset == 0) continue;
					offsets.push({fileOffset: fileOffset, rankOffset: rankOffset});
				}
			}
		break;
		case "Q":
			addRankAndFileStrafeOffsets(offsets);
			addDiagonalStrafeOffsets(offsets);
		break;
		case "B":
			addDiagonalStrafeOffsets(offsets);
		break;
		case "N":
			fileNumeral > 1 && rankNumeral < 7 ? offsets.push({fileOffset: -1, rankOffset: 2}) : 0;
			fileNumeral < 8 && rankNumeral < 7 ? offsets.push({fileOffset: 1, rankOffset: 2}) : 0;
			fileNumeral > 2 && rankNumeral < 8 ? offsets.push({fileOffset: -2, rankOffset: 1}) : 0;
			fileNumeral > 2 && rankNumeral > 1 ? offsets.push({fileOffset: -2, rankOffset: -1}) : 0;
			fileNumeral > 1 && rankNumeral > 2 ? offsets.push({fileOffset: -1, rankOffset: -2}) : 0;
			fileNumeral < 8 && rankNumeral > 2 ? offsets.push({fileOffset: 1, rankOffset: -2}) : 0;
			fileNumeral < 7 && rankNumeral < 8 ? offsets.push({fileOffset: 2, rankOffset: 1}) : 0;
			fileNumeral < 7 && rankNumeral > 1 ? offsets.push({fileOffset: 2, rankOffset: -1}) : 0;
		break;
		case "R":
			addRankAndFileStrafeOffsets(offsets);
		break;
		case "P":
			if(pieceID.charAt(0) == "W"){
				offsets.push({fileOffset: 0, rankOffset: 1});
				if(rankNumeral == 2){
					offsets.push({fileOffset: 0, rankOffset: 2});
				}
			}else{
				offsets.push({fileOffset: 0, rankOffset: -1});
				if(rankNumeral == 7){
					offsets.push({fileOffset: 0, rankOffset: -2});
				}
			}
			// TODO add pawn attack moves and en passant
		break;
	}

	R.forEach(function(offset){
		var validMoveNumeric = {fileNumeral: offset.fileOffset + fileNumeral, rankNumeral: offset.rankOffset + rankNumeral};
		validMoves.push(String.fromCharCode(validMoveNumeric.fileNumeral + 96) + validMoveNumeric.rankNumeral);
	}, offsets);

	return validMoves;
}