const ScorecardApp = {
  players: [],
  holes: [],
  currentHoleIndex: 0,

  init() {
    this.loadFromStorage()
    this.setupEvents()
    this.updateOverview()

    if (window.location.hash === "#banor" && this.holes.length > 0 && this.players.length > 0) {
      this.showHole(this.currentHoleIndex)
    }
  },

  setupEvents() {
    const hamburga = document.querySelector(".hamburga")
    const navMenu = document.querySelector(".nav-menu")

    hamburga.addEventListener("click", () => {
      hamburga.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    document.querySelectorAll(".nav-link").forEach((n) =>
      n.addEventListener("click", () => {
        hamburga.classList.remove("active")
        navMenu.classList.remove("active")
      }),
    )

    document.getElementById("addPlayerBtn").addEventListener("click", () => this.readInput())
    document.getElementById("playerNameInput").addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        this.readInput()
      }
    })

    document.getElementById("startGameBtn").addEventListener("click", (e) => {
      if (!this.holes.length) {
        fetch("hål.json")
          .then((response) => response.json())
          .then((data) => {
            this.holes = data.court
            this.saveToStorage()
            this.currentHoleIndex = 0
            this.showHole(this.currentHoleIndex)
          })
      } else {
        this.showHole(this.currentHoleIndex)
      }
    })

    document.getElementById("resetGameBtn").addEventListener("click", () => this.resetGame())
    document.querySelector(".saveGameBtn").addEventListener("click", () => this.saveGameToSlot())
    document.querySelector(".loadGameBtn").addEventListener("click", () => this.loadGameFromSlot())

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#banor" && !this.holes.length) {
        fetch("hål.json")
          .then((response) => response.json())
          .then((data) => {
            this.holes = data.court
            this.saveToStorage()
            this.currentHoleIndex = 0
            this.showHole(this.currentHoleIndex)
          })
      } else if (window.location.hash === "#banor" && this.holes.length > 0 && this.players.length > 0) {
        this.showHole(this.currentHoleIndex)
      }
    })
  },

  readInput() {
    const playerName = document.getElementById("playerNameInput").value
    if (playerName) {
      const userExists = this.players.some((player) => player.name.toLowerCase() === playerName.toLowerCase())
      if (userExists) {
        alert("Player already exists!")
        return
      }
      this.addPlayer(playerName)
      document.getElementById("playerNameInput").value = ""
    }
  },

  addPlayer(playerName) {
    const playerId = "player-" + Date.now()
    const playerObj = { id: playerId, name: playerName, score: 0, scores: [] }
    this.players.push(playerObj)
    this.updateOverview()
    this.saveToStorage()
  },

  removePlayer(playerId) {
    if (confirm("Är du säker på att du vill ta bort denna spelare?")) {
      this.players = this.players.filter((player) => player.id !== playerId)
      this.updateOverview()
      this.saveToStorage()

      
      
    }
  },

  showHole(index) {
    const hole = this.holes[index]
    const holeDiv = document.getElementById("courseContainer")

    this.players.forEach((player) => {
      player.score = player.scores[index] || 0
    })

    let playersHtml = ""
    this.players.forEach((player) => {
      playersHtml += `
                <div class="playerScore" id="score-${player.id}">
                    <span>${player.name}</span>
                    <button class="minusBtn" data-id="${player.id}">-</button>
                    <span class="score">${player.score}</span>
                    <button class="plusBtn" data-id="${player.id}">+</button>
                </div>
            `
    })

    holeDiv.innerHTML = `
            <h2>Bana ${hole.id}</h2>
            <p>Par: ${hole.par}</p>
            <p>Info: ${hole.info}</p>
            <button id="prevHole" ${index === 0 ? "disabled" : ""}>Föregående</button>
            <button id="nextHole" ${index === this.holes.length - 1 ? "disabled" : ""}>Nästa</button>
            <h3>Spelare</h3>
            ${playersHtml}
        `

    document.getElementById("prevHole").onclick = () => {
      if (this.currentHoleIndex > 0) {
        this.players.forEach((player) => {
          player.scores[this.currentHoleIndex] = player.score
        })
        this.saveToStorage()
        this.currentHoleIndex--
        this.showHole(this.currentHoleIndex)
      }
    }
    document.getElementById("nextHole").onclick = () => {
      if (this.currentHoleIndex < this.holes.length - 1) {
        this.players.forEach((player) => {
          player.scores[this.currentHoleIndex] = player.score
        })
        this.saveToStorage()
        this.currentHoleIndex++
        this.showHole(this.currentHoleIndex)
      }
    }

    holeDiv.querySelectorAll(".plusBtn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id")
        const player = this.players.find((p) => p.id === id)
        player.score++
        document.querySelector(`#score-${id} .score`).textContent = player.score
        player.scores[index] = player.score
        this.updateOverview()
        this.saveToStorage()
      }
    })
    holeDiv.querySelectorAll(".minusBtn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id")
        const player = this.players.find((p) => p.id === id)
        if (player.score > 0) player.score--
        document.querySelector(`#score-${id} .score`).textContent = player.score
        player.scores[index] = player.score
        this.updateOverview()
        this.saveToStorage()
      }
    })
  },

  updateOverview() {
    const leaderboard = document.getElementById("leaderboard")
    const tbody = leaderboard.querySelector("tbody")
    tbody.innerHTML = ""
    if (this.players.length === 0) {
      leaderboard.style.display = "none"
      return
    } else {
      leaderboard.style.display = ""
    }
    this.players.forEach((player) => {
      const totalScore = player.scores.reduce((sum, s) => sum + (s || 0), 0)

      let totalPar = 0
      player.scores.forEach((score, i) => {
        if (typeof score === "number" && score > 0 && this.holes[i]) {
          totalPar += this.holes[i].par
        }
      })
      const diff = totalScore - totalPar
      let diffText, diffClass
      if (diff === 0) {
        diffText = "±0"
        diffClass = "zero"
      } else if (diff < 0) {
        diffText = diff
        diffClass = "plus"
      } else {
        diffText = `+${diff}`
        diffClass = "minus"
      }
      const tr = document.createElement("tr")
      tr.innerHTML = `
                <td class="name">${player.name}</td>
                <td class="score">${totalScore}</td>
                <td class="par ${diffClass}">${diffText}</td>
                <td class="remove">
                    <button class="removePlayerBtn" data-id="${player.id}">Ta bort</button>
                </td>
            `
      tbody.appendChild(tr)
    })

    document.querySelectorAll(".removePlayerBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const playerId = e.target.getAttribute("data-id")
        this.removePlayer(playerId)
      })
    })
  },

  saveToStorage() {
    localStorage.setItem("scorecard_players", JSON.stringify(this.players))
    localStorage.setItem("scorecard_currentHoleIndex", this.currentHoleIndex)
    localStorage.setItem("scorecard_holes", JSON.stringify(this.holes))
  },

  loadFromStorage() {
    const players = localStorage.getItem("scorecard_players")
    const currentHoleIndex = localStorage.getItem("scorecard_currentHoleIndex")
    const holes = localStorage.getItem("scorecard_holes")
    if (players) {
      this.players = JSON.parse(players)
    }
    if (currentHoleIndex) {
      this.currentHoleIndex = Number.parseInt(currentHoleIndex, 10)
    }
    if (holes) {
      this.holes = JSON.parse(holes)
    }
  },

  resetGame() {
    if (confirm("Är du säker på att du vill starta om spelet? All data kommer att raderas.")) {
      
      this.players = []
      this.holes = []
      this.currentHoleIndex = 0

      
      localStorage.removeItem("scorecard_players")
      localStorage.removeItem("scorecard_currentHoleIndex")
      localStorage.removeItem("scorecard_holes")

      
      this.updateOverview()
      document.getElementById("courseContainer").innerHTML = ""

      
      window.location.hash = "#översikt"

      alert("Spelet har startats om!")
    }
  },

  saveGameToSlot() {
    const savedGames = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("scorecard_saved_")) {
        const gameName = key.replace("scorecard_saved_", "")
        const gameData = JSON.parse(localStorage.getItem(key))
        savedGames.push({ name: gameName, data: gameData, key: key })
      }
    }

    if (savedGames.length >= 5) {
      
      let gameList = "Du har redan 5 sparade spel. Välj vilket spel du vill ersätta:\n\n"
      savedGames.forEach((game, index) => {
        const date = new Date(game.data.timestamp).toLocaleString("sv-SE")
        gameList += `${index + 1}. ${game.name} (${date})\n`
      })

      const selection = prompt(gameList + "\nAnge nummer för det spel du vill ersätta (eller tryck Avbryt):")

      if (selection === null) {
        return 
      }

      const gameIndex = Number.parseInt(selection) - 1

      
      if (gameIndex >= 0 && gameIndex < savedGames.length) {
        
        localStorage.removeItem(savedGames[gameIndex].key)
      } else {
        alert("Ogiltigt val!")
        return
      }
    }

    
    const gameData = {
      players: this.players,
      holes: this.holes,
      currentHoleIndex: this.currentHoleIndex,
      timestamp: new Date().toISOString(),
    }

    const slotName = prompt("Ange ett namn för det sparade spelet:", `Spel_${new Date().toLocaleDateString("sv-SE")}`)

    if (slotName) {
      localStorage.setItem(`scorecard_saved_${slotName}`, JSON.stringify(gameData))
      alert(`Spelet har sparats som "${slotName}"!`)
    }
  },

  loadGameFromSlot() {
    
    const savedGames = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("scorecard_saved_")) {
        const gameName = key.replace("scorecard_saved_", "")
        const gameData = JSON.parse(localStorage.getItem(key))
        savedGames.push({ name: gameName, data: gameData })
      }
    }

    if (savedGames.length === 0) {
      alert("Inga sparade spel hittades!")
      return
    }

    
    let gameList = "Välj ett sparat spel att ladda:\n\n"
    savedGames.forEach((game, index) => {
      const date = new Date(game.data.timestamp).toLocaleString("sv-SE")
      gameList += `${index + 1}. ${game.name} (${date})\n`
    })

    const selection = prompt(gameList + "\nAnge nummer för det spel du vill ladda:")
    const gameIndex = Number.parseInt(selection) - 1

    if (gameIndex >= 0 && gameIndex < savedGames.length) {
      const selectedGame = savedGames[gameIndex]

      if (confirm(`Är du säker på att du vill ladda "${selectedGame.name}"? Nuvarande data kommer att ersättas.`)) {
        
        this.players = selectedGame.data.players || []
        this.holes = selectedGame.data.holes || []
        this.currentHoleIndex = selectedGame.data.currentHoleIndex || 0

        
        this.saveToStorage()

       
        this.updateOverview()

        
        if (this.holes.length > 0 && this.players.length > 0) {
          window.location.hash = "#banor"
          this.showHole(this.currentHoleIndex)
        } else {
          window.location.hash = "#översikt"
        }

        alert(`Spelet "${selectedGame.name}" har laddats!`)
      }
    } else {
      alert("Ogiltigt val!")
    }
  },
}

ScorecardApp.init()
