// js/quizManager.js - Version 2.1.0 (11/04/2025)
// Gestion de la logique du quiz
// Contient les classes et méthodes pour gérer l'état du quiz, la navigation entre thèmes/quiz/questions,
// et le suivi des réponses et du score
// Adapté pour le chargement dynamique des données de thème

class QuizManager {
  constructor() {
    // Données 
    this.currentThemeData = null; // Données du thème actif chargé dynamiquement
    
    // Navigation
    this.currentThemeId = null;
    this.currentQuizId = null;
    this.currentQuestionIndex = 0;
    
    // État du quiz
    this.score = 0;
    this.selectedAnswers = [];
    this.questionStatus = [];
    this.questionTimes = [];
    this.startTime = null;
    this.timerEnabled = true;
    this.timerInterval = null;
    this.totalTimeElapsed = 0;
    
    console.log("QuizManager initialisé (v2.1.0)");
  }

  // ----- Chargement des données -----
  
  loadThemeData(themeData) {
    if (!themeData || !themeData.themeId || !Array.isArray(themeData.quizzes)) {
      console.error("Structure de données de thème invalide:", themeData);
      this.currentThemeData = null; 
      this.currentThemeId = null; 
      return false;
    }
    
    this.currentThemeData = themeData;
    this.currentThemeId = themeData.themeId;
    this.currentQuizId = null;
    this.resetQuizState();
    
    console.log(`Données chargées pour le thème ID: ${this.currentThemeId}`);
    return true;
  }
  
  getCurrentThemeData() { 
    return this.currentThemeData; 
  }

  // ----- Méthodes d'accès aux données -----
  
  getQuiz(quizId) {
    if (!this.currentThemeData || !this.currentThemeData.quizzes) return null;
    const id = Number(quizId);
    return this.currentThemeData.quizzes.find(quiz => quiz.id === id);
  }
  
  getCurrentQuiz() {
    if (!this.currentQuizId || !this.currentThemeData) return null;
    return this.getQuiz(this.currentQuizId);
  }
  
  getCurrentQuestion() {
    const quiz = this.getCurrentQuiz();
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= quiz.questions.length) {
      console.error(`Index de question invalide: ${this.currentQuestionIndex}`); 
      return null;
    }
    return quiz.questions[this.currentQuestionIndex];
  }
  
  // ----- Méthodes de navigation -----
  
  setQuiz(quizId) {
    if (!this.currentThemeData) { 
      console.error("Impossible de définir le quiz, aucune donnée de thème chargée."); 
      return null; 
    }
    
    this.currentQuizId = Number(quizId);
    this.resetQuizState(); // Essentiel pour commencer un nouveau quiz

    const quiz = this.getCurrentQuiz();
    if (quiz && quiz.questions) {
      const questionCount = quiz.questions.length;
      this.selectedAnswers = Array(questionCount).fill(null);
      this.questionStatus = Array(questionCount).fill(null);
      this.questionTimes = Array(questionCount).fill(0);
      console.log(`Quiz défini: ${this.currentQuizId}. État initialisé pour ${questionCount} questions.`);
    } else {
      console.error(`Données de quiz non trouvées pour l'ID de quiz: ${quizId} dans le thème ${this.currentThemeId}`);
      this.selectedAnswers = []; 
      this.questionStatus = []; 
      this.questionTimes = [];
    }
    
    return quiz;
  }
  
  nextQuestion() {
    const quiz = this.getCurrentQuiz();
    if (!quiz) return false;
    
    if (this.currentQuestionIndex < quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.startTime = this.timerEnabled ? new Date() : null; // Reset timer pour la nouvelle question
      console.log(`Question suivante: ${this.currentQuestionIndex}`);
      return true;
    }
    
    console.log("Fin du quiz atteinte.");
    return false;
  }
  
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.startTime = null; // Ne pas redémarrer le timer en revenant en arrière
      console.log(`Question précédente: ${this.currentQuestionIndex}`);
      return true;
    }
    return false;
  }
  
  // ----- Méthodes de gestion du quiz -----
  
  resetQuizState() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswers = [];
    this.questionStatus = [];
    this.questionTimes = [];
    this.totalTimeElapsed = 0;
    this.startTime = null;
    this.stopTimer();
    console.log("État du quiz réinitialisé.");
  }
  
  submitAnswer(optionIndex) {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || this.questionStatus[this.currentQuestionIndex] !== null) { 
      return null; 
    }
    
    if (optionIndex < 0 || optionIndex >= currentQuestion.options.length) { 
      console.error(`Index d'option invalide: ${optionIndex}`); 
      return null; 
    }

    const selectedAnswerText = currentQuestion.options[optionIndex];
    const correctAnswerText = currentQuestion.correctAnswer;

    if (!currentQuestion.options.includes(correctAnswerText)) {
      console.error(`Réponse correcte "${correctAnswerText}" non trouvée dans les options pour la question:`, currentQuestion.question);
      this.recordAnswer(selectedAnswerText, false); 
      this.recordQuestionTime();
      return { 
        isCorrect: false, 
        selectedAnswer: selectedAnswerText, 
        correctAnswer: correctAnswerText 
      };
    }

    const isCorrect = selectedAnswerText === correctAnswerText;
    this.recordAnswer(selectedAnswerText, isCorrect);
    this.recordQuestionTime();

    console.log(`Réponse soumise pour Q${this.currentQuestionIndex + 1}: ${selectedAnswerText}. Correcte: ${isCorrect}`);
    return { 
      isCorrect, 
      selectedAnswer: selectedAnswerText, 
      correctAnswer: correctAnswerText 
    };
  }
  
  recordAnswer(selectedAnswerText, isCorrect) {
    if (this.currentQuestionIndex < this.questionStatus.length && 
        this.questionStatus[this.currentQuestionIndex] === null) {
      this.selectedAnswers[this.currentQuestionIndex] = selectedAnswerText;
      this.questionStatus[this.currentQuestionIndex] = isCorrect ? 'correct' : 'incorrect';
      
      if (isCorrect) {
        this.score++;
      }
    } else { 
      console.warn(`Impossible d'enregistrer la réponse pour Q${this.currentQuestionIndex + 1}.`); 
    }
  }
  
  recordQuestionTime() {
    if (!this.timerEnabled || !this.startTime) return;
    
    const endTime = new Date();
    const timeTaken = Math.max(0, Math.floor((endTime - this.startTime) / 1000));
    
    if (this.currentQuestionIndex < this.questionTimes.length && 
        this.questionTimes[this.currentQuestionIndex] === 0) {
      const validTime = timeTaken > 0 ? timeTaken : 1;
      this.questionTimes[this.currentQuestionIndex] = validTime;
      this.totalTimeElapsed += validTime;
      console.log(`Temps enregistré pour Q${this.currentQuestionIndex + 1}: ${validTime}s. Temps total: ${this.totalTimeElapsed}s`);
    }
    
    // Réinitialiser le chronomètre pour la prochaine question
    this.startTime = new Date();
  }
  
  // ----- Méthodes de gestion du timer -----
  
  startTimer() {
    if (!this.timerEnabled) return;
    
    this.stopTimer();
    this.startTime = new Date();
    this.totalTimeElapsed = 0;
    
    const quiz = this.getCurrentQuiz();
    this.questionTimes = (quiz && quiz.questions) ? Array(quiz.questions.length).fill(0) : [];
    
    console.log("Démarrage du timer du quiz.");
  }
  
  stopTimer() {
    // L'arrêt de l'intervalle est géré par UI.js
    // On s'assure juste que startTime est null pour arrêter les calculs de temps ici
    this.startTime = null;
    if (this.timerInterval) { 
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    console.log("Arrêt du timer du quiz.");
  }
  
  // ----- Méthodes de résultats -----
  
  getResults() {
    const quiz = this.getCurrentQuiz();
    if (!quiz || !quiz.questions) { 
      console.error("Impossible d'obtenir les résultats: données de quiz/thème manquantes."); 
      return null; 
    }

    // Construire les informations du thème
    const themeId = this.currentThemeId;
    // Objet thème de base - Idéalement enrichi par l'UI avec les données complètes du thème
    const themeInfo = { 
      id: themeId, 
      name: `Theme ${themeId}` 
    };

    const calculatedScore = this.questionStatus.filter(s => s === 'correct').length;
    if (calculatedScore !== this.score) { 
      console.warn(`Différence de score! Utilisation calculée: ${calculatedScore}`); 
      this.score = calculatedScore; 
    }

    const totalQuestions = quiz.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((this.score / totalQuestions) * 100) : 0;
    const validTimes = this.questionTimes.filter((t, index) => this.questionStatus[index] !== null && t > 0);
    const avgTime = validTimes.length ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 'N/A';
    const fastest = validTimes.length ? Math.min(...validTimes) : 'N/A';
    const slowest = validTimes.length ? Math.max(...validTimes) : 'N/A';
    const completed = this.questionStatus.every(status => status !== null);

    console.log("Génération des résultats:", { 
      score: this.score, 
      total: totalQuestions, 
      accuracy, 
      totalTime: this.totalTimeElapsed 
    });

    return {
      theme: themeInfo,
      quiz: { 
        id: quiz.id, 
        name: quiz.name, 
        questions: quiz.questions 
      },
      score: this.score, 
      total: totalQuestions, 
      accuracy: accuracy,
      answers: [...this.selectedAnswers], 
      status: [...this.questionStatus], 
      times: [...this.questionTimes],
      totalTime: this.totalTimeElapsed, 
      avgTime: avgTime, 
      fastest: fastest, 
      slowest: slowest,
      completed: completed, 
      dateCompleted: new Date().toISOString()
    };
  }
  
  // Détermine le niveau en fonction du score
  evaluateLevel(score, total) {
    if (total === 0) return { 
      level: 'N/A', 
      description: 'Aucune question dans ce quiz.' 
    };
    
    const percentage = Math.round((score / total) * 100);
    
    if (percentage >= 80) {
      return {
        level: 'A2',
        description: 'Vous maîtrisez les bases de la communication en français. Vous pouvez vous présenter, demander des directions et comprendre des phrases simples utilisées dans la vie quotidienne.'
      };
    } else if (percentage >= 60) {
      return {
        level: 'A1+',
        description: 'Vous connaissez les fondamentaux et vous approchez du niveau A2. Avec un peu plus de pratique sur les expressions quotidiennes, vous atteindrez bientôt le niveau A2.'
      };
    } else if (percentage >= 40) {
      return {
        level: 'A1',
        description: 'Vous connaissez quelques expressions de base, mais vous devez encore vous entraîner pour atteindre le niveau A2. Continuez à apprendre !'
      };
    } else if (percentage >= 20) {
      return {
        level: 'Pre-A1',
        description: 'Vous avez commencé à apprendre le français. Avec plus de pratique sur les expressions de base, vous progresserez vers le niveau A1.'
      };
    } else {
      return {
        level: 'Débutant',
        description: 'Vous débutez en français. Ne vous inquiétez pas ! Tout le monde commence quelque part. Continuez à pratiquer !'
      };
    }
  }
}

export default QuizManager;