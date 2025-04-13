// js/ui.js - Version 2.2.1 (12/04/2025)
// Gestion de l'interface utilisateur pour Test Your French
// Contient les classes et méthodes pour manipuler le DOM et afficher les données
// Amélioré pour le chargement dynamique des thèmes et la navigation

import storage from './storage.js';
import resourceManager from './resourceManager.js';

class QuizUI {
  constructor(quizManager, dom, themeController) {
    this.quizManager = quizManager;
    this.dom = dom;
    this.themeController = themeController;
    this.themesIndex = [];
    this.timer = null;
    this.timerShown = true;
    
    // Initialiser les écouteurs d'événements pour les contrôles de quiz
    this.initQuizControlEvents();
    
    console.log("QuizUI initialisé (v2.2.1)");
  }

  // ----- Initialisation et configuration -----
  
  initThemesView() {
    // Cette méthode est appelée après le chargement des métadonnées
    console.log("Initialisation de la vue des thèmes");
    
    // Charger l'index des thèmes
    this.loadThemesIndex();
  }
  
  async loadThemesIndex() {
    try {
      const metadata = await resourceManager.loadMetadata();
      if (metadata && metadata.themes) {
        this.themesIndex = metadata.themes;
        console.log(`Index des thèmes chargé: ${this.themesIndex.length} thèmes`);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'index des thèmes:", error);
    }
  }
  
  initQuizControlEvents() {
    // Événements pour les boutons de navigation du quiz
    if (this.dom.buttons.prev) {
      this.dom.buttons.prev.addEventListener('click', () => this.navigateToPreviousQuestion());
    }
    
    if (this.dom.buttons.next) {
      this.dom.buttons.next.addEventListener('click', () => this.navigateToNextQuestion());
    }
    
    if (this.dom.buttons.submit) {
      this.dom.buttons.submit.addEventListener('click', () => this.finishQuiz());
    }
    
    if (this.dom.buttons.restart) {
      this.dom.buttons.restart.addEventListener('click', () => this.restartQuiz());
    }
    
    if (this.dom.buttons.exitQuiz) {
      this.dom.buttons.exitQuiz.addEventListener('click', () => this.confirmExitQuiz());
    }
    
    // Événements pour les contrôles du timer
    if (this.dom.quiz.timer.toggle) {
      this.dom.quiz.timer.toggle.addEventListener('click', () => this.toggleTimerVisibility());
    }
    
    if (this.dom.quiz.timer.checkbox) {
      this.dom.quiz.timer.checkbox.addEventListener('change', (e) => {
        this.quizManager.timerEnabled = e.target.checked;
        console.log(`Timer ${this.quizManager.timerEnabled ? 'activé' : 'désactivé'}`);
      });
    }
    
    // Événements pour le partage et l'export
    if (this.dom.buttons.copy) {
      this.dom.buttons.copy.addEventListener('click', () => this.copyShareText());
    }
    
    if (this.dom.buttons.export) {
      this.dom.buttons.export.addEventListener('click', () => this.exportResults());
    }
    
    if (this.dom.buttons.print) {
      this.dom.buttons.print.addEventListener('click', () => this.printResults());
    }
    
    // Événement pour la réinitialisation des progrès
    if (this.dom.buttons.resetProgress) {
      this.dom.buttons.resetProgress.addEventListener('click', () => this.confirmResetProgress());
    }
  }

  // ----- Méthodes pour la sélection des thèmes -----
  
  async renderThemes() {
    console.log("Rendu des thèmes");
    const themesList = this.dom.themesList;
    
    if (!themesList) {
      console.error("Conteneur de liste de thèmes non trouvé");
      return;
    }
    
    // Afficher l'indicateur de chargement
    themesList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading themes...</div>';
    
    try {
      // S'assurer que l'index des thèmes est chargé
      if (this.themesIndex.length === 0) {
        await this.loadThemesIndex();
      }
      
      // Récupérer les données de progression
      const progress = await storage.getProgress();
      
      // Vider le conteneur
      themesList.innerHTML = '';
      
      if (this.themesIndex.length === 0) {
        themesList.innerHTML = '<div class="error-message">No themes available. Please try again later.</div>';
        return;
      }
      
      // Créer un élément pour chaque thème
      this.themesIndex.forEach(theme => {
        const themeItem = document.createElement('div');
        themeItem.className = 'selection-item';
        themeItem.setAttribute('role', 'button');
        themeItem.setAttribute('tabindex', '0');
        
        // Calculer la progression pour ce thème
        const themeProgress = this.calculateThemeProgress(theme.id, progress);
        
        // Générer le HTML pour l'élément de thème
        themeItem.innerHTML = `
          <div class="item-icon">
            <i class="${theme.icon || 'fas fa-book'}"></i>
          </div>
          <div class="item-content">
            <h3>${theme.name}</h3>
            <p>${theme.description || 'Explore this theme to practice your French skills.'}</p>
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress" style="width: ${themeProgress.percentage}%"></div>
              </div>
              <span>${themeProgress.completed} / ${themeProgress.total} quizzes completed</span>
            </div>
          </div>
          <div class="item-action">
            Explore <i class="fas fa-arrow-right"></i>
          </div>
        `;
        
        // Ajouter l'écouteur d'événement pour la sélection de thème
        themeItem.addEventListener('click', () => this.selectTheme(theme.id));
        themeItem.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.selectTheme(theme.id);
          }
        });
        
        // Ajouter l'élément à la liste
        themesList.appendChild(themeItem);
      });
      
      console.log(`${this.themesIndex.length} thèmes affichés`);
    } catch (error) {
      console.error("Erreur lors du rendu des thèmes:", error);
      themesList.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading themes. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>`;
    }
  }
  
  calculateThemeProgress(themeId, progress) {
    // Par défaut, aucune progression
    const defaultProgress = { completed: 0, total: 5, percentage: 0 };
    
    if (!progress || !progress.themes || !progress.themes[themeId]) {
      return defaultProgress;
    }
    
    const themeProgress = progress.themes[themeId];
    const theme = this.themesIndex.find(t => t.id === themeId);
    
    if (!theme || !theme.quizzes) {
      return defaultProgress;
    }
    
    // Nombre total de quiz pour ce thème
    const totalQuizzes = theme.quizzes.length;
    
    // Nombre de quiz complétés
    let completedQuizzes = 0;
    theme.quizzes.forEach(quiz => {
      if (themeProgress.quizzes && themeProgress.quizzes[quiz.id] && themeProgress.quizzes[quiz.id].completed) {
        completedQuizzes++;
      }
    });
    
    // Calculer le pourcentage
    const percentage = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
    
    return { completed: completedQuizzes, total: totalQuizzes, percentage };
  }
  
  async selectTheme(themeId) {
    console.log(`Thème sélectionné: ${themeId}`);
    
    // Masquer l'écran de sélection de thème
    this.dom.screens.themeSelection.classList.add('hidden');
    
    // Afficher l'écran de sélection de quiz
    this.dom.screens.quizSelection.classList.remove('hidden');
    
    // Afficher l'indicateur de chargement
    this.dom.quizzesList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading quizzes...</div>';
    
    try {
      // Charger les données du thème
      const themeData = await resourceManager.getTheme(themeId);
      
      // Mise à jour de l'UI avec les données du thème
      const theme = this.themesIndex.find(t => t.id === themeId);
      if (theme) {
        this.dom.themeTitle.textContent = theme.name;
        this.dom.themeDescription.textContent = theme.description || '';
      }
      
      // Charger les quiz pour ce thème
      const quizzes = await resourceManager.getThemeQuizzes(themeId);
      
      // Récupérer les données de progression
      const progress = await storage.getProgress();
      const themeProgress = progress && progress.themes && progress.themes[themeId] 
        ? progress.themes[themeId] 
        : { quizzes: {} };
      
      // Rendu des quiz
      this.renderQuizzes(quizzes, themeProgress);
    } catch (error) {
      console.error(`Erreur lors du chargement du thème ${themeId}:`, error);
      this.dom.quizzesList.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading theme. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>`;
    }
  }
  
  renderQuizzes(quizzes, themeProgress) {
    const quizzesList = this.dom.quizzesList;
    quizzesList.innerHTML = '';
    
    if (!quizzes || quizzes.length === 0) {
      quizzesList.innerHTML = '<div class="error-message">No quizzes available for this theme.</div>';
      return;
    }
    
    quizzes.forEach(quiz => {
      const quizItem = document.createElement('div');
      quizItem.className = 'selection-item';
      quizItem.setAttribute('role', 'button');
      quizItem.setAttribute('tabindex', '0');
      
      // Vérifier si le quiz a été complété
      const quizProgress = themeProgress.quizzes[quiz.id] || {};
      const isCompleted = quizProgress.completed || false;
      
      // Générer le HTML pour l'élément de quiz
      quizItem.innerHTML = `
        <div class="item-icon">
          <i class="${this.getQuizTypeIcon(quiz.name)}"></i>
        </div>
        <div class="item-content">
          <h3>${quiz.name}</h3>
          <p>${quiz.description || 'Test your French skills with this quiz.'}</p>
          ${isCompleted ? `
            <div class="quiz-result">
              <span class="score-badge">${quizProgress.score || 0}/${quizProgress.total || 10}</span>
              <span class="accuracy-badge">${quizProgress.accuracy || 0}%</span>
            </div>
          ` : ''}
        </div>
        <div class="item-action">
          Start <i class="fas fa-play"></i>
        </div>
      `;
      
      // Ajouter l'écouteur d'événement pour la sélection de quiz
      quizItem.addEventListener('click', () => this.startQuiz(quiz.id));
      quizItem.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.startQuiz(quiz.id);
        }
      });
      
      // Ajouter l'élément à la liste
      quizzesList.appendChild(quizItem);
    });
    
    console.log(`${quizzes.length} quiz affichés`);
  }
  
  getQuizTypeIcon(quizName) {
    if (!quizName) return 'fas fa-question';
    
    const nameLC = quizName.toLowerCase();
    
    if (nameLC.includes('writing') && nameLC.includes('reading')) {
      return 'fas fa-pencil-alt';
    } else if (nameLC.includes('listening')) {
      return 'fas fa-headphones';
    } else if (nameLC.includes('conversation')) {
      return 'fas fa-comments';
    } else {
      return 'fas fa-tasks';
    }
  }
  
  async startQuiz(quizId) {
    console.log(`Démarrage du quiz ${quizId}`);
    
    // Masquer l'écran de sélection de quiz
    this.dom.screens.quizSelection.classList.add('hidden');
    
    // Afficher l'écran de quiz
    this.dom.screens.quiz.classList.remove('hidden');
    
    try {
      // Charger les données du quiz
      const themeId = this.quizManager.currentThemeId || 
        (this.themesIndex.length > 0 ? this.themesIndex[0].id : 1);
      
      const quizData = await resourceManager.getQuiz(themeId, quizId);
      
      // Configurer le gestionnaire de quiz avec les données
      const themeData = {
        themeId: themeId,
        quizzes: [quizData]
      };
      
      this.quizManager.loadThemeData(themeData);
      this.quizManager.setQuiz(quizId);
      
      // Démarrer le timer si activé
      if (this.quizManager.timerEnabled && this.dom.quiz.timer.checkbox.checked) {
        this.startTimer();
        this.dom.quiz.timer.container.classList.remove('hidden');
      } else {
        this.dom.quiz.timer.container.classList.add('hidden');
      }
      
      // Afficher la première question
      this.renderCurrentQuestion();
    } catch (error) {
      console.error(`Erreur lors du démarrage du quiz ${quizId}:`, error);
      this.dom.quiz.container.innerHTML = `<div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading quiz. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>`;
    }
  }
  
  // ----- Méthodes pour le quiz -----
  
  renderCurrentQuestion() {
    const currentQuestion = this.quizManager.getCurrentQuestion();
    if (!currentQuestion) {
      console.error("Aucune question disponible");
      return;
    }
    
    const quiz = this.quizManager.getCurrentQuiz();
    if (quiz) {
      this.dom.quiz.title.textContent = quiz.name;
    }
    
    const questionIndex = this.quizManager.currentQuestionIndex;
    const totalQuestions = quiz ? quiz.questions.length : 0;
    
    // Mettre à jour la barre de progression
    if (this.dom.quiz.progress.bar) {
      const progressPercentage = totalQuestions > 0 
        ? ((questionIndex + 1) / totalQuestions) * 100 
        : 0;
      this.dom.quiz.progress.bar.style.width = `${progressPercentage}%`;
    }
    
    // Mettre à jour les indicateurs d'étape
    this.renderProgressSteps(questionIndex, totalQuestions);
    
    // Mise à jour des boutons de navigation
    this.updateNavigationButtons(questionIndex, totalQuestions);
    
    // Construire le conteneur de question
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question-container fade-in';
    
    // Créer le contenu de la question selon son type
    if (currentQuestion.type === 'audio' && currentQuestion.audio) {
      // Question audio
      questionContainer.innerHTML = `
        <fieldset>
          <legend class="question-text">${currentQuestion.question}</legend>
          <div class="audio-container">
            <audio controls src="${currentQuestion.audio}">
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
          <div class="options"></div>
        </fieldset>
      `;
      
      // Déclencher un événement personnalisé pour indiquer que l'audio a été chargé
      const audioElement = questionContainer.querySelector('audio');
      if (audioElement) {
        audioElement.addEventListener('loadeddata', () => {
          document.dispatchEvent(new CustomEvent('audioloaded', {
            detail: { src: currentQuestion.audio }
          }));
        });
      }
    } else {
      // Question texte standard
      questionContainer.innerHTML = `
        <fieldset>
          <legend class="question-text">${currentQuestion.question}</legend>
          <div class="options"></div>
        </fieldset>
      `;
    }
    
    // Ajouter les options
    const optionsContainer = questionContainer.querySelector('.options');
    if (optionsContainer && currentQuestion.options) {
      currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        
        // Vérifier si une réponse a déjà été sélectionnée pour cette question
        const questionStatus = this.quizManager.questionStatus[questionIndex];
        const isSelected = this.quizManager.selectedAnswers[questionIndex] === option;
        
        if (isSelected) {
          optionElement.classList.add('selected');
          
          if (questionStatus === 'correct') {
            optionElement.classList.add('correct');
          } else if (questionStatus === 'incorrect') {
            optionElement.classList.add('incorrect');
          }
        }
        
        // Si une réponse a déjà été donnée, désactiver les interactions
        if (questionStatus) {
          optionElement.style.pointerEvents = 'none';
          
          // Marquer la bonne réponse si la réponse sélectionnée était incorrecte
          if (questionStatus === 'incorrect' && option === currentQuestion.correctAnswer) {
            optionElement.classList.add('correct');
          }
        } else {
          // Ajouter l'écouteur d'événement pour la sélection de réponse
          optionElement.addEventListener('click', () => this.selectAnswer(index));
        }
        
        optionsContainer.appendChild(optionElement);
      });
    }
    
    // Remplacer le contenu actuel par la nouvelle question
    this.dom.quiz.container.innerHTML = '';
    this.dom.quiz.container.appendChild(questionContainer);
    
    // Afficher le feedback si une réponse a déjà été donnée
    if (this.quizManager.questionStatus[questionIndex]) {
      this.showFeedback(currentQuestion, this.quizManager.questionStatus[questionIndex] === 'correct');
    } else {
      // Masquer le feedback
      this.dom.quiz.feedback.innerHTML = '';
      this.dom.quiz.feedback.classList.remove('visible');
    }
    
    console.log(`Question ${questionIndex + 1}/${totalQuestions} affichée`);
  }
  
  renderProgressSteps(currentIndex, totalSteps) {
    if (!this.dom.quiz.progress.steps) return;
    
    const stepsContainer = this.dom.quiz.progress.steps;
    stepsContainer.innerHTML = '';
    
    for (let i = 0; i < totalSteps; i++) {
      const step = document.createElement('div');
      step.className = 'step';
      step.textContent = (i + 1).toString();
      
      if (i === currentIndex) {
        step.classList.add('active');
      } else if (this.quizManager.questionStatus[i] === 'correct') {
        step.classList.add('completed');
      } else if (this.quizManager.questionStatus[i] === 'incorrect') {
        step.classList.add('error');
      }
      
      stepsContainer.appendChild(step);
    }
  }
  
  updateNavigationButtons(currentIndex, totalQuestions) {
    // Bouton précédent
    if (this.dom.buttons.prev) {
      this.dom.buttons.prev.disabled = currentIndex === 0;
    }
    
    // Bouton suivant/soumettre
    if (this.dom.buttons.next && this.dom.buttons.submit) {
      const allQuestionsAnswered = this.quizManager.questionStatus.length === totalQuestions && 
                                 !this.quizManager.questionStatus.includes(null);
      
      if (currentIndex === totalQuestions - 1) {
        // Dernière question, afficher le bouton Soumettre
        this.dom.buttons.next.style.display = 'none';
        this.dom.buttons.submit.style.display = 'inline-flex';
        this.dom.buttons.submit.disabled = !this.quizManager.questionStatus[currentIndex];
      } else {
        // Pas la dernière question, afficher le bouton Suivant
        this.dom.buttons.submit.style.display = 'none';
        this.dom.buttons.next.style.display = 'inline-flex';
        this.dom.buttons.next.disabled = !this.quizManager.questionStatus[currentIndex];
      }
    }
  }
  
  selectAnswer(optionIndex) {
    const result = this.quizManager.submitAnswer(optionIndex);
    if (!result) return;
    
    const currentQuestion = this.quizManager.getCurrentQuestion();
    if (!currentQuestion) return;
    
    // Mettre à jour l'affichage des options
    const options = this.dom.quiz.container.querySelectorAll('.option');
    options.forEach((option, index) => {
      // Désactiver toutes les options
      option.style.pointerEvents = 'none';
      
      if (index === optionIndex) {
        // Option sélectionnée
        option.classList.add('selected');
        if (result.isCorrect) {
          option.classList.add('correct');
        } else {
          option.classList.add('incorrect');
        }
      } else if (currentQuestion.options[index] === currentQuestion.correctAnswer && !result.isCorrect) {
        // Montrer la bonne réponse si l'utilisateur s'est trompé
        option.classList.add('correct');
      }
    });
    
    // Afficher le feedback
    this.showFeedback(currentQuestion, result.isCorrect);
    
    // Mettre à jour les boutons de navigation
    const questionIndex = this.quizManager.currentQuestionIndex;
    const totalQuestions = this.quizManager.getCurrentQuiz().questions.length;
    this.updateNavigationButtons(questionIndex, totalQuestions);
    
    // Mettre à jour les indicateurs d'étape
    this.renderProgressSteps(questionIndex, totalQuestions);
  }
  
  showFeedback(question, isCorrect) {
    if (!this.dom.quiz.feedback) return;
    
    const feedbackContainer = this.dom.quiz.feedback;
    
    // Créer le contenu du feedback
    if (isCorrect) {
      feedbackContainer.innerHTML = `
        <div class="feedback-correct">
          <h3><i class="fas fa-check-circle"></i> Correct!</h3>
          <p>${question.explanation || "Good job!"}</p>
        </div>
      `;
    } else {
      feedbackContainer.innerHTML = `
        <div class="feedback-incorrect">
          <h3><i class="fas fa-info-circle"></i> Not quite</h3>
          <p>The correct answer is <strong>${question.correctAnswer}</strong></p>
          <p>${question.explanation || "Keep practicing!"}</p>
        </div>
      `;
    }
    
    // Afficher le feedback
    feedbackContainer.classList.add('visible');
  }
  
  navigateToNextQuestion() {
    const hasNext = this.quizManager.nextQuestion();
    if (hasNext) {
      this.renderCurrentQuestion();
    }
  }
  
  navigateToPreviousQuestion() {
    const hasPrev = this.quizManager.previousQuestion();
    if (hasPrev) {
      this.renderCurrentQuestion();
    }
  }
  
  async finishQuiz() {
    // Arrêter le timer
    this.stopTimer();
    
    // Obtenir les résultats
    const results = this.quizManager.getResults();
    if (!results) {
      console.error("Impossible d'obtenir les résultats du quiz");
      return;
    }
    
    // Sauvegarder les résultats
    try {
      await storage.saveQuizResult(
        results.theme.id,
        results.quiz.id,
        results
      );
      console.log("Résultats sauvegardés avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des résultats:", error);
    }
    
    // Masquer l'écran de quiz
    this.dom.screens.quiz.classList.add('hidden');
    
    // Afficher l'écran de résultats
    const resultScreen = this.dom.screens.result;
    resultScreen.style.display = 'block';
    
    // Mettre à jour les informations de résultat
    this.dom.results.quizName.textContent = results.quiz.name;
    this.dom.results.score.textContent = results.score;
    this.dom.results.totalQuestions.textContent = results.total;
    
    // Évaluer le niveau et afficher un message
    const levelInfo = this.quizManager.evaluateLevel(results.score, results.total);
    this.dom.results.message.innerHTML = `
      <p>Your French level for this topic is <strong>${levelInfo.level}</strong></p>
      <p>${levelInfo.description}</p>
    `;
    
    // Mettre à jour les statistiques
    this.dom.results.stats.accuracy.textContent = `${results.accuracy}%`;
    this.dom.results.stats.avgTime.textContent = `${results.avgTime}s`;
    this.dom.results.stats.fastestAnswer.textContent = `${results.fastest}s`;
    this.dom.results.stats.slowestAnswer.textContent = `${results.slowest}s`;
    
    // Générer le résumé des réponses
    this.renderAnswersSummary(results);
    
    // Mettre à jour le texte de partage
    if (this.dom.results.shareText) {
      const shareText = this.dom.results.shareText.value
        .replace('[SCORE]', results.score)
        .replace('[TOTAL]', results.total)
        .replace('[ACCURACY]', results.accuracy);
      
      this.dom.results.shareText.value = shareText;
    }
    
    console.log("Affichage des résultats du quiz");
  }
  
  renderAnswersSummary(results) {
    if (!this.dom.results.summary) return;
    
    const summaryContainer = this.dom.results.summary;
    summaryContainer.innerHTML = '';
    
    results.quiz.questions.forEach((question, index) => {
      const isCorrect = results.status[index] === 'correct';
      const selectedAnswer = results.answers[index] || "No answer";
      const timeTaken = results.times[index] || 0;
      
      const summaryItem = document.createElement('div');
      summaryItem.className = 'summary-item';
      
      summaryItem.innerHTML = `
        <div class="summary-question">${index + 1}. ${question.question}</div>
        <div class="summary-answer ${isCorrect ? 'correct-answer' : 'wrong-answer'}">
          ${selectedAnswer}
          ${isCorrect 
            ? '<i class="fas fa-check-circle"></i>' 
            : (selectedAnswer === "No answer" 
              ? '<i class="fas fa-minus-circle"></i>' 
              : '<i class="fas fa-times-circle"></i>')}
        </div>
        ${!isCorrect && selectedAnswer !== "No answer" 
          ? `<div class="summary-correct-answer">Correct: ${question.correctAnswer}</div>` 
          : ''}
      `;
      
      summaryContainer.appendChild(summaryItem);
    });
  }
  
  restartQuiz() {
    // Réinitialiser l'état du quiz
    this.quizManager.resetQuizState();
    
    // Masquer l'écran de résultats
    this.dom.screens.result.style.display = 'none';
    
    // Afficher l'écran de quiz
    this.dom.screens.quiz.classList.remove('hidden');
    
    // Démarrer le timer si activé
    if (this.quizManager.timerEnabled && this.dom.quiz.timer.checkbox.checked) {
      this.startTimer();
      this.dom.quiz.timer.container.classList.remove('hidden');
    }
    
    // Afficher la première question
    this.renderCurrentQuestion();
    
    console.log("Quiz redémarré");
  }
  
  confirmExitQuiz() {
    if (confirm("Are you sure you want to exit this quiz? Your progress will be lost.")) {
      // Arrêter le timer
      this.stopTimer();
      
      // Réinitialiser l'état du quiz
      this.quizManager.resetQuizState();
      
      // Masquer l'écran de quiz
      this.dom.screens.quiz.classList.add('hidden');
      
      // Afficher l'écran de sélection de quiz
      this.dom.screens.quizSelection.classList.remove('hidden');
      
      console.log("Quiz abandonné");
    }
}
  
  // ----- Méthodes pour le timer -----
  
  startTimer() {
    // Réinitialiser le temps affiché
    this.dom.quiz.timer.value.textContent = '00:00';
    
    // Arrêter le timer existant s'il y en a un
    this.stopTimer();
    
    // Démarrer le timer du quiz
    this.quizManager.startTimer();
    
    // Interval pour mettre à jour l'affichage du timer
    this.timer = setInterval(() => {
      if (!this.quizManager.startTime) return;
      
      const now = new Date();
      const elapsedSeconds = Math.floor((now - this.quizManager.startTime) / 1000);
      
      // Formater le temps (mm:ss)
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      this.dom.quiz.timer.value.textContent = formattedTime;
    }, 1000);
    
    console.log("Timer démarré");
  }
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("Timer arrêté");
    }
    
    // Arrêter le timer dans le gestionnaire de quiz
    this.quizManager.stopTimer();
  }
  
  toggleTimerVisibility() {
    if (this.dom.quiz.timer.container) {
      this.timerShown = !this.timerShown;
      
      if (this.timerShown) {
        this.dom.quiz.timer.container.classList.remove('timer-hidden');
        this.dom.quiz.timer.toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        this.dom.quiz.timer.toggle.setAttribute('aria-label', 'Hide timer');
      } else {
        this.dom.quiz.timer.container.classList.add('timer-hidden');
        this.dom.quiz.timer.toggle.innerHTML = '<i class="fas fa-eye"></i>';
        this.dom.quiz.timer.toggle.setAttribute('aria-label', 'Show timer');
      }
      
      console.log(`Visibilité du timer: ${this.timerShown ? 'affichée' : 'masquée'}`);
    }
  }
  
  // ----- Méthodes pour les résultats -----
  
  copyShareText() {
    if (!this.dom.results.shareText) return;
    
    const shareText = this.dom.results.shareText;
    shareText.select();
    shareText.setSelectionRange(0, 99999); // Pour mobile
    
    try {
      document.execCommand('copy');
      alert("Share text copied to clipboard!");
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
      // Méthode alternative avec l'API Clipboard
      navigator.clipboard.writeText(shareText.value)
        .then(() => alert("Share text copied to clipboard!"))
        .catch(err => {
          console.error("Erreur lors de la copie (Clipboard API):", err);
          alert("Unable to copy text. Please copy it manually.");
        });
    }
  }
  
  exportResults() {
    const results = this.quizManager.getResults();
    if (!results) return;
    
    // Créer un objet de données à exporter
    const exportData = {
      quiz: {
        name: results.quiz.name,
        theme: results.theme.name || `Theme ${results.theme.id}`
      },
      score: {
        correct: results.score,
        total: results.total,
        accuracy: results.accuracy
      },
      time: {
        total: results.totalTime,
        average: results.avgTime,
        fastest: results.fastest,
        slowest: results.slowest
      },
      answers: results.quiz.questions.map((question, index) => ({
        question: question.question,
        correctAnswer: question.correctAnswer,
        userAnswer: results.answers[index] || "No answer",
        isCorrect: results.status[index] === 'correct',
        timeTaken: results.times[index] || 0
      })),
      date: results.dateCompleted
    };
    
    // Convertir en JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${results.quiz.id}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log("Résultats exportés");
  }
  
  printResults() {
    window.print();
  }
  
  async confirmResetProgress() {
    if (confirm("Are you sure you want to reset all your progress? This action cannot be undone.")) {
      try {
        await storage.resetAllData();
        alert("All progress has been reset.");
        
        // Recharger la page pour réinitialiser l'UI
        window.location.reload();
      } catch (error) {
        console.error("Erreur lors de la réinitialisation des données:", error);
        alert("There was an error resetting your progress. Please try again.");
      }
    }
  }

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

export default QuizUI;
