// Visual layout configuration binding with remote image theme path fallback
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    // FIX: Tells the board to stream piece images from an online public library instead of looking locally
    pieceTheme: 'https://chessboardjs.com{piece}.png'
};

// Start application processes safely
$(document).ready(function() {
    board = Chessboard('board', config);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    loadProgress();
});
