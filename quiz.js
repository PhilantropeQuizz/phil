(function () {
  const config = window.QUIZ_CONFIG;
  const app = document.getElementById('app');

  const state = {
    screen: 'intro',
    players: ['', ''],
    scores: [0, 0],
    timeBonus: [0, 0],
    qIndex: 0,
    turn: 0,
    timerId: null,
    remaining: config.timeLimit,
    answered: false
  };

  function resetGame(keepNames) {
    state.screen = keepNames ? 'transition' : 'intro';
    state.scores = [0, 0];
    state.timeBonus = [0, 0];
    state.qIndex = 0;
    state.turn = 0;
    state.remaining = config.timeLimit;
    state.answered = false;
    if (!keepNames) state.players = ['', ''];
    render();
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.remaining = config.timeLimit;
    state.answered = false;
    const startTime = Date.now();
    const totalMs = config.timeLimit * 1000;
    state.timerId = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const remaining = Math.max(0, (totalMs - elapsedMs) / 1000);
      state.remaining = remaining;
      updateTimerDisplay();
      if (remaining <= 0 && !state.answered) {
        stopTimer();
        handleAnswer(-1);
      }
    }, 80);
  }

  function updateTimerDisplay() {
    const fill = document.querySelector('.timer-fill');
    const num = document.querySelector('.timer-number');
    if (fill && num) {
      const pct = (state.remaining / config.timeLimit) * 100;
      fill.style.width = pct + '%';
      num.textContent = Math.ceil(state.remaining);
    }
  }

  function handleAnswer(selectedIndex) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    const question = config.questions[state.qIndex];
    const player = state.turn;
    const isCorrect = selectedIndex === question.correct;
    const timeLeft = state.remaining;

    if (isCorrect) {
      state.scores[player] += 1;
      state.timeBonus[player] += timeLeft;
    }

    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === question.correct) btn.classList.add('correct');
      if (i === selectedIndex && i !== question.correct) btn.classList.add('wrong');
    });

    const feedback = document.querySelector('.feedback-text');
    if (feedback) {
      if (selectedIndex === -1) {
        feedback.textContent = 'Temps écoulé !';
      } else if (isCorrect) {
        feedback.textContent = 'Bonne réponse !';
      } else {
        feedback.textContent = 'Mauvaise réponse';
      }
    }

    setTimeout(advance, 1200);
  }

  function advance() {
    if (state.turn === 0) {
      state.turn = 1;
      state.screen = 'transition';
    } else {
      state.turn = 0;
      state.qIndex += 1;
      if (state.qIndex >= config.questions.length) {
        state.screen = 'results';
      } else {
        state.screen = 'transition';
      }
    }
    render();
  }

  function render() {
    stopTimer();
    switch (state.screen) {
      case 'intro':
        renderIntro();
        break;
      case 'names':
        renderNames();
        break;
      case 'transition':
        renderTransition();
        break;
      case 'question':
        renderQuestion();
        break;
      case 'results':
        renderResults();
        break;
    }
  }

  function renderIntro() {
    app.innerHTML = `
      <a href="index.html" class="back-link">&larr; Retour</a>
      <div class="screen">
        <div class="eyebrow">Le Phil &middot; Pause caf&eacute;</div>
        <h1 class="title-lg">${config.title}</h1>
        <p class="subtitle">${config.description}</p>
        <p class="subtitle">${config.questions.length} questions &middot; ${config.timeLimit} secondes par question</p>
        <div class="btn-row">
          <button class="btn btn-primary" id="start-btn">Commencer</button>
        </div>
      </div>
    `;
    document.getElementById('start-btn').addEventListener('click', () => {
      state.screen = 'names';
      render();
    });
  }

  function renderNames() {
    app.innerHTML = `
      <div class="screen">
        <h1 class="title-lg">Qui s'affronte ?</h1>
        <p class="subtitle">Entrez vos pr&eacute;noms pour commencer la battle.</p>
        <form class="names-form" id="names-form">
          <input class="name-input" type="text" placeholder="Pr&eacute;nom joueur 1" id="player1" maxlength="20" required>
          <input class="name-input" type="text" placeholder="Pr&eacute;nom joueur 2" id="player2" maxlength="20" required>
          <button type="submit" class="btn btn-primary">C'est parti</button>
        </form>
      </div>
    `;
    document.getElementById('names-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = document.getElementById('player1').value.trim() || 'Joueur 1';
      const p2 = document.getElementById('player2').value.trim() || 'Joueur 2';
      state.players = [p1, p2];
      state.scores = [0, 0];
      state.timeBonus = [0, 0];
      state.qIndex = 0;
      state.turn = 0;
      state.screen = 'transition';
      render();
    });
  }

  function renderTransition() {
    const playerName = state.players[state.turn];
    app.innerHTML = `
      <div class="screen turn-banner">
        <div class="progress-pill">Question ${state.qIndex + 1} / ${config.questions.length}</div>
        <p class="subtitle">C'est au tour de</p>
        <h1 class="title-lg turn-player">${playerName}</h1>
        <p class="subtitle">Prends le t&eacute;l&eacute;phone, installe-toi, et appuie quand tu es pr&ecirc;t.</p>
        <div class="btn-row">
          <button class="btn btn-primary" id="ready-btn">Je suis pr&ecirc;t</button>
        </div>
      </div>
    `;
    document.getElementById('ready-btn').addEventListener('click', () => {
      state.screen = 'question';
      render();
    });
  }

  function renderQuestion() {
    const question = config.questions[state.qIndex];
    const isSingle = question.options.length === 1;
    const optionsHtml = question.options.map((opt, i) => {
      const cls = isSingle ? 'option-btn full-width' : 'option-btn';
      return `<button class="${cls}" data-index="${i}">${opt}</button>`;
    }).join('');

    app.innerHTML = `
      <div class="screen question-screen">
        <div class="progress-pill">Question ${state.qIndex + 1} / ${config.questions.length} &middot; ${state.players[state.turn]}</div>
        <div class="timer-wrap">
          <div class="timer-track"><div class="timer-fill" style="width: 100%"></div></div>
          <div class="timer-number">${config.timeLimit}</div>
        </div>
        <h2 class="question-text">${question.q}</h2>
        <div class="options-grid ${isSingle ? 'single-col' : ''}">
          ${optionsHtml}
        </div>
        <div class="feedback-text"></div>
      </div>
    `;

    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleAnswer(parseInt(btn.dataset.index, 10));
      });
    });

    startTimer();
  }

  function renderResults() {
    const [s1, s2] = state.scores;
    const [t1, t2] = state.timeBonus;
    let winnerIndex = -1;

    if (s1 !== s2) {
      winnerIndex = s1 > s2 ? 0 : 1;
    } else if (t1 !== t2) {
      winnerIndex = t1 > t2 ? 0 : 1;
    }

    let winnerHtml;
    if (winnerIndex === -1) {
      winnerHtml = `<p class="winner-banner">&Eacute;galit&eacute; parfaite !</p>`;
    } else {
      winnerHtml = `<p class="winner-banner"><strong>${state.players[winnerIndex]}</strong> remporte la battle !</p>`;
    }

    app.innerHTML = `
      <div class="screen results-screen">
        <div class="eyebrow">R&eacute;sultats</div>
        <h1 class="title-lg">${config.title}</h1>
        <div class="score-table">
          <div class="score-row ${winnerIndex === 0 ? 'winner' : ''}">
            <span class="player-name">${state.players[0]}</span>
            <span class="player-score">${s1} / ${config.questions.length}</span>
          </div>
          <div class="score-row ${winnerIndex === 1 ? 'winner' : ''}">
            <span class="player-name">${state.players[1]}</span>
            <span class="player-score">${s2} / ${config.questions.length}</span>
          </div>
        </div>
        ${winnerHtml}
        <div class="btn-row">
          <button class="btn btn-primary" id="replay-btn">Rejouer</button>
          <button class="btn btn-secondary" id="home-btn">Accueil</button>
        </div>
      </div>
    `;

    document.getElementById('replay-btn').addEventListener('click', () => {
      resetGame(true);
    });
    document.getElementById('home-btn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  document.documentElement.style.setProperty('--accent', config.accentColor);
  document.documentElement.style.setProperty('--accent-text', config.accentText);

  render();
})();
