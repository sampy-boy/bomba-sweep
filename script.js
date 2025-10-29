// modded minesweeper for extra chaos

// special bombs
// 0. Bomb: removes 1 life
// 1. Nuke: insta death
// 2. Cluster bomb: changes two random unclicked squares to bombs, doesnt deal damage
// 3. Flag bomb: removes all flags
// 4. Ghost bomb: on the first click it will move to a random square, second click it will explode (first click)
// 5. Ghost bomb deadly: see above ^ (second click)
// 6. Friendly bomb: gives you 1 life
// 7. Smoke bomb: changes three random unclicked safe squares to a ? square 
// 8. Sonar bomb: reveals one random unclicked bomb but removes 1.5 lives
// 9. (div by 0) bomb: turns all cells around into glitched cells
// 10. Fake bomb: shows up as a 1 when clicked with a faint ! mark. Doesnt deal any lives
// 11. Spread bomb: turns 25% of the unclicked squares into cluster bombs, doesnt deal damage
// 12. bomb/2 bomb: removes 0.5 lives
// 13. bomb + bomb/2 bomb: removes 1.5 lives
// 14. 2bomb bomb: removes 2 lives
// 15. clear bomb: returns all cells to blank. +2 lives
// special cells
// 0. Regular cell: shows the number of bombs around it or is just blank if no bombs are around it
// 1. Glitched cell: when clicked has a 50/50 to either remove 0.5 lives or give you 0.5 lives, after clicking it returns to normal
// 2. ? cell: just shows a ? when clicked

// html elements
let canvas = document.getElementById("canvas")
let ctx = canvas.getContext("2d")
let bombsLeftHTML = document.getElementById("bombs")
let timerHTML = document.getElementById("timer")
let beginnerButton = document.getElementById("beginner")
let intermediateButton = document.getElementById("intermediate")
let expertButton = document.getElementById("expert")
let extremeButton = document.getElementById("extreme")
let impossibleButton = document.getElementById("impossible")
let resetButton = document.getElementById("reset")
let showButton = document.getElementById("show")
let livesHTML = document.getElementById("lives")
let loadButton = document.getElementById("loadButton")
let loadInput = document.getElementById("load")
let saveButton = document.getElementById("saveButton")
let gameCodeHTML = document.getElementById("gameCode")
let txtPackButton = document.getElementById("txtPackButton")
let txtPack = document.getElementById("txtPack")

// grid related variables
let grid = []
let rows = 10
let cols = 10

// game related variables
let lives = 3 // should be 3 for beginner-expert, 2 for extreme, 1 for impossible
let bombRatio = 0.3 // should be 0.3 for beginner, 0.35 for intermediate, 0.45 for expert, 0.5 for extreme, 0.55 for impossible
let bombCount = 0
let difficulty = "beginner"
let timer = 0
let timerStarted = false
let timerInterval
let clicks = 0

// code related variables
let textures = {}
let cellSize = 32 // all textures are 32x32 pixels
let justLost = false
// difficultys
const beginnerBombs = [13, 14, 16, 17, 20, 24, 21]//[13, 14, 16, 17, 20, 24, 21]
const intermediateBombs = [13, 14, 15, 16, 17, 18, 19, 21, 20, 24, 25, 26]//[13, 14, 15, 16, 17, 18, 19, 21, 20, 24, 25, 26]
const expertBombs = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28]

let typeToTexture = {
  0: "unclicked",
  1: "blank",
  2: "one",
  3: "two",
  4: "three",
  5: "four",
  6: "five",
  7: "six",
  8: "seven",
  9: "eight",
  10: "flagged",
  11: "question_mark",
  12: "glitched",
  13: "bomb",
  14: "half_bomb",
  15: "sonar",
  16: "flag_bomb",
  17: "ghost",
  18: "friendly",
  19: "bomb_half_bomb",
  20: "smoke",
  21: "cluster",
  22: "nuke",
  23: "two_bomb",
  24: "virus",
  25: "glitch_bomb",
  26: "spread",
  27: "shown_bomb",
  28: "bomb"
}
let typeToDamage = {
  13: 1,
  14: 0.5,
  15: 1.5,
  16: 0.5,
  17: 0,
  18: -1,
  19: 1.5,
  20: 0.5,
  21: 1,
  22: 999,
  23: 2,
  24: 0,
  25: 0.5,
  26: 1,
  28: -2, // for clear bomb
  99: 1 // for deadly ghost bomb
}
let texturesLoaded = false
let gameInterval

async function loadTextures(txtPack) {
  const textureNames = [
    "unclicked",
    "blank",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "flagged",
    "question_mark",
    "glitched",
    "bomb",
    "shown_bomb",
    "nuke",
    "cluster",
    "flag_bomb",
    "ghost",
    "friendly",
    "smoke",
    "sonar",
    "glitch_bomb",
    "virus",
    "spread",
    "half_bomb",
    "bomb_half_bomb",
    "two_bomb"
  ]

  for (const name of textureNames) {
    textures[name] = new Image()
    textures[name].src = `alltextures/${txtPack}/${name}.png`
    await new Promise(resolve => {
      textures[name].onload = () => resolve()
    })
  }

  console.log("Textures loaded:", textures)
  texturesLoaded = true
}

function drawCell(x, y, type) {
  ctx.drawImage(textures[typeToTexture[type]], x * cellSize, y * cellSize, cellSize, cellSize)
}

function secondsToTimerFormat(seconds) {
  let minutes = Math.floor(seconds / 60)
  let remainingSeconds = seconds % 60
  if (minutes < 10) {
    minutes = `0${minutes}`
  }
  if (remainingSeconds < 10) {
    remainingSeconds = `0${remainingSeconds}`
  }
  return `Time: ${minutes}:${remainingSeconds}`
}

function setHTML() {
  livesHTML.innerHTML = `Lives left: ${lives}`
  bombsLeftHTML.innerHTML = `Bombs: ${bombCount}`
  timerHTML.innerHTML = secondsToTimerFormat(timer)
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  canvas.width = cols * cellSize
  canvas.height = rows * cellSize
  setHTML()
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type >= 13 && grid[i][j].shown) {
        drawCell(j, i, 27)
        continue
      }
      if (grid[i][j].glitched) {
        drawCell(j, i, 12)
        continue
      }
      if (grid[i][j].flagged) {
        drawCell(j, i, 10)
        continue
      }
      if (grid[i][j].clicked) {
        drawCell(j, i, grid[i][j].type)
      } else {
        drawCell(j, i, 0)
      }
    }
  }
}

function getNeighbors(x, y) {
  let neighbors = []
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) { continue }
      if (x + i < 0 || x + i >= rows || y + j < 0 || y + j >= cols) { continue }
      neighbors.push(grid[x + i][y + j])
    }
  }
  return neighbors
}

function bombThinner() {
  // makes any bomb tiles that are completely surrounded into an tile matching the amount it is surrounded by (so that big chunks are broken up)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type >= 13) {
        let neighbors = getNeighbors(i, j)
        let allBombs = true
        let neighborBombs = 0
        for (let k = 0; k < neighbors.length; k++) {
          if (neighbors[k].type < 13) {
            allBombs = false
            break
          } else { neighborBombs++ }
        }
        if (allBombs) {
          grid[i][j].type = neighborBombs + 1
        }
      }
    }
  }
}

function setCells() {
  // sets cells based off the amount of bombs around them
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type < 13) {
        let neighbors = getNeighbors(i, j)
        let neighborBombs = 0
        for (let k = 0; k < neighbors.length; k++) {
          if (neighbors[k].type >= 13) { neighborBombs++ }
        }
        grid[i][j].type = neighborBombs + 1
      }
    }
  }
}

function setBombs() {
  // 60% chance for a bomb to be a special bomb
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type == 13) {
        if (Math.random() >= 0.6) {
          switch (difficulty) {
            case "beginner":
              grid[i][j].type = beginnerBombs[Math.floor(Math.random() * beginnerBombs.length)]
              break
            case "intermediate":
              grid[i][j].type = intermediateBombs[Math.floor(Math.random() * intermediateBombs.length)]
              break
            default:
              grid[i][j].type = expertBombs[Math.floor(Math.random() * intermediateBombs.length)]
              break
          }
          if (Math.random() <= 0.1) {
            grid[i][j].type = 22
          }
        }
      }
    }
  }
}

function checkWin() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type < 13) {
        if (grid[i][j].flagged) { return false }
        if (!grid[i][j].clicked) { return false }
      } else {
        if (!(grid[i][j].clicked || grid[i][j].flagged || grid[i][j].shown)) { return false }
      }
    }
  }
  return true
}

function initGrid() {
  grid = []
  let randomGenerate
  for (let i = 0; i < rows; i++) {
    grid[i] = []
    for (let j = 0; j < cols; j++) {
      randomGenerate = Math.random() >= (bombRatio * 0.66) ? 1 : 13 // 1 is safe, 13 is bomb | thin bomb ratio so its not too hard
      grid[i][j] = {
        clicked: false,
        type: randomGenerate,
        flagged: false,
        glitched: false,
        shown: false, // shown is only for give up and sonar bomb effects
        smoked: false, // smoked is only for smoke bomb effects
        state: 0 // for the ghost bomb, state=1 is deadly
      }
      if (randomGenerate == 13) { bombCount++ }
    }
  }
}

function findNewCellLocations(amount) {
  // returns a random bomb location that is not clicked
  let output = []
  let cellList = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type < 13 && !grid[i][j].clicked) {
        cellList.push([i, j])
      }
    }
  }
  for (let i = 0; i < amount; i++) {
    output.push(cellList[Math.floor(Math.random() * cellList.length)])
  }
  return output
}

function findNewBombLocations(amount) {
  // returns a random bomb location that is not clicked
  let output = []
  let bombList = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j].type >= 13 && !grid[i][j].clicked) {
        bombList.push([i, j])
      }
    }
  }
  for (let i = 0; i < amount; i++) {
    output.push(bombList[Math.floor(Math.random() * bombList.length)])
  }
  return output
}

function fillCells(x, y) {
  if (x < 0 || x >= rows || y < 0 || y >= cols) { return }
  if (grid[x][y].clicked || grid[x][y].flagged || grid[x][y].glitched) { return }

  grid[x][y].clicked = true;

  if (grid[x][y].type == 1) {
    fillCells(x - 1, y);
    fillCells(x + 1, y);
    fillCells(x, y - 1);
    fillCells(x, y + 1);
    fillCells(x - 1, y - 1);
    fillCells(x - 1, y + 1);
    fillCells(x + 1, y - 1);
    fillCells(x + 1, y + 1);
  }
}

function smokeBomb() {
  console.log("smoke bomb")
  let newLocations = findNewCellLocations(3)
  for (let i = 0; i < newLocations.length; i++) {
    grid[newLocations[i][0]][newLocations[i][1]].smoked = true
  }
}

function flagBomb() {
  console.log("flag bomb")
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j].flagged = false
    }
  }
}

function clusterBomb() {
  console.log("cluster bomb")
  let newLocations = findNewCellLocations(2)
  for (let i = 0; i < newLocations.length; i++) {
    grid[newLocations[i][0]][newLocations[i][1]] = { clicked: false, type: 19, flagged: false, glitched: false, shown: false, smoked: false, state: 0 }
  }
  bombCount += 2
  setHTML()
  // set cells again now that new bombs are added
  setCells()
}

function spreadBomb() {
  console.log("spread bomb")
  let newLocations = findNewCellLocations(Math.floor((rows * cols) * 0.25))
  for (let i = 0; i < newLocations.length; i++) {
    bombCount++
    grid[newLocations[i][0]][newLocations[i][1]] = { clicked: false, type: 19, flagged: false, glitched: false, shown: false, smoked: false, state: 0 }
  }
  setHTML()
  // set cells again now that new bombs are added
  setCells()
}

function glitchBomb(x, y) {
  console.log("glitch bomb")
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) { continue }
      if (x + i < 0 || x + i >= rows || y + j < 0 || y + j >= cols) { continue }
      if (grid[x + i][y + j].type >= 13) { continue }
      grid[x + i][y + j].glitched = true
    }
  }
}

function sonarBomb() {
  console.log("sonar bomb")
  let newLocations = findNewBombLocations(3)
  for (let i = 0; i < newLocations.length; i++) {
    grid[newLocations[i][0]][newLocations[i][1]].shown = true
  }
}

function ghostBomb() {
  console.log("ghost bomb")
  let newLocation = findNewBombLocations(1)[0]
  grid[newLocation[0]][newLocation[1]] = { clicked: false, type: 14, flagged: false, glitched: false, shown: false, smoked: false, state: 1 }
}

function glitchCell(x, y) {
  if (Math.random() >= 0.5) {
    lives -= 0.5
  } else {
    lives += 0.5
  }
  grid[x][y].glitched = false
}

function clearBomb() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j].clicked = false
      grid[i][j].flagged = false
      grid[i][j].glitched = false
      grid[i][j].shown = false
      grid[i][j].smoked = false
    }
  }
}

function bombEffect(x, y, type) {
  grid[x][y].clicked = true
  if (type == 14 && grid[x][y].state == 1) {
    damage = typeToDamage[99]
  } else {
    damage = typeToDamage[type]
  }
  lives -= damage
  switch (type) {
    default:
      break
    case 17:
      if (grid[x][y].state == 0) {
        ghostBomb()
        break
      }
    case 15:
      sonarBomb()
      break
    case 16:
      flagBomb()
      break
    case 20:
      smokeBomb()
      break
    case 21:
      clusterBomb()
      break
    case 25:
      glitchBomb(x, y)
      break
    case 26:
      spreadBomb()
      break
    case 28:
      clearBomb()
      break
  }
}

function clickBlankCell(x, y) {
  if (grid[x][y].type < 13 && !grid[x][y].flagged) {
    if (grid[x][y].glitched) {
      glitchCell()
      return
    }
    fillCells(x, y)
  }
}

function runGame() {
  if (lives <= 0) {
    clearInterval(gameInterval)
    clearInterval(timerInterval)
    recursiveCount = 0
    clicks = 0
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        grid[i][j].clicked = true
        grid[i][j].flagged = false
      }
    }
    justLost = true
    drawGrid()
    ctx.fillStyle = "red"
    ctx.font = "50px Times New Roman"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("You lose", canvas.width / 2, canvas.height / 2)
  } else {
    drawGrid()
  }
}

let recursiveCount = 0
function createBeginningLand(x,y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) { return }
  
  // Always clear the clicked cell and immediate neighbors first
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let newX = x + j
      let newY = y + i
      if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
        if (grid[newY][newX].type >= 13) {
          bombCount-- // Reduce bomb count when removing bombs
        }
        grid[newY][newX] = {
          clicked: false,
          type: 1,
          flagged: false,
          glitched: false,
          shown: false, 
          smoked: false, 
          state: 0 
        }
      }
    }
  }
  
  recursiveCount += 1
  console.log(recursiveCount)
  if ((Math.ceil(Math.random() * 10) > recursiveCount) || (recursiveCount <= 2)) {
    createBeginningLand(x + 1, y)
    createBeginningLand(x - 1, y)
    createBeginningLand(x, y + 1)
    createBeginningLand(x, y - 1)
  } else { return }
}

async function startGame() {
  clearInterval(gameInterval)
  justLost = false
  timer = 0
  bombCount = 0
  if (timerStarted) { clearInterval(timerInterval) }
  timerStarted = false
  if (!texturesLoaded) {
    await loadTextures("textures")
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  initGrid()
  setBombs()
  bombThinner()
  setCells()
  drawGrid()
  gameInterval = setInterval(runGame, 1000 / 20)
}

function winSet() {
  if (checkWin() && !justLost) {
    drawGrid()
    clearInterval(gameInterval)
    clearInterval(timerInterval)
    ctx.fillStyle = "green"
    ctx.font = "50px Times New Roman"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("You win", canvas.width / 2, canvas.height / 2)
  }
}

let mouseX = 0
let mouseY = 0
canvas.addEventListener("mousemove", (event) => {
  let rect = canvas.getBoundingClientRect()
  mouseX = Math.floor((event.clientX - rect.left) / cellSize)
  mouseY = Math.floor((event.clientY - rect.top) / cellSize)
})

// right click or space to flag
function rightClick(event) {
  if (event != 0) {
    event.preventDefault()
  }
  let x = mouseX
  let y = mouseY
  grid[y][x].flagged = !grid[y][x].flagged
}
canvas.addEventListener('contextmenu', function(event) {
  rightClick(event)
})
document.addEventListener("keydown", (event) => {
  if (event.code == "Space") {
    rightClick(0)
  }
})

function click() {
  if (!timerStarted) {
    timerStarted = true
    timerInterval = setInterval(() => {
      timer++
      setHTML()
    }, 1000)
  }
  let x = mouseX
  let y = mouseY
  clicks += 1
  if (clicks == 1) {
    createBeginningLand(x,y)
    setCells()
    // Ensure the first clicked cell is always blank
    grid[y][x].type = 1
  }
  if (grid[y][x].clicked) { return }
  if (grid[y][x].flagged) { return }
  if (grid[y][x].type >= 13) {
    bombEffect(y, x, grid[y][x].type)
  } else {
    clickBlankCell(y, x)
  }
  winSet()
}

canvas.addEventListener("click", click)

showButton.addEventListener("click", () => {
  lives = 0
})

beginnerButton.addEventListener("click", () => {
  rows = 10
  cols = 10
  lives = 3
  bombRatio = 0.275
  difficulty = "beginner"
  recursiveCount = 0
  clicks = 0
  startGame()
})

intermediateButton.addEventListener("click", () => {
  rows = 16
  cols = 16
  lives = 3
  bombRatio = 0.325
  difficulty = "intermediate"
  recursiveCount = 0
  clicks = 0
  startGame()
})

expertButton.addEventListener("click", () => {
  rows = 16
  cols = 30
  lives = 3
  bombRatio = 0.425
  difficulty = "expert"
  recursiveCount = 0
  clicks = 0
  startGame()
})

extremeButton.addEventListener("click", () => {
  rows = 20
  cols = 30
  lives = 2
  bombRatio = 0.475
  difficulty = "extreme"
  recursiveCount = 0
  clicks = 0
  startGame()
})

impossibleButton.addEventListener("click", () => {
  rows = 30
  cols = 30
  lives = 1
  bombRatio = 0.525
  difficulty = "impossible"
  recursiveCount = 0
  clicks = 0
  startGame()
})

resetButton.addEventListener("click", () => {
  if (difficulty == "beginner" || difficulty == "intermediate" || difficulty == "expert") { lives = 3 }
  else if (difficulty == "extreme") { lives = 2 }
  else { lives = 1 }
  recursiveCount = 0
  clicks = 0
  startGame()
})

txtPackButton.addEventListener("click", () => {
  if (difficulty == "beginner" || difficulty == "intermediate" || difficulty == "expert") { lives = 3 }
  else if (difficulty == "extreme") { lives = 2 }
  else { lives = 1 }
  recursiveCount = 0
  clicks = 0
  texturesLoaded = true
  clearInterval(gameInterval)
  textures = {}
  loadTextures(txtPack.value)
  startGame()
})

saveButton.addEventListener("click", () => {
  let savedClicks = clicks
  if (clicks >= 0) {savedClicks = 1}
  const save = {
    grid: grid,
    lives: lives,
    bombCount: bombCount,
    difficulty: difficulty,
    timer: timer,
    clicks: savedClicks
  }
  gameCodeHTML.innerHTML = btoa(JSON.stringify(save))
})

loadButton.addEventListener("click", () => {
  const inputedSave = loadInput.value
  const save = JSON.parse(atob(inputedSave))
  // Parse save
  grid = save.grid
  // Get cols and rows
  cols = grid[0].length
  rows = grid.length
  lives = save.lives
  bombCount = save.bombCount
  difficulty = save.difficulty
  // Bomb ratio
  if (difficulty == "beginner") {
    bombRatio = 0.275
  } else if (difficulty == "intermediate") {
    bombRatio = 0.325
  } else if (difficulty == "expert") {
    bombRatio = 0.425
  } else if (difficulty == "extreme") {
    bombRatio = 0.475
  } else {
    bombRatio = 0.525
  }
  timer = save.timer
  timerStarted = false
  clicks = save.clicks
  clearInterval(gameInterval)
  clearInterval(timerInterval)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  gameInterval = setInterval(runGame, 1000 / 20)
})

startGame()