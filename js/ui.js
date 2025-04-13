// Cette section représente la fin du fichier ui.js qui était tronqué
  
  // ----- Méthodes pour la page de statistiques -----
  
  renderStatsScreen() {
    // Récupérer les données de statistiques
    const visualData = storage.getVisualizationData(this.themesIndex);
    
    if (!visualData) {
      console.error("Erreur lors de la récupération des données de visualisation");
      return;
    }
    
    // Mettre à jour les compteurs globaux
    this.dom.stats.completionRate.textContent = `${visualData.globalCompletion}%`;
    this.dom.stats.completedQuizzes.textContent = visualData.completedQuizzes;
    this.dom.stats.totalQuizzes.textContent = visualData.totalQuizzes;
    this.dom.stats.accuracy.textContent = `${visualData.globalAccuracy}%`;
    this.dom.stats.correctAnswers.textContent = visualData.correctAnswers;
    this.dom.stats.totalAnswers.textContent = visualData.totalQuestions;
    this.dom.stats.avgTimePerQuestion.textContent = `${visualData.avgTimePerQuestion}s`;
    
    // Générer les barres des thèmes
    this.renderThemeBars(visualData.themeStats);
    
    // Afficher le meilleur et le pire thème
    this.renderBestAndWorstThemes(visualData.bestTheme, visualData.worstTheme);
    
    // Afficher l'historique des quiz
    this.renderQuizHistory(visualData.history);
  }
  
  renderThemeBars(themeStats) {
    const container = this.dom.stats.themeBars;
    container.innerHTML = '';
    
    if (!themeStats || Object.keys(themeStats).length === 0) {
      container.innerHTML = '<p class="no-data">Aucune donnée disponible. Complétez au moins un quiz pour voir vos statistiques.</p>';
      return;
    }
    
    // Convertir l'objet en tableau pour le tri
    const themesArray = Object.values(themeStats);
    
    // Trier par précision (du plus élevé au plus bas)
    themesArray.sort((a, b) => b.avgAccuracy - a.avgAccuracy);
    
    // Générer les barres pour chaque thème
    themesArray.forEach(theme => {
      const themeBar = document.createElement('div');
      themeBar.className = 'theme-bar';
      
      const header = document.createElement('div');
      header.className = 'theme-bar-header';
      
      const name = document.createElement('span');
      name.className = 'theme-name';
      name.textContent = theme.name || `Theme ${theme.id}`;
      
      const value = document.createElement('span');
      value.className = 'theme-value';
      value.textContent = `${theme.avgAccuracy}%`;
      
      header.appendChild(name);
      header.appendChild(value);
      
      const barBg = document.createElement('div');
      barBg.className = 'theme-bar-bg';
      
      const barFill = document.createElement('div');
      barFill.className = 'theme-bar-fill';
      barFill.style.width = `${theme.avgAccuracy}%`;
      
      barBg.appendChild(barFill);
      
      themeBar.appendChild(header);
      themeBar.appendChild(barBg);
      
      container.appendChild(themeBar);
    });
  }
  
  renderBestAndWorstThemes(bestTheme, worstTheme) {
    if (!bestTheme && !worstTheme) {
      this.dom.stats.bestThemeName.textContent = 'Aucune donnée';
      this.dom.stats.bestThemeAccuracy.textContent = '-';
      this.dom.stats.worstThemeName.textContent = 'Aucune donnée';
      this.dom.stats.worstThemeAccuracy.textContent = '-';
      return;
    }
    
    // Afficher le meilleur thème
    if (bestTheme) {
      // Trouver les informations complètes du thème depuis l'index
      const bestThemeInfo = this.themesIndex.find(t => t.id === Number(bestTheme.id)) || {};
      this.dom.stats.bestThemeName.textContent = bestThemeInfo.name || `Thème ${bestTheme.id}`;
      this.dom.stats.bestThemeAccuracy.textContent = `${bestTheme.stats.avgAccuracy}%`;
    } else {
      this.dom.stats.bestThemeName.textContent = 'Aucune donnée';
      this.dom.stats.bestThemeAccuracy.textContent = '-';
    }
    
    // Afficher le pire thème
    if (worstTheme) {
      // Trouver les informations complètes du thème depuis l'index
      const worstThemeInfo = this.themesIndex.find(t => t.id === Number(worstTheme.id)) || {};
      this.dom.stats.worstThemeName.textContent = worstThemeInfo.name || `Thème ${worstTheme.id}`;
      this.dom.stats.worstThemeAccuracy.textContent = `${worstTheme.stats.avgAccuracy}%`;
    } else {
      this.dom.stats.worstThemeName.textContent = 'Aucune donnée';
      this.dom.stats.worstThemeAccuracy.textContent = '-';
    }
  }
  
  renderQuizHistory(history) {
    const historyList = this.dom.stats.historyList;
    historyList.innerHTML = '';
    
    if (!history || history.length === 0) {
      historyList.innerHTML = '<p class="no-history">Aucun historique disponible. Complétez quelques quiz pour voir vos résultats récents.</p>';
      return;
    }
    
    // Limiter à 10 entrées
    const displayHistory = history.slice(0, 10);
    
    displayHistory.forEach(entry => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const themeId = entry.themeId;
      const themeInfo = this.themesIndex.find(t => t.id === Number(themeId));
      
      // Formater la date pour un affichage convivial
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      historyItem.innerHTML = `
        <div class="history-content">
          <div class="history-title">${entry.quizName || 'Quiz'} (${themeInfo?.name || `Thème ${themeId}`})</div>
          <div class="history-details">
            <span class="history-date">${formattedDate}</span>
            ${entry.time ? `<span class="history-time">${entry.time}s</span>` : ''}
          </div>
        </div>
        <div class="history-score">${entry.score}/${entry.total} (${entry.accuracy}%)</div>
      `;
      
      historyList.appendChild(historyItem);
    });
  }
}