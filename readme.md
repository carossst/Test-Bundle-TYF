# Test Your French Quiz - Version 2.2.0 (11/04/2025)

## Vision du projet

**The Test Your French Bundle that helps you avoid the "France shock"! French Tests with authentic conversations, not academic French.**

Cette application propose une approche pratique et authentique pour apprendre le français conversationnel utilisé au quotidien, et non le français académique souvent enseigné dans les manuels traditionnels. L'objectif est de préparer les apprenants aux situations réelles qu'ils rencontreront en France, évitant ainsi le "choc culturel français".

## Structure complète planifiée

**10 Thèmes = 50 Quiz = 500 Questions**

Chaque thème suit une structure standardisée de 5 quiz :
1. Writing and Reading [Thème]
2. Writing and Reading Conversation [Thème]
3. Listening [Thème]
4. Listening Conversation [Thème]
5. Writing, Reading & Listening [Thème]

Voici les 10 thèmes de l'application :

1. **I Speak Café French**
   - Vocabulaire et expressions pour commander dans un café
   - Comprendre le menu et les spécialités
   - Interagir avec le personnel de service
   - Payer et laisser un pourboire

2. **I Speak Colors French**
   - Noms des couleurs en français
   - Accords des adjectifs de couleur
   - Expressions idiomatiques avec les couleurs
   - Description d'objets en utilisant les couleurs

3. **I Speak Gender French**
   - Masculin et féminin des noms
   - Articles définis et indéfinis
   - Accords des adjectifs en genre
   - Exceptions et cas particuliers

4. **I Speak Numbers French**
   - Compter en français
   - Exprimer les prix et l'argent
   - Dates, heures et mesures
   - Particularités du système numérique français (70, 80, 90)

5. **I Speak Present Tense French**
   - Conjugaison des verbes au présent
   - Verbes réguliers et irréguliers
   - Utilisation du présent pour différentes temporalités
   - Expression des habitudes et actions en cours

6. **I Speak Accents French**
   - Les différents accents français (aigu, grave, circonflexe)
   - Impact des accents sur la prononciation
   - Règles d'utilisation des accents
   - Mots courants avec accents

7. **I Speak ça va (breaking the ice) French**
   - Expressions pour entamer une conversation
   - Salutations formelles et informelles
   - Réponses appropriées aux questions courantes
   - Formules de politesse essentielles

8. **I Speak Métro French**
   - Vocabulaire des transports publics parisiens
   - Comprendre les annonces et indications
   - Demander et suivre des directions
   - Acheter des billets et naviguer dans le métro

9. **I Speak Boulangerie French**
   - Commander du pain et des pâtisseries
   - Vocabulaire des produits de boulangerie
   - Interactions avec le boulanger
   - Expressions spécifiques à la boulangerie française

10. **General Revision**
    - Mix de quiz couvrant tous les thèmes précédents
    - Révision des expressions et vocabulaire clés
    - Combinaison de toutes les compétences
    - Préparation pour des conversations réelles

## Phase actuelle : Version 2.2.0 avec architecture améliorée

### Améliorations de la version 2.2.0 par rapport à la 2.1.0 :

1. **Architecture orientée modules avec chargement à la demande**
   - Chargement initial des métadonnées et du premier quiz seulement
   - Chargement des autres quiz d'un thème seulement lorsque ce thème est sélectionné
   - Conversion des données de modules JavaScript vers JSON pour améliorer la performance

2. **Gestion optimisée du cache**
   - Service Worker amélioré pour gérer efficacement les fichiers audio
   - Stratégie de mise en cache intelligente pour les ressources

3. **Utilisation d'IndexedDB pour le stockage**
   - Performances améliorées par rapport au localStorage
   - Possibilité de stocker plus de données (pas de limite de 5MB)
   - Migration automatique des données depuis l'ancien système

4. **Fonctionnalités de gamification**
   - Système de badges pour récompenser les progrès
   - Suivi des "streaks" (séquences de jours consécutifs d'activité)
   - Points et niveaux pour motiver les utilisateurs

5. **Tests unitaires pour les fonctions critiques**
   - Vérification des réponses
   - Calcul des scores
   - Gestion du stockage

6. **Améliorations d'accessibilité**
   - Support amélioré pour les lecteurs d'écran
   - Mode contraste élevé
   - Navigation par clavier optimisée

## Architecture technique

La nouvelle architecture adopte un modèle modulaire avec chargement à la demande :

```
/
├── index.html            # Structure principale HTML
├── style.css             # Styles CSS globaux
├── manifest.json         # Configuration PWA
├── sw.js                 # Service Worker amélioré pour le cache audio
├── /js
│   ├── main.js               # Point d'entrée mis à jour
│   ├── resourceManager.js    # Nouveau gestionnaire centralisé des ressources
│   ├── themeController.js    # Nouveau contrôleur pour la gestion des thèmes
│   ├── quizManager.js        # Gestion de la logique du quiz 
│   ├── ui.js                 # Interface utilisateur 
│   ├── storage.js            # Stockage avec IndexedDB
│   ├── tests/                # Tests unitaires
│   │   ├── quiz.test.js      # Tests pour le quiz
│   │   ├── storage.test.js   # Tests pour le stockage
│   │   └── ...               # Autres tests
│   └── /data
│       ├── metadata.json          # Métadonnées de tous les thèmes
│       ├── /themes/               # Données complètes des thèmes
│       │   ├── theme_1.json       # Thème 1 (Café)
│       │   ├── theme_2.json       # Thème 2 (Couleurs)
│       │   └── ...                # Autres thèmes
│       └── /quizzes/              # Quiz individuels par thème
│           ├── /theme_1/          # Quiz du thème 1
│           │   ├── quiz_101.json  # Quiz 1 du thème 1
│           │   ├── quiz_102.json  # Quiz 2 du thème 1
│           │   └── ...            # Autres quiz du thème 1
│           ├── /theme_2/          # Quiz du thème 2
│           └── ...                # Autres dossiers de thèmes
├── /audio                # Fichiers audio pour les questions d'écoute
└── /icons                # Icônes de l'application
```

### Explication des composants clés :

#### 1. ResourceManager.js
Gestionnaire centralisé des ressources responsable de :
- Charger les métadonnées des thèmes
- Charger les données des thèmes à la demande
- Charger les quiz individuels quand nécessaire
- Gérer le cache des ressources pour optimiser les performances

#### 2. ThemeController.js
Contrôleur intermédiaire qui :
- Coordonne les interactions entre l'UI et le ResourceManager
- Gère le cycle de vie des données de thème
- Précharge certaines données de manière intelligente
- Enrichit les données avec des informations de progression

#### 3. Storage.js avec IndexedDB
Système de stockage amélioré utilisant IndexedDB pour :
- Stocker la progression de l'utilisateur
- Gérer les statistiques globales
- Suivre les badges et les streaks
- Migrer automatiquement les données depuis l'ancien système

#### 4. Service Worker amélioré
Stratégies de mise en cache optimisées :
- Cache First avec mise à jour en arrière-plan pour les fichiers audio
- Network First avec fallback cache pour les données JSON
- Cache First avec fallback réseau pour les ressources d'application

## Flux de données

1. **Démarrage de l'application**
   - Chargement des métadonnées via ResourceManager
   - Affichage de la liste des thèmes enrichie avec les données de progression

2. **Sélection d'un thème**
   - Chargement des données du thème via ResourceManager
   - Préchargement du premier quiz en arrière-plan
   - Affichage de la liste des quiz disponibles

3. **Sélection d'un quiz**
   - Chargement des données complètes du quiz via ResourceManager
   - Préchargement des autres quiz du thème en arrière-plan
   - Initialisation du quiz dans QuizManager

4. **Pendant le quiz**
   - Gestion des questions et des réponses par QuizManager
   - Préchargement des fichiers audio si nécessaire

5. **Fin du quiz**
   - Enregistrement des résultats via Storage
   - Mise à jour des statistiques globales
   - Attribution des badges si les conditions sont remplies
   - Mise à jour des données de streak

## Tests unitaires

Des tests unitaires sont implémentés pour les fonctions critiques :

1. **Tests de QuizManager**
   - Vérification des réponses
   - Calcul du score
   - Navigation entre les questions

2. **Tests de Storage**
   - Sauvegarde et récupération des données
   - Migration depuis localStorage
   - Gestion des badges et des streaks

3. **Tests de ResourceManager**
   - Chargement des ressources
   - Gestion du cache
   - Récupération des quiz

## État actuel des fichiers

| Composant | État | Description |
|---------|------|-------------|
| Architecture de base | Complet | Structure modulaire avec chargement à la demande |
| Conversion JS vers JSON | En cours | Tous les thèmes et quiz sont en cours de conversion |
| IndexedDB | Complet | Implémentation complète avec migration |
| Gamification | Complet | Badges et streaks fonctionnels |
| Tests unitaires | En cours | Tests pour les fonctions critiques |
| Accessibilité | En cours | Améliorations en cours d'implémentation |

## Prochaines étapes

1. **Finalisation de la conversion des données**
   - Compléter la conversion de tous les thèmes et quiz en JSON
   - Validation des structures de données

2. **Tests d'intégration**
   - Vérification du fonctionnement de bout en bout
   - Tests de performance

3. **Optimisations**
   - Réduction de la taille des fichiers
   - Amélioration des temps de chargement
   - Audit de performance

## Installation et déploiement

### Pour les utilisateurs

Aucune installation n'est requise pour utiliser l'application en ligne. Pour l'installer sur votre appareil :

1. Visitez l'application dans votre navigateur
2. Sur mobile : appuyez sur "Ajouter à l'écran d'accueil" dans le menu du navigateur
3. Sur desktop : utilisez le bouton d'installation qui apparaît dans la barre d'adresse

### Pour les développeurs

1. Clonez ce dépôt : `git clone [URL]`
2. Servez les fichiers avec un serveur web simple :
   - Avec Node.js : `npx serve` (après avoir installé Node.js)
   - Avec Python : `python -m http.server 8000`
   - Via l'extension Live Server dans VS Code
3. Accédez à `http://localhost:8000` (ou le port spécifié)

## Développement futur (après v2.3.0)

- Ajout de thèmes supplémentaires (restaurants, shopping, urgences médicales)
- Mode pratique avec quiz rapides et révisions ciblées
- Quiz personnalisés basés sur les performances de l'utilisateur
- Fonctionnalités sociales pour partager et comparer les progrès
- Extensions pour d'autres dialectes français (québécois, belge, suisse)

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## Auteur

Carole Stromboni - Test Your French (2025)

## Remerciements

- Merci à tous les apprenants du français qui ont testé l'application
- Font Awesome pour les icônes
- MDN Web Docs pour les références techniques