let board = null;
let game = new Chess();
let stockfish = null;

// SECURITY BYPASS: Creates an inline Web Worker to prevent CORS network blocking
try {
    const workerCode = "importScripts('https://cloudflare.com');";
    const blob = new Blob([workerCode], { type: "application/javascript" });
    stockfish = new Worker(URL.createObjectURL(blob));
    stockfish.postMessage('uci');
} catch (e) {
    console.error("Failed to load Stockfish engine worker safely:", e);
}

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
    // Player is always White pieces
    if (piece.search(/^b/) !== -1) return false; 
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
    if (game.game_over() || !stockfish) return;

    stockfish.postMessage(`setoption name Skill Level value ${stats.skillLevel}`);
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 8'); 

    stockfish.onmessage = function(event) {
        if (event.data.startsWith('bestmove')) {
            const parts = event.data.split(' ');
            const bestMove = parts[1]; 
            
            if (bestMove && bestMove !== '(none)') {
                game.move({ 
                    from: bestMove.substring(0, 2), 
                    to: bestMove.substring(2, 4), 
                    promotion: bestMove.substring(4, 5) || 'q' 
                });
                board.position(game.fen());
                checkGameStatus();
                giveCoachFeedback();
            }
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
            document.getElementById('coach').innerText = "Victory! The AI coach is raising your difficulty level.";
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
    if (board) {
        board.start();
    }
    document.getElementById('coach').innerText = "New match started. Focus on controlling center squares.";
}

// Visual layout configuration binding
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

// Start application processes safely
$(document).ready(function() {
    board = Chessboard('board', config);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    loadProgress();
});
