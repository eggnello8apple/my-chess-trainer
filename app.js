let board = null;
let game = new Chess();

// FIX: Using a trusted, stable, open-source Stockfish AI script distribution link
let stockfish = new Worker('https://cloudflare.com');

// Initialize the AI engine protocols
stockfish.postMessage('uci');

let stats = {
    gamesPlayed: 0,
    winStreak: 0,
    skillLevel: 1 
};

function loadProgress() {
    const saved = localStorage.getItem('chess_trainer_stats');
    if (saved) {
        stats = JSON.parse(saved);
    }
    updateDashboard();
}

function saveProgress() {
    localStorage.setItem('chess_trainer_stats', JSON.stringify(stats));
    updateDashboard();
}

function updateDashboard() {
    document.getElementById('games-count').innerText = stats.gamesPlayed;
    document.getElementById('streak-count').innerText = stats.winStreak;
    document.getElementById('ai-level').innerText = stats.skillLevel;
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false; // Player can only drag White pieces
}

function onDrop(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' 
    });

    if (move === null) return 'snapback';

    window.setTimeout(makeAIMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
    checkGameStatus();
}

function makeAIMove() {
    if (game.game_over()) return;

    // Send difficulty configuration to Stockfish engine
    stockfish.postMessage(`setoption name Skill Level value ${stats.skillLevel}`);
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 10'); 

    stockfish.onmessage = function(event) {
        // FIX: Replaced custom string substring errors with clean space-parsing split checks
        if (event.data.startsWith('bestmove')) {
            const parts = event.data.split(' ');
            const bestMove = parts[1]; // Extracts the actual move string e.g., 'e7e5'
            
            game.move({ 
                from: bestMove.substring(0, 2), 
                to: bestMove.substring(2, 4), 
                promotion: bestMove.substring(4, 5) || 'q' 
            });
            
            board.position(game.fen());
            checkGameStatus();
            giveCoachFeedback();
        }
    };
}

function giveCoachFeedback() {
    let history = game.history({ verbose: true });
    if (history.length === 0) return;
    let lastMove = history[history.length - 1];
    
    if (lastMove.san.includes('+')) {
        document.getElementById('coach').innerText = "Coach: Nice check! Keep up the tactical pressure.";
    } else if (lastMove.captured) {
        document.getElementById('coach').innerText = "Coach: Clean capture. Keep evaluating material balance.";
    } else {
        document.getElementById('coach').innerText = "Coach: Solid positional development.";
    }
}

function checkGameStatus() {
    if (game.in_checkmate()) {
        stats.gamesPlayed++;
        if (game.turn() === 'b') { 
            stats.winStreak++;
            document.getElementById('coach').innerText = "Victory! The AI coach is raising your dynamic level.";
            if(stats.skillLevel < 20) stats.skillLevel++;
        } else { 
            stats.winStreak = 0;
            document.getElementById('coach').innerText = "Checkmate. Try analyzing where your defenses failed.";
        }
        saveProgress();
    } else if (game.in_draw()) {
        stats.gamesPlayed++;
        document.getElementById('coach').innerText = "Game drawn by stalemate or repetition.";
        saveProgress();
    }
}

function resetGame() {
    game.reset();
    board.start();
    document.getElementById('coach').innerText = "New match started. Focus on control of the center squares.";
}

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = Chessboard('board', config);
loadProgress();
