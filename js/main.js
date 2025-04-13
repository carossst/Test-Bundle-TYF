document.addEventListener('DOMContentLoaded', function() {
  const exploreBtn = document.getElementById('explore-themes-btn');
  const welcomeScreen = document.getElementById('welcome-screen');
  const themeScreen = document.getElementById('theme-selection');
  
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function() {
      console.log("Bouton Explore Themes cliqué !");
      welcomeScreen.classList.add('hidden');
      themeScreen.classList.remove('hidden');
      console.log("Écran des thèmes affiché !");
    });
  }
});
