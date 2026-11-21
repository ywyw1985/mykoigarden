(function () {
  const game = document.querySelector('[data-tracking-game]');
  if (!game) return;

  const rounds = Array.from(game.querySelectorAll('[data-round]'));
  const summary = game.querySelector('[data-results]');
  let score = 0;

  function showRound(index, moveFocus) {
    rounds.forEach((round, number) => { round.hidden = number !== index; });
    summary.hidden = true;
    if (moveFocus) rounds[index].querySelector('h2').focus();
  }

  rounds.forEach((round, index) => {
    const form = round.querySelector('form');
    const check = form.querySelector('[data-check]');
    const feedback = round.querySelector('[data-feedback]');
    const next = round.querySelector('[data-next]');
    const options = Array.from(form.querySelectorAll('input'));
    check.hidden = false;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const selected = options.find(input => input.checked);
      if (!selected || !feedback.hidden) return;

      const matched = selected.value === form.dataset.answer;
      if (matched) score += 1;
      round.querySelector('[data-verdict]').textContent = matched
        ? game.dataset.correct : game.dataset.incorrect;
      options.forEach(input => {
        input.disabled = true;
        input.closest('label').classList.toggle('tracking-answer', input.value === form.dataset.answer);
      });
      check.hidden = true;
      feedback.hidden = false;
      next.hidden = false;
      feedback.focus();
    });

    next.addEventListener('click', function () {
      if (index + 1 < rounds.length) {
        showRound(index + 1, true);
        return;
      }
      round.hidden = true;
      summary.querySelector('[data-score]').textContent = String(score);
      summary.hidden = false;
      summary.querySelector('h2').focus();
    });
  });

  summary.querySelector('button').addEventListener('click', function () {
    score = 0;
    rounds.forEach(round => {
      round.querySelectorAll('input').forEach(input => {
        input.disabled = false;
        input.checked = false;
        input.closest('label').classList.remove('tracking-answer');
      });
      round.querySelector('[data-check]').hidden = false;
      round.querySelector('[data-feedback]').hidden = true;
      round.querySelector('[data-next]').hidden = true;
    });
    showRound(0, true);
  });

  showRound(0, false);
})();
