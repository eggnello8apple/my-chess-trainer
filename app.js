document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const boardEl = document.getElementById("board");

  let board = [];
  let stockfish;

  startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";

    initBoardArray();
    renderBoard();
    initStockfish();
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
        square.classList.add((row + col) % 2 === 0 ? "light" : "dark");

        square.dataset.row = row;
        square.dataset.col = col;

        const piece = board[row][col];
        if (piece) {
          const pieceEl = document.createElement("div");
          pieceEl.textContent = pieceToUnicode(piece);
          pieceEl.draggable = true;
          pieceEl.dataset.row = row;
          pieceEl.dataset.col = col;

          pieceEl.addEventListener("dragstart", onDragStart);

          square.appendChild(pieceEl);
        }

        square.addEventListener("dragover", onDragOver);
        square.addEventListener("drop", onDrop);

        boardEl.appendChild(square);
      }
    }
  }

  function onDragStart(e) {
    e.dataTransfer.setData("fromRow", e.target.dataset.row);
    e.dataTransfer.setData("fromCol", e.target.dataset.col);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const fromRow = parseInt(e.dataTransfer.getData("fromRow"));
    const fromCol = parseInt(e.dataTransfer.getData("fromCol"));

    const toRow = parseInt(e.currentTarget.dataset.row);
    const toCol = parseInt(e.currentTarget.dataset.col);

    // Move piece
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = "";

    renderBoard();

    // After your move → AI moves
    sendPositionToStockfish();
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

  /* ---------------- STOCKFISH ENGINE ---------------- */

  function initStockfish() {
    stockfish = STOCKFISH();

    stockfish.onmessage = (line) => {
      if (line.includes("bestmove")) {
        const move = line.split("bestmove ")[1].split(" ")[0];
        applyAIMove(move);
      }
    };

    stockfish.postMessage("uci");
  }

  function sendPositionToStockfish() {
    const fen = boardToFEN();
    stockfish.postMessage("position fen " + fen);
    stockfish.postMessage("go depth 10");
  }

  function applyAIMove(move) {
    const fromCol = move.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(move[1]);
    const toCol = move.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(move[3]);

    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = "";

    renderBoard();
  }

  function boardToFEN() {
    let fen = "";

    for (let row = 0; row < 8; row++) {
      let empty = 0;

      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];

        if (piece === "") {
          empty++;
        } else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += piece;
        }
      }

      if (empty > 0) fen += empty;
      if (row < 7) fen += "/";
    }

    fen += " w - - 0 1"; // simple FEN footer
    return fen;
  }
});
