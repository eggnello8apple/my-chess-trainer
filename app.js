document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const boardEl = document.getElementById("board");

  let board = [];
  let selectedSquare = null; // { row, col }

  startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";
    initBoardArray();
    renderBoard();
  });

  function initBoardArray() {
    board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"]
    ];
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        if ((row + col) % 2 === 0) {
          square.classList.add("light");
        } else {
          square.classList.add("dark");
        }

        square.dataset.row = row;
        square.dataset.col = col;

        const piece = board[row][col];
        if (piece) {
          square.textContent = pieceToUnicode(piece);
        }

        square.addEventListener("click", onSquareClick);

        boardEl.appendChild(square);
      }
    }
  }

  function onSquareClick(e) {
    const squareEl = e.currentTarget;
    const row = parseInt(squareEl.dataset.row, 10);
    const col = parseInt(squareEl.dataset.col, 10);
    const piece = board[row][col];

    // If nothing selected yet
    if (!selectedSquare) {
      if (!piece) return; // can't select empty square

      selectedSquare = { row, col };
      squareEl.classList.add("selected");
    } else {
      const fromRow = selectedSquare.row;
      const fromCol = selectedSquare.col;

      // Simple move: move piece from selectedSquare to this square
      board[row][col] = board[fromRow][fromCol];
      board[fromRow][fromCol] = "";

      selectedSquare = null;
      renderBoard();
    }
  }

  function pieceToUnicode(piece) {
    switch (piece) {
      case "K": return "♔";
      case "Q": return "♕";
      case "R": return "♖";
      case "B": return "♗";
      case "N": return "♘";
      case "P": return "♙";
      case "k": return "♚";
      case "q": return "♛";
      case "r": return "♜";
      case "b": return "♝";
      case "n": return "♞";
      case "p": return "♟";
      default: return "";
    }
  }
});
