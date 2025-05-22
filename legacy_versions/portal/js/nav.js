const hamburger = document.getElementById('hamburger');
const nmo = document.getElementById('navbar_mobile_options');
let isMenuOpen = false;

hamburger.addEventListener('click', function() {
  isMenuOpen = !isMenuOpen;
  hamburger.classList.toggle('active', isMenuOpen);
  if (isMenuOpen) {
    nmo.style.display = 'flex';
  }
  else {
    nmo.style.display = 'none';
  }
  console.log('Menu is now', isMenuOpen ? 'open' : 'closed');
});