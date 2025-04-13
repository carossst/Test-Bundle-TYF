// js/resourceManager.js - Version 2.2.1 (12/04/2025)
// Gestionnaire centralisé des ressources pour Test Your French
// Adapté pour structure de dossiers simplifiée

class ResourceManager {
  constructor() {
    // Cache des ressources chargées
    this.cache = {
      metadata: null,    // Métadonnées de tous les thèmes
      themes: {},        // Données complètes des thèmes
      quizzes: {}        // Quiz individuels (par thème)
    };
    
    console.log("ResourceManager initialisé (v2.2.1) - Structure simplifiée");
  }

  // ----- Métadonnées -----
  
  /**
   * Charge les métadonnées de tous les thèmes
   * @returns {Promise<Object>} Métadonnées des thèmes
   */
  async loadMetadata() {
    // Utiliser le cache si disponible
    if (this.cache.metadata) {
      return this.cache.metadata;
    }
    
    try {
      const response = await fetch('js/data/metadata.json');
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des métadonnées: ${response.status}`);
      }
      
      const metadata = await response.json();
      this.cache.metadata = metadata;
      console.log("Métadonnées des thèmes chargées", metadata);
      return metadata;
    } catch (error) {
      console.error("Échec du chargement des métadonnées:", error);
      throw error;
    }
  }
  
  // ----- Thèmes -----
  
  /**
   * Récupère les informations d'un thème spécifique
   * @param {number} themeId - ID du thème à charger
   * @returns {Promise<Object>} Données du thème
   */
  async getTheme(themeId) {
    // Vérifier le cache d'abord
    if (this.cache.themes[themeId]) {
      return this.cache.themes[themeId];
    }
    
    try {
      // Dans la structure simplifiée, nous générons les données du thème
      // à partir des métadonnées et des quizzes disponibles
      const metadata = await this.loadMetadata();
      const theme = metadata.themes.find(theme => theme.id === themeId);
      
      if (!theme) {
        throw new Error(`Thème ${themeId} non trouvé dans les métadonnées`);
      }
      
      // Créer un objet thème simplifié
      const themeData = {
        id: themeId,
        name: theme.name,
        description: theme.description,
        icon: theme.icon,
        quizzes: theme.quizzes
      };
      
      this.cache.themes[themeId] = themeData;
      console.log(`Thème ${themeId} chargé depuis les métadonnées`, themeData);
      return themeData;
    } catch (error) {
      console.error(`Échec du chargement du thème ${themeId}:`, error);
      throw error;
    }
  }
  
  // ----- Quiz -----
  
  /**
   * Charge les quiz d'un thème spécifique
   * @param {number} themeId - ID du thème
   * @returns {Promise<Array>} Liste des quiz du thème avec données partielles
   */
  async getThemeQuizzes(themeId) {
    // Chargement des métadonnées si nécessaire
    const metadata = await this.loadMetadata();
    
    // Récupérer les informations de base des quiz pour ce thème
    const themeMetadata = metadata.themes.find(theme => theme.id === themeId);
    if (!themeMetadata) {
      throw new Error(`Thème ${themeId} non trouvé dans les métadonnées`);
    }
    
    return themeMetadata.quizzes;
  }
  
  /**
   * Charge un quiz spécifique avec toutes ses questions
   * @param {number} themeId - ID du thème
   * @param {number} quizId - ID du quiz
   * @returns {Promise<Object>} Données complètes du quiz
   */
  async getQuiz(themeId, quizId) {
    // Vérifier le cache d'abord
    const cacheKey = `${themeId}_${quizId}`;
    if (this.cache.quizzes[cacheKey]) {
      return this.cache.quizzes[cacheKey];
    }
    
    try {
      // Chemin simplifié pour la structure de dossiers actuelle
      const response = await fetch(`js/data/quizzes/theme-${themeId}/quiz_${quizId}.json`);
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement du quiz ${quizId} (thème ${themeId}): ${response.status}`);
      }
      
      const quizData = await response.json();
      this.cache.quizzes[cacheKey] = quizData;
      console.log(`Quiz ${quizId} du thème ${themeId} chargé`, quizData);
      return quizData;
    } catch (error) {
      console.error(`Échec du chargement du quiz ${quizId} (thème ${themeId}):`, error);
      throw error;
    }
  }
  
  /**
   * Précharge les quiz d'un thème pour améliorer l'expérience utilisateur
   * @param {number} themeId - ID du thème à précharger
   */
  async preloadThemeQuizzes(themeId) {
    try {
      // Obtenir les métadonnées du thème
      const metadata = await this.loadMetadata();
      const themeInfo = metadata.themes.find(theme => theme.id === themeId);
      
      if (!themeInfo || !themeInfo.quizzes) {
        console.warn(`Impossible de précharger les quiz: thème ${themeId} non trouvé`);
        return;
      }
      
      // Précharger tous les quiz en parallèle (Promise.all)
      const quizPromises = themeInfo.quizzes.map(quiz => 
        this.getQuiz(themeId, quiz.id)
          .catch(error => {
            // Attraper les erreurs individuelles pour ne pas bloquer les autres chargements
            console.warn(`Échec du préchargement du quiz ${quiz.id}:`, error);
            return null;
          })
      );
      
      await Promise.all(quizPromises);
      console.log(`Préchargement des quiz du thème ${themeId} terminé`);
    } catch (error) {
      console.error(`Échec du préchargement des quiz pour le thème ${themeId}:`, error);
      // Ne pas propager l'erreur, le préchargement est une optimisation non critique
    }
  }
  
  // ----- Utilitaires -----
  
  /**
   * Efface le cache des données chargées
   * @param {string} type - Type de cache à effacer ('metadata', 'themes', 'quizzes', ou 'all')
   */
  clearCache(type = 'all') {
    if (type === 'all' || type === 'metadata') {
      this.cache.metadata = null;
    }
    
    if (type === 'all' || type === 'themes') {
      this.cache.themes = {};
    }
    
    if (type === 'all' || type === 'quizzes') {
      this.cache.quizzes = {};
    }
    
    console.log(`Cache nettoyé: ${type}`);
  }
  
  /**
   * Vérifie si une ressource est disponible
   * @param {string} url - URL de la ressource à vérifier
   * @returns {Promise<boolean>} True si la ressource est disponible
   */
  async checkResourceAvailability(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`Ressource non disponible: ${url}`, error);
      return false;
    }
  }
}

// Exporter une instance unique du gestionnaire
export default new ResourceManager();
