/*
 * js/main.js - Version 2.2.0 (12 avril 2024) - AVEC DEBUG LOGS
 * Point d'entrée principal de l'application Test Your French
 * Initialise les modules, gère le chargement dynamique des données
 * et configure les interactions utilisateur
 */

import QuizManager from './quizManager.js';
import QuizUI from './ui.js';
import storage from './storage.js';
import resourceManager from './resourceManager.js';
// ThemeController n'est plus importé ici

/**
 * Initialisation de l'application
 */
async function initializeApp() {
    console.log(">>> DEBUG: initializeApp() started"); // LOG 1

    // Sélection des éléments DOM (Code inchangé)
    const DOM = {
        screens: { welcome: document.getElementById('welcome-screen'), themeSelection: document.getElementById('theme-selection'), quizSelection: document.getElementById('quiz-selection'), quiz: document.getElementById('quiz-screen'), result: document.getElementById('result'), stats: document.getElementById('stats-screen') },
        quiz: { container: document.getElementById('quiz'), feedback: document.getElementById('feedback'), title: document.getElementById('quiz-name'), progress: { bar: document.getElementById('progress'), steps: document.getElementById('progress-steps') }, timer: { container: document.getElementById('timer-display'), value: document.getElementById('timer-value'), toggle: document.getElementById('timer-toggle'), checkbox: document.getElementById('enable-timer') } },
        results: { quizName: document.getElementById('result-quiz-name'), score: document.getElementById('score'), totalQuestions: document.getElementById('total-questions'), message: document.getElementById('score-message'), summary: document.getElementById('answers-summary'), stats: { accuracy: document.getElementById('accuracy'), avgTime: document.getElementById('avg-time'), fastestAnswer: document.getElementById('fastest-answer'), slowestAnswer: document.getElementById('slowest-answer') }, shareText: document.getElementById('share-text') },
        stats: { completionRate: document.getElementById('completion-rate'), completedQuizzes: document.getElementById('completed-quizzes'), totalQuizzes: document.getElementById('total-quizzes'), accuracy: document.getElementById('global-accuracy'), correctAnswers: document.getElementById('correct-answers'), totalAnswers: document.getElementById('total-answers'), avgTimePerQuestion: document.getElementById('avg-time-per-question'), themeBars: document.getElementById('themes-bars-container'), bestThemeName: document.getElementById('best-theme-name'), bestThemeAccuracy: document.getElementById('best-theme-accuracy'), worstThemeName: document.getElementById('worst-theme-name'), worstThemeAccuracy: document.getElementById('worst-theme-accuracy'), historyList: document.getElementById('quiz-history-list') },
        buttons: { exploreThemes: document.getElementById('explore-themes-btn'), backToWelcome: document.getElementById('back-to-welcome'), backToThemes: document.getElementById('back-to-themes'), backToQuizzes: document.getElementById('back-to-quizzes-btn'), showStats: document.getElementById('show-stats-btn'), backFromStats: document.getElementById('back-from-stats'), resetProgress: document.getElementById('reset-progress'), prev: document.getElementById('prev-btn'), next: document.getElementById('next-btn'), submit: document.getElementById('submit-btn'), restart: document.getElementById('restart-btn'), export: document.getElementById('export-btn'), print: document.getElementById('print-btn'), copy: document.getElementById('copy-btn'), exitQuiz: document.getElementById('exit-quiz') },
        themeTitle: document.getElementById('theme-title'), themeDescription: document.getElementById('theme-description'), themesList: document.getElementById('themes-list'), quizzesList: document.getElementById('quizzes-list'),
        totalQuestionsGlobalPlaceholder: document.getElementById('total-questions-global-placeholder'), totalThemesGlobalPlaceholder: document.getElementById('total-themes-global-placeholder'), welcomeStatsPlaceholder: document.getElementById('welcome-stats-placeholder')
    };
     console.log(">>> DEBUG: DOM elements selected"); // LOG 2

    // Vérification DOM essentiels
    if (!DOM.screens.welcome || !DOM.quiz.container) {
        console.error(">>> DEBUG: Critical DOM elements missing!");
        showErrorMessage("Critical application components are missing. Please refresh.");
        return;
    }

    // Initialisation des modules
    const quizManager = new QuizManager();
    console.log(">>> DEBUG: QuizManager initialized"); // LOG 3
    const quizUI = new QuizUI(quizManager, DOM, resourceManager, storage);
    console.log(">>> DEBUG: QuizUI initialized"); // LOG 4

    try {
        console.log(">>> DEBUG: Entering initialization try block"); // LOG 5
        // Préchager l'index des thèmes (metadata)
        const metadata = await resourceManager.loadMetadata();
        console.log(">>> DEBUG: Metadata loaded", metadata); // LOG 6
        updateGlobalCounters(metadata, DOM);
        console.log(">>> DEBUG: Global counters updated"); // LOG 7
        await displayWelcomeStats(DOM);
        console.log(">>> DEBUG: Welcome stats displayed"); // LOG 8

        quizUI.setupEventListeners(); // Attacher les écouteurs
        console.log(">>> DEBUG: Event listeners set up by QuizUI"); // LOG 9
        quizUI.showWelcomeScreen();   // Afficher l'écran d'accueil
        console.log(">>> DEBUG: Welcome screen shown"); // LOG 10

    } catch (error) {
        console.error(">>> DEBUG: Initialization failed in try block:", error); // LOG ERROR
        showErrorMessage("Could not load essential application data. Please check connection and refresh.");
    }
     console.log(">>> DEBUG: initializeApp() finished"); // LOG 11
}

// ----- Fonctions Helper Inchangées -----
function updateGlobalCounters(metadata, DOM) { /* ... */ }
async function displayWelcomeStats(DOM) { /* ... */ }
function showErrorMessage(message) { alert(`Error: ${message}`); }

// ----- Lancement -----
if (document.readyState === 'loading') {
    console.log(">>> DEBUG: DOM not ready, adding listener");
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log(">>> DEBUG: DOM ready, calling initializeApp directly");
    initializeApp();
}
