(() => {
  const cards = Array.from(document.querySelectorAll('.challenge-card'));
  const results = document.querySelector('.challenge-results');
  if (!cards.length || !results) return;
  const progress = results.querySelector('[role="status"]');
  const attempts = new Map();

  function updateScore() {
    const correct = Array.from(attempts.values()).filter(Boolean).length;
    progress.textContent = progress.dataset.template
      .replace('{n}', String(attempts.size)).replace('{c}', String(correct));
  }

  for (const card of cards) {
    const answer = card.querySelector('details');
    answer.addEventListener('toggle', () => {
      if (!answer.open || attempts.has(card)) return;
      const selected = card.querySelector('input:checked');
      const correct = selected?.value === card.dataset.correct;
      attempts.set(card, correct);
      card.querySelectorAll('input').forEach(input => { input.disabled = true; });
      const feedback = card.querySelector('.challenge-feedback');
      feedback.textContent = selected
        ? (correct ? results.dataset.correct : results.dataset.incorrect)
        : results.dataset.skipped;
      feedback.hidden = false;
      updateScore();
      if (attempts.size === cards.length && typeof window.gtag === 'function') {
        window.gtag('event', 'koi_photo_challenge_complete', {
          correct_answers: Array.from(attempts.values()).filter(Boolean).length,
          language: document.documentElement.lang
        });
      }
    });
  }

  results.querySelector('button').addEventListener('click', () => {
    attempts.clear();
    for (const card of cards) {
      card.querySelector('details').open = false;
      card.querySelector('.challenge-feedback').hidden = true;
      card.querySelectorAll('input').forEach(input => {
        input.checked = false;
        input.disabled = false;
      });
    }
    updateScore();
    const heading = cards[0].querySelector('h2');
    heading.focus({preventScroll: true});
    cards[0].scrollIntoView({block: 'start'});
  });
  updateScore();
  results.hidden = false;
})();
