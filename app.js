let board = null;
let game = new Chess();
let stockfish = new Worker('https://cloudflare.com');

// User Progress State
let stats = {
    gamesPlayed: 0,
    winStreak: 0,
    skillLevel: 1 // Stockfish levels range 1-20
};

// Load saved progress instantly on load
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

// Logic for handling piece movements
function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false; // Player is always White
}

function onDrop(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Auto-promote to queen for simplicity
    });

    if (move === null) return 'snapback';

    window.setTimeout(makeAIMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
    checkGameStatus();
}

// AI Engine Implementation
function makeAIMove() {
    if (game.game_over()) return;

    // Configure Stockfish level dynamic to your saved skill level
    stockfish.postMessage(`setoption name Skill Level value ${stats.skillLevel}`);
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go depth 10'); // Looks ahead 10 moves max

    stockfish.onmessage = function(event) {
        if (event.data.startsWith('bestmove')) {
            const move = event.data.split(' ')[1];
            game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: move.substring(4, 5) });
            board.position(game.fen());
            checkGameStatus();
            giveCoachFeedback();
        }
    };
}

// Real-time AI Coach Feedback Feature
function giveCoachFeedback() {
    let history = game.history({ verbose: true });
    if (history.length === 0) return;
    let lastMove = history[history.length - 1];
    
    // Simplistic heuristic coach
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
        if (game.turn() === 'b') { // White won
            stats.winStreak++;
            document.getElementById('coach').innerText = "Victory! The AI coach is raising your dynamic level.";
            if(stats.skillLevel < 20) stats.skillLevel++;
        } else { // Black won
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

// Initialization code
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = Chessboard('board', config);
loadProgress();
