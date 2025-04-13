// js/main.js - Simplified Test Version
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded");
  
  // Get essential elements
  const exploreBtn = document.getElementById('explore-themes-btn');
  const welcomeScreen = document.getElementById('welcome-screen');
  const themeScreen = document.getElementById('theme-selection');
  
  // Log what we found
  console.log("Explore button found:", !!exploreBtn);
  console.log("Welcome screen found:", !!welcomeScreen);
  console.log("Theme screen found:", !!themeScreen);
  
  // Attach click handler
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function() {
      console.log("Button clicked!");
      
      if (welcomeScreen && themeScreen) {
        welcomeScreen.classList.add('hidden');
        themeScreen.classList.remove('hidden');
        console.log("Screens toggled");
      }
    });
  }
});
