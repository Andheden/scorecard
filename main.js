const ScorecardApp = {
    players: [],
    holes: [],
    currentHoleIndex: 0,

    init() {
        this.setupEvents();
        this.updateOverview();
    },

    setupEvents() {
        const hamburga = document.querySelector('.hamburga');
        const navMenu = document.querySelector('.nav-menu');

        hamburga.addEventListener('click', () => {
            hamburga.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburga.classList.remove('active');
            navMenu.classList.remove('active');
        }));

        document.getElementById('addPlayerBtn').addEventListener('click', () => this.readInput());
        document.getElementById("playerNameInput").addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.readInput();
            }
        });

        document.getElementById('startGameBtn').addEventListener('click', (e) => {
            fetch('hål.json')
                .then(response => response.json())
                .then(data => {
                    this.holes = data.court;
                    this.currentHoleIndex = 0;
                    this.showHole(this.currentHoleIndex);
                });
        });
    },

    readInput() {
        const playerName = document.getElementById('playerNameInput').value;
        if (playerName) {
            const userExists = this.players.some(player => player.name.toLowerCase() === playerName.toLowerCase());
            if (userExists) {
                alert('Player already exists!');
                return;
            }
            this.addPlayer(playerName);
            document.getElementById('playerNameInput').value = '';
        }
    },

    addPlayer(playerName) {
        const playerId = 'player-' + Date.now();
        const playerObj = { id: playerId, name: playerName, score: 0, scores: [] };
        this.players.push(playerObj);

        const listPlayers = document.createElement('div');
        listPlayers.classList.add('PlayerList');
        listPlayers.id = playerId;
        listPlayers.innerHTML = `
            <span class="player">${playerName}</span>
            <button class="removeBtn" onclick="this.parentElement.remove()">Remove</button>
        `;
        document.getElementById('playerList').appendChild(listPlayers);

        this.updateOverview();
    },

    showHole(index) {
        const hole = this.holes[index];
        const holeDiv = document.getElementById('courseContainer');

        this.players.forEach(player => {
            player.score = player.scores[index] || 0;
        });

        let playersHtml = '';
        this.players.forEach(player => {
            playersHtml += `
                <div class="playerScore" id="score-${player.id}">
                    <span>${player.name}</span>
                    <button class="minusBtn" data-id="${player.id}">-</button>
                    <span class="score">${player.score}</span>
                    <button class="plusBtn" data-id="${player.id}">+</button>
                </div>
            `;
        });

        holeDiv.innerHTML = `
            <h2>Bana ${hole.id}</h2>
            <p>Par: ${hole.par}</p>
            <p>Info: ${hole.info}</p>
            <button id="prevHole" ${index === 0 ? 'disabled' : ''}>Föregående</button>
            <button id="nextHole" ${index === this.holes.length - 1 ? 'disabled' : ''}>Nästa</button>
            <h3>Spelare</h3>
            ${playersHtml}
        `;

        document.getElementById('prevHole').onclick = () => {
            if (this.currentHoleIndex > 0) {
                this.players.forEach(player => {
                    player.scores[this.currentHoleIndex] = player.score;
                });
                this.currentHoleIndex--;
                this.showHole(this.currentHoleIndex);
            }
        };
        document.getElementById('nextHole').onclick = () => {
            if (this.currentHoleIndex < this.holes.length - 1) {
                this.players.forEach(player => {
                    player.scores[this.currentHoleIndex] = player.score;
                });
                this.currentHoleIndex++;
                this.showHole(this.currentHoleIndex);
            }
        };

        holeDiv.querySelectorAll('.plusBtn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const player = this.players.find(p => p.id === id);
                player.score++;
                document.querySelector(`#score-${id} .score`).textContent = player.score;
                player.scores[index] = player.score;
                this.updateOverview();
            };
        });
        holeDiv.querySelectorAll('.minusBtn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const player = this.players.find(p => p.id === id);
                if (player.score > 0) player.score--;
                document.querySelector(`#score-${id} .score`).textContent = player.score;
                player.scores[index] = player.score;
                this.updateOverview();
            };
        });
    },

    updateOverview() {
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = '';
        this.players.forEach(player => {
            const totalScore = player.scores.reduce((sum, s) => sum + (s || 0), 0);
            const li = document.createElement('li');
            li.innerHTML = `<strong>${player.name}</strong>: ${totalScore} poäng`;
            playerList.appendChild(li);
        });
    }
};

ScorecardApp.init();

