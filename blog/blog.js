document.addEventListener('click', function (e) {
  var q = e.target.closest('.faq-q');
  if (!q) return;
  q.parentElement.classList.toggle('open');
});
