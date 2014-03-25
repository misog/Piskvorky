	/**
	* Zisti ci sa element nachadza v poli pomocou porovnavacej funkcie
	*/
	function inArray(element,array,cmpFunction){
		for(var i in array){
			if (cmpFunction(array[i],element)) return true;
		}
		return false;
	}

	/**
	* Vrati prienik mnozin
	*/
	function intersection(array1,array2,cmpFunction){
		var result = new Array();
		for(var i in array1){
			if (inArray(array1[i],array2,cmpFunction)){
				result.push(array1[i]);
			}
		}
		return result;
	}

	/**
	* Objekt hry piskvorky
	*/
	function Game(config){
		this.config = config
		this.canvas = $('#'+config['canvas']).get(0);
		this.cols = config['cols'];
		this.rows = config['rows'];
		this.scale = config['scale'];
		this.winningScore = config['winningScore'];
		this.context = this.canvas.getContext("2d");
		this.canvas.height = this.rows*this.scale;
		this.canvas.width = this.cols*this.scale;
		this.fields = new Array(this.rows);
		this.player1 = 1;
		this.player2 = 2;
		this.humanPlayer = this.player1;
		this.AIplayer = this.player2;
		if ((config['starts'] !== undefined) && config['starts'].toLowerCase()==='ai'){
			this.startingPlayer = this.AIplayer;
		}else{
			this.startingPlayer = this.humanPlayer;
		}
		this.currentPlayer = this.startingPlayer;
		var game = this;

		/**
		* Objekt policka
		*/
		function Field(y,x,p){
			this.player = p;
			this.x = x;
			this.y = y;
			this.visited = 0;
			var border = 3;
			var self = this;

			this.draw = function(){
				game.context.lineWidth = 3;
				if (this.player === 1){
					game.context.strokeStyle = "black";
					game.context.beginPath();
					game.context.moveTo(x*game.scale+border,y*game.scale+border);
					game.context.lineTo(x*game.scale+game.scale-border,y*game.scale+game.scale-border);
					game.context.moveTo(x*game.scale+game.scale-border,y*game.scale+border);
					game.context.lineTo(x*game.scale+border,y*game.scale+game.scale-border);
					game.context.stroke();
				}else if (this.player === 2){
					game.context.strokeStyle = "red";
					game.context.beginPath();
					game.context.arc(x*game.scale+game.scale/2,y*game.scale+game.scale/2,game.scale/2-border,0,2*Math.PI);
					game.context.stroke();
				}
			};

			this.hasNeighbor = function(player){
				if (game.fields[self.y+1] !== undefined && game.fields[self.y+1][self.x+0] !== undefined && game.fields[self.y+1][self.x+0].player === player){
					return true;
				}
				if (game.fields[self.y-1] !== undefined && game.fields[self.y-1][self.x+0] !== undefined && game.fields[self.y-1][self.x+0].player === player){
					return true;
				}
				if (game.fields[self.y+0] !== undefined && game.fields[self.y+0][self.x+1] !== undefined && game.fields[self.y+0][self.x+1].player === player){
					return true;
				}
				if (game.fields[self.y+0] !== undefined && game.fields[self.y+0][self.x-1] !== undefined && game.fields[self.y+0][self.x-1].player === player){
					return true;
				}
				if (game.fields[self.y+1] !== undefined && game.fields[self.y+1][self.x+1] !== undefined && game.fields[self.y+1][self.x+1].player === player){
					return true;
				}
				if (game.fields[self.y-1] !== undefined && game.fields[self.y-1][self.x-1] !== undefined && game.fields[self.y-1][self.x-1].player === player){
					return true;
				}
				if (game.fields[self.y+1] !== undefined && game.fields[self.y+1][self.x-1] !== undefined && game.fields[self.y+1][self.x-1].player === player){
					return true;
				}
				if (game.fields[self.y-1] !== undefined && game.fields[self.y-1][self.x+1] !== undefined && game.fields[self.y-1][self.x+1].player === player){
					return true;
				}
				return false;
			}
		}

		/**
		* Spocita suvisly usek rovnakych policok od sy,sx so zadanymi posunmi vy,vx
		*/
		function count(array,predicate,sy,sx,vy,vx){
			var counter = 0;
			var i = sy;
			var j = sx;
			while((i >= 0 && i <= array.length - 1) && (j >= 0 && j <= array[i].length - 1)){
				if (! predicate(array[i][j])){
					return counter;
				}
				counter++;
				i = i+vy;
				j = j+vx;
			}
			return counter;
		}

		/**
		* Najde pole najlepsich tahov pre hraca
		*/
		function findBestMoves(array,player){
			var originalScore = getMaxScore(array,player);
			var maxScore = -1;
			var bestMoves = new Array();
			for (var i = array.length - 1; i >= 0; i--) {
				for (var j =array[i].length - 1; j >= 0; j--) {
					if (array[i][j].player !== 0) continue;
					if (! array[i][j].hasNeighbor(player)) continue;
					array[i][j].player = player;
					var newMaxScore = getMaxScore(array,player);
					array[i][j].player = 0;
					if (newMaxScore >= maxScore){
						if (newMaxScore > maxScore){ // ak sme nasli este lepsi tak nechceme horsie
							bestMoves = new Array();
						}
						maxScore = newMaxScore;
						bestMoves.unshift({'x':j,'y':i}); // tu moze byt kvoli predoslej poznamke aj push
					}
				};
			};
			if (maxScore === originalScore){
				console.log('Neoptimalny tah'); // nastala situacia, ze sme nemohli zvysit max skore
			}
			return bestMoves;
		}

		/**
		* Zisti maximalne skore hraca (maximalny suvisly usek)
		*/
		function getMaxScore(array,player){
			var max = 0;
			for (var i = array.length - 1; i >= 0; i--) {
				for (var j = array[i].length - 1; j >= 0; j--) {
					if (array[i][j].player !== player) continue;
					var cLeft =  count(array,function(e){return e.player === player},i,j,0,-1) - 1;
					var cRight = count(array,function(e){return e.player === player},i,j,0,1) - 1;
					var cDown = count(array,function(e){return e.player === player},i,j,1,0) - 1;
					var cUp = count(array,function(e){return e.player === player},i,j,-1,0) - 1;
					var cLeftDown = count(array,function(e){return e.player === player},i,j,1,-1) - 1;
					var cLeftUp = count(array,function(e){return e.player === player},i,j,-1,-1) - 1;
					var cRightDown = count(array,function(e){return e.player === player},i,j,1,1) - 1;
					var cRightUp = count(array,function(e){return e.player === player},i,j,-1,1) - 1;
					max = Math.max(max,1+cLeft+cRight,1+cDown+cUp,1+cLeftDown+cRightUp,1+cRightDown+cLeftUp);
				};
			};
			return max;
		}

		/**
		* Vrati toho hraca ktory vyhral, inak null
		*/
		function getWinner(){
			if (getMaxScore(game.fields,game.player1) >= game.winningScore){
				return game.player1;
			}
			if (getMaxScore(game.fields,game.player2) >= game.winningScore){
				return game.player2;
			}
			return null;
		}

		function switchPlayer(){
			game.currentPlayer = game.currentPlayer % 2 + 1;
		}

		function initFields(){
			game.context.strokeStyle = "#EEEEEE";
			game.context.strokeRect(0,0,game.canvas.width,game.canvas.height);
			for (var i = game.fields.length - 1; i >= 0; i--) {
				game.context.beginPath();
				game.context.moveTo(0,i*game.scale);
				game.context.lineTo(game.canvas.width,i*game.scale);
				game.context.stroke();
				game.fields[i] = new Array(game.cols);
				for (var j = game.fields[i].length - 1; j >= 0; j--) {
					game.context.beginPath();
					game.context.moveTo(j*game.scale,0);
					game.context.lineTo(j*game.scale,game.canvas.height);
					game.context.stroke();
					game.fields[i][j] = new Field(i,j,0);
				};
			};
		}

		function doAI(){
			var bestMovesHuman = findBestMoves(game.fields,game.humanPlayer);
			// console.log('bestMovesHuman');
			// console.log(bestMovesHuman);
			var bestMovesAI = findBestMoves(game.fields,game.AIplayer);
			// console.log('bestMovesAI');
			// console.log(bestMovesAI);
			var bestMoves = intersection(bestMovesHuman,bestMovesAI,function(e1,e2){return e1.x===e2.x && e1.y===e2.y;});
			// console.log('bestMoves');
			// console.log(bestMoves);
			var move = null;
			var bestScoreHuman = getMaxScore(game.fields,game.humanPlayer);
			var bestScoreAI = getMaxScore(game.fields,game.AIplayer);
			if (bestMoves.length > 0){
				move = bestMoves[0];
				console.log('intersection');
			}else if (bestMovesHuman.length > 0 && bestMovesAI.length > 0){
				if (bestScoreAI > bestScoreHuman){
					move = bestMovesAI[0];
					console.log('bestScoreAI > bestScoreHuman');
				}else if (bestScoreAI < bestScoreHuman){
					move = bestMovesHuman[0];
					console.log('bestScoreAI < bestScoreHuman');
				}else if (game.startingPlayer === game.AIplayer){
					move = bestMovesAI[0];
					console.log('bestScoreAI started');
				}else{
					move = bestMovesHuman[0];
					console.log('bestScoreHuman started');
				}
			}else{
				if (bestMovesHuman.length > 0){
					move = bestMovesHuman[0];
					console.log('bestScoreHuman koniec');
				}else if (bestMovesAI.length > 0){
					move = bestMovesAI[0];
					console.log('bestScoreAI koniec');
				}
			}
			if (move === null){
				console.log('Chyba, AI nenasiel tah');
				alert('Chyba, AI nenasiel tah');
			}else{
				game.fields[move.y][move.x].player = game.AIplayer;
			}
		}

		function draw(){
			game.context.strokeStyle = "#EEEEEE";
			for (var i = game.fields.length - 1; i >= 0; i--) {
				for (var j = game.fields.length - 1; j >= 0; j--) {
					game.fields[i][j].draw();
				};
			};
		}

		game.canvas.addEventListener('click', function(e){
			var offset = $(game.canvas).offset();
			var xi = Math.floor((e.x-offset.left)/game.scale);
			var yi = Math.floor((e.y-offset.top)/game.scale);
			if (game.fields[yi][xi].player === 0){
				game.fields[yi][xi].player = game.currentPlayer;
				switchPlayer();
				if (game.currentPlayer === game.AIplayer){
					doAI();
					switchPlayer();
				}
			}
			draw();

			var winner = getWinner();

			if (winner === game.AIplayer){
				alert('Vyhral počítač!');
			}
			if (winner === game.humanPlayer){
				alert('Vyhral si!');
			}

			console.log('Priebezne skore AI: '+getMaxScore(game.fields,game.AIplayer));
			console.log('Priebezne skore human: '+getMaxScore(game.fields,game.humanPlayer));
		});

		initFields();

		// ak zacina AI, zacne v strede
		if (game.startingPlayer === game.AIplayer){
			game.fields[game.rows/2][game.cols/2].player = game.AIplayer;
			switchPlayer();
		}
		draw();
	}