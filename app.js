document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const boardEl = document.getElementById("board");
  const feedbackEl = document.getElementById("feedback");

  let board = [];
  let stockfish;
  let currentPlayer = "white"; // white moves first
  let lastPlayerMove = null;   // store last move for trainer

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

  function renderBoard(highlights = []) {
    boardEl.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.classList.add((row + col) % 2 === 0 ? "light" : "dark");

        square.dataset.row = row;
        square.dataset.col = col;

        const key = `${row},${col}`;
        if (highlights.includes(key)) {
          square.classList.add("highlight");
        }

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
    const fromRow = parseInt(e.target.dataset.row, 10);
    const fromCol = parseInt(e.target.dataset.col, 10);
    const piece = board[fromRow][fromCol];

    // enforce turn
    if (currentPlayer === "white" && !isWhitePiece(piece)) {
      e.preventDefault();
      return;
    }
    if (currentPlayer === "black" && !isBlackPiece(piece)) {
      e.preventDefault();
      return;
    }

    const legalMoves = getLegalMoves(fromRow, fromCol, piece);
    e.dataTransfer.setData("fromRow", fromRow);
    e.dataTransfer.setData("fromCol", fromCol);

    renderBoard(legalMoves);
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

    const piece = board[fromRow][fromCol];
    if (!piece) {
      renderBoard();
      return;
    }

    const legalMoves = getLegalMoves(fromRow, fromCol, piece);
    const targetKey = `${toRow},${toCol}`;
    if (!legalMoves.includes(targetKey)) {
      renderBoard();
      return; // illegal move
    }

    // perform move
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = "";

    const playerMove = coordsToMove(fromRow, fromCol, toRow, toCol);
    lastPlayerMove = playerMove;

    // switch turn to black (AI)
    currentPlayer = "black";
    renderBoard();

    // trainer: evaluate player's move vs Stockfish
    evaluatePlayerMove(playerMove);

    // AI move
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

  function isWhitePiece(piece) {
    return piece && piece === piece.toUpperCase();
  }

  function isBlackPiece(piece) {
    return piece && piece === piece.toLowerCase();
  }

  /* ---------------- LEGAL MOVE LOGIC (basic) ---------------- */

  function getLegalMoves(row, col, piece) {
    const moves = [];
    const isWhite = isWhitePiece(piece);
    const dir = isWhite ? -1 : 1; // white moves up, black down

    const addMoveIfValid = (r, c) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return;
      const target = board[r][c];
      if (!target || (isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target))) {
        moves.push(`${r},${c}`);
      }
    };

    const addSlideMoves = (dr, dc) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = board[r][c];
        if (!target) {
          moves.push(`${r},${c}`);
        } else {
          if (isWhite && isBlackPiece(target)) moves.push(`${r},${c}`);
          if (!isWhite && isWhitePiece(target)) moves.push(`${r},${c}`);
          break;
        }
        r += dr;
        c += dc;
      }
    };

    switch (piece.toLowerCase()) {
      case "p": {
        // forward
        const fr = row + dir;
        if (fr >= 0 && fr <= 7 && board[fr][col] === "") {
          moves.push(`${fr},${col}`);
          // double move from starting rank
          const startRank = isWhite ? 6 : 1;
          const fr2 = row + 2 * dir;
          if (row === startRank && board[fr2][col] === "") {
            moves.push(`${fr2},${col}`);
          }
        }
        // captures
        const capCols = [col - 1, col + 1];
        for (const cc of capCols) {
          const rr = row + dir;
          if (rr >= 0 && rr <= 7 && cc >= 0 && cc <= 7) {
            const target = board[rr][cc];
            if (target && ((isWhite && isBlackPiece(target)) || (!isWhite && isWhitePiece(target)))) {
              moves.push(`${rr},${cc}`);
            }
          }
        }
        break;
      }
      case "n": {
        const deltas = [
          [-2, -1], [-2, 1],
          [-1, -2], [-1, 2],
          [1, -2], [1, 2],
          [2, -1], [2, 1]
        ];
        for (const [dr, dc] of deltas) {
          addMoveIfValid(row + dr, col + dc);
        }
        break;
      }
      case "b": {
        addSlideMoves(-1, -1);
        addSlideMoves(-1, 1);
        addSlideMoves(1, -1);
        addSlideMoves(1, 1);
        break;
      }
      case "r": {
        addSlideMoves(-1, 0);
        addSlideMoves(1, 0);
        addSlideMoves(0, -1);
        addSlideMoves(0, 1);
        break;
      }
      case "q": {
        addSlideMoves(-1, -1);
        addSlideMoves(-1, 1);
        addSlideMoves(1, -1);
        addSlideMoves(1, 1);
        addSlideMoves(-1, 0);
        addSlideMoves(1, 0);
        addSlideMoves(0, -1);
        addSlideMoves(0, 1);
        break;
      }
      case "k": {
        const deltas = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dr, dc] of deltas) {
          addMoveIfValid(row + dr, col + dc);
        }
        break;
      }
    }

    return moves;
  }

  function coordsToMove(fr, fc, tr, tc) {
    const file = (c) => String.fromCharCode("a".charCodeAt(0) + c);
    const rank = (r) => 8 - r;
    return file(fr) + rank(fr) + file(tc) + rank(tc);
  }

  /* ---------------- STOCKFISH + TRAINER ---------------- */

  function initStockfish() {
    stockfish = STOCKFISH();

    stockfish.onmessage = (line) => {
      if (typeof line !== "string") return;

      if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        applyAIMove(move);
      }
    };

    stockfish.postMessage("uci");
  }

  function sendPositionToStockfish() {
    const fen = boardToFEN();
    stockfish.postMessage("position fen " + fen);
    stockfish.postMessage("go depth 12");
  }

  function applyAIMove(move) {
    if (!move || move === "(none)") {
      currentPlayer = "white";
      renderBoard();
      return;
    }

    const fromCol = move.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(move[1], 10);
    const toCol = move.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(move[3], 10);

    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = "";

    currentPlayer = "white";
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

    fen += " w - - 0 1";
    return fen;
  }

  /* --------- Simple AI Trainer: compare to best move --------- */

  function evaluatePlayerMove(playerMove) {
    if (!playerMove) return;

    const fenBefore = boardToFEN(); // approximate; for full accuracy you'd store pre-move FEN

    // Ask Stockfish for best move from this position
    const sf = STOCKFISH();
    sf.onmessage = (line) => {
      if (typeof line !== "string") return;
      if (line.startsWith("bestmove")) {
        const bestMove = line.split(" ")[1];
        showTrainerFeedback(playerMove, bestMove);
        sf.postMessage("quit");
      }
    };

    sf.postMessage("uci");
    sf.postMessage("position fen " + fenBefore);
    sf.postMessage("go depth 10");
  }

  function showTrainerFeedback(playerMove, bestMove) {
    if (!bestMove || bestMove === "(none)") {
      feedbackEl.textContent = "No clear best move in this position.";
      return;
    }

    if (playerMove === bestMove) {
      feedbackEl.textContent =
        `Your move: ${playerMove}\nBest move: ${bestMove}\n\nExcellent! You found the engine's top choice.`;
    } else {
      feedbackEl.textContent =
        `Your move: ${playerMove}\nBest move: ${bestMove}\n\nNot optimal. Try to understand why ${bestMove} is stronger.`;
    }
  }
});
