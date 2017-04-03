var R = require("../../lib/ramda.min.js");

var BoardManager = function(){
	this.pieceStartPos = {
		WK: "e1", WQ: "d1", WBc: "c1", WBf: "f1",  WNb: "b1", WNg: "g1", WRa: "a1", WRh: "h1", WPa: "a2", WPb: "b2", WPc: "c2", WPd: "d2", WPe: "e2", WPf: "f2", WPg: "g2", WPh: "h2",
		BK: "e8", BQ: "d8", BBc: "c8", BBf: "f8",  BNb: "b8", BNg: "g8", BRa: "a8", BRh: "h8", BPa: "a7", BPb: "b7", BPc: "c7", BPd: "d7", BPe: "e7", BPf: "f7", BPg: "g7", BPh: "h7"
	};
	this.pieces = ["K", "Q", "Bc", "Bf", "Nb", "Ng", "Ra", "Rh", "Pa", "Pb", "Pc", "Pd", "Pe", "Pf", "Pg", "Ph"];
	this.players = ["W", "B"];
	this.piece2board = {};
	this.board2piece = {};
	initPiece2Board.call(this);
	initBoard2Piece.call(this);
	console.log(this.piece2board);
	console.log(this.board2piece);
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