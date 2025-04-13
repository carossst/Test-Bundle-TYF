// js/tests/storage.test.js - Version 2.2.0 (11/04/2025)
// Tests unitaires pour les fonctions de stockage avec IndexedDB
// Utilisation du framework de test Jest avec fake-indexeddb pour simuler IndexedDB

// Importer les dépendances
import 'fake-indexeddb/auto'; // Simuler IndexedDB pour les tests
import StorageManager from '../storage.js';

// Simulacre des données de quiz pour les tests
const mockQuizResults = {
  theme: {
    id: 1,
    name: "Test Theme"
  },
  quiz: {
    id: 101,
    name: "Test Quiz"
  },
  score: 8,
  total: 10,
  accuracy: 80,
  completed: true,
  dateCompleted: new Date().toISOString(),
  totalTime: 300, // 5 minutes
  status: ['correct', 'correct', 'incorrect', 'correct', 'correct', 
           'correct', 'incorrect', 'correct', 'correct', 'correct'],
  answers: ["Option A", "Option B", "Option C", "Option D", "Option E", 
            "Option F", "Option G", "Option H", "Option I", "Option J"]
};

// Groupe de tests pour StorageManager
describe('StorageManager', () => {
  let storage;
  
  // Avant tous les tests, initialiser l'IndexedDB simulé
  beforeAll(async () => {
    // Supprimer toutes les bases de données indexedDB existantes
    const databases = await window.indexedDB.databases();
    await Promise.all(
      databases.map(
        db => window.indexedDB.deleteDatabase(db.name)
      )
    );
  });
  
  // Avant chaque test, créer une nouvelle instance de StorageManager
  beforeEach(() => {
    storage = new StorageManager();
  });
  
  // Après chaque test, nettoyer la base de données
  afterEach(async () => {
    try {
      await storage.clearStore(storage.STORES.PROGRESS);
      await storage.clearStore(storage.STORES.STATS);
      await storage.clearStore(storage.STORES.BADGES);
      await storage.clearStore(storage.STORES.STREAKS);
    } catch (error) {
      console.warn("Erreur de nettoyage après test:", error);
    }
  });
  
  // Test pour vérifier l'initialisation de la base de données
  test('doit initialiser correctement la base de données', async () => {
    await storage.initDatabase();
    expect(storage.db).not.toBeNull();
    expect(storage.isConnecting).toBe(false);
  });
  
  // Test pour vérifier la sauvegarde et récupération des résultats de quiz
  test('doit sauvegarder et récupérer correctement les résultats de quiz', async () => {
    // Sauvegarder les résultats du quiz
    const saveSuccess = await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    expect(saveSuccess).toBe(true);
    
    // Récupérer les résultats
    const savedResults = await storage.getQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id
    );
    
    // Vérifier que les données récupérées correspondent aux données enregistrées
    expect(savedResults).not.toBeNull();
    expect(savedResults.score).toBe(mockQuizResults.score);
    expect(savedResults.total).toBe(mockQuizResults.total);
    expect(savedResults.accuracy).toBe(mockQuizResults.accuracy);
    expect(savedResults.completed).toBe(mockQuizResults.completed);
  });
  
  // Test pour vérifier la mise à jour des statistiques globales
  test('doit mettre à jour correctement les statistiques globales', async () => {
    // Sauvegarder les résultats du quiz (ce qui met aussi à jour les stats globales)
    await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    // Récupérer les statistiques globales
    const globalStats = await storage.getGlobalStats();
    
    // Vérifier les stats
    expect(globalStats).not.toBeNull();
    expect(globalStats.data).not.toBeNull();
    
    // Le quiz devrait être enregistré comme complété
    const quizKey = `${mockQuizResults.theme.id}_${mockQuizResults.quiz.id}`;
    expect(globalStats.data.completedQuizzesSet[quizKey]).toBe(true);
    
    // Les compteurs devraient être mis à jour
    expect(globalStats.data.totalQuestionsAnswered).toBe(mockQuizResults.total);
    expect(globalStats.data.totalCorrectAnswers).toBe(mockQuizResults.score);
    
    // Le temps de jeu devrait être enregistré
    expect(globalStats.data.totalTimePlayedSeconds).toBe(mockQuizResults.totalTime);
    
    // L'historique devrait contenir une entrée
    expect(globalStats.data.quizHistory.length).toBe(1);
    expect(globalStats.data.quizHistory[0].themeId).toBe(mockQuizResults.theme.id);
    expect(globalStats.data.quizHistory[0].quizId).toBe(mockQuizResults.quiz.id);
    expect(globalStats.data.quizHistory[0].score).toBe(mockQuizResults.score);
  });
  
  // Test pour vérifier le calcul du taux de complétion global
  test('doit calculer correctement le taux de complétion global', async () => {
    // Sauvegarder les résultats du quiz
    await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    // Calculer le taux de complétion
    const completionRate = await storage.getGlobalCompletionRate();
    
    // Il y a 1 quiz complété sur 50 possibles
    expect(completionRate).toBe(2); // 1/50 = 2%
  });
  
  // Test pour vérifier le calcul de la précision globale
  test('doit calculer correctement la précision globale', async () => {
    // Sauvegarder les résultats du quiz
    await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    // Calculer la précision globale
    const accuracy = await storage.getGlobalAccuracy();
    
    // La précision est de 8/10 = 80%
    expect(accuracy).toBe(80);
  });
  
  // Test pour vérifier la gestion des badges
  test('doit attribuer correctement les badges', async () => {
    // Sauvegarder les résultats du quiz qui devraient déclencher l'attribution de badges
    await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    // Récupérer les badges
    const badges = await storage.getUserBadges();
    
    // Vérifier qu'au moins un badge a été attribué (le badge "Premier Pas")
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some(badge => badge.id === 'first_completed')).toBe(true);
  });
  
  // Test pour vérifier la réinitialisation des données
  test('doit réinitialiser correctement toutes les données', async () => {
    // Sauvegarder des données
    await storage.saveQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id,
      mockQuizResults
    );
    
    // Vérifier que les données sont sauvegardées
    const savedResults = await storage.getQuizResult(
      mockQuizResults.theme.id,
      mockQuizResults.quiz.id
    );
    expect(savedResults).not.toBeNull();
    
    // Réinitialiser toutes les données
    const resetSuccess = await storage.resetAllData();
    expect(resetSuccess).toBe(true);
    
    // Vérifier que les données sont effacées
    const progress = await storage.getProgress();
    expect(progress.themes).toEqual({});
    
    const globalStats = await storage.getGlobalStats();
    expect(Object.keys(globalStats.data.completedQuizzesSet)).toHaveLength(0);
    
    const badges = await storage.getUserBadges();
    expect(badges).toHaveLength(0);
  });
});
