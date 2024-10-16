// Firebase configuration and initialization (ensure Firebase SDK is loaded in index.html)
const firebaseConfig = {
    apiKey: "AIzaSyDzW7DnZHz37xOyI6Nyp1SSq9gT1PxYjLI",
    authDomain: "arcs-card-tracker-aee70.firebaseapp.com",
    projectId: "arcs-card-tracker-aee70",
    storageBucket: "arcs-card-tracker-aee70.appspot.com",
    messagingSenderId: "1002391730061",
    appId: "1:1002391730061:web:b51f03c462f55dae476fc4",
    measurementId: "G-RVK40GKC8K"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables for theme toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Load theme preference from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// Event listener for theme toggle
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// Variables for navigation and filtering
const navButtons = document.querySelectorAll('.nav-button');
const filterButtons = document.querySelectorAll('.filter-button');
let currentType = 'court';
let currentFilter = null;
let cardData = [];
let gameCode = null; // Unique game code for the session

// Function to create a new game session and save initial data to Firestore
async function createGameSession() {
    try {
        const newGameRef = db.collection('gameSessions').doc(); // Auto-generate ID
        await newGameRef.set({
            cards: cardData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        gameCode = newGameRef.id;
        alert(`Game created! Share this code with others: ${gameCode}`);
    } catch (error) {
        console.error("Error creating game session:", error);
    }
}

// Function to load an existing game session from Firestore
async function loadGameSession(code) {
    try {
        const gameRef = db.collection('gameSessions').doc(code);
        const gameSnapshot = await gameRef.get();
        if (gameSnapshot.exists) {
            cardData = gameSnapshot.data().cards;
            gameCode = code;
            initializeApp();
        } else {
            alert('Game not found! Please check the game code.');
        }
    } catch (error) {
        console.error("Error loading game session:", error);
    }
}

// Function to save card data to Firestore
async function saveCardData() {
    if (!gameCode) return;
    try {
        const gameRef = db.collection('gameSessions').doc(gameCode);
        await gameRef.update({
            cards: cardData
        });
    } catch (error) {
        console.error("Error saving card data:", error);
    }
}

// Functions for handling the game code modal
function openGameCodePrompt() {
    document.getElementById('game-code-prompt').style.display = 'block';
    document.getElementById('dimmed-background').style.display = 'block';
}

function closeGameCodePrompt() {
    document.getElementById('game-code-prompt').style.display = 'none';
    document.getElementById('dimmed-background').style.display = 'none';
}

async function handleGameCode() {
    const gameCodeInput = document.getElementById('game-code-input').value.trim();

    if (gameCodeInput) {
        loadGameSession(gameCodeInput);
    } else {
        createGameSession();
    }
    closeGameCodePrompt();
}

// Load card data from JSON file
fetch('cards.json')
    .then(response => response.json())
    .then(data => {
        cardData = data.cards;
        openGameCodePrompt(); // Open the modal to either create or join a game session
    })
    .catch(error => console.error('Error loading card data:', error));

// Initialize the application after data is loaded
function initializeApp() {
    // Event listeners for navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentType = button.getAttribute('data-type');
            currentFilter = null;
            filterButtons.forEach(btn => btn.classList.remove('active'));
            displayAllCards(currentType);
        });
    });

    // Event listeners for filter buttons (player selection)
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.getAttribute('data-color');
            displayAllAssignedCards(currentFilter); // Show all assigned cards (Leader, Lore, Court)
        });
    });

    // Event listener for search input
    document.getElementById('search-input').addEventListener('input', function () {
        const query = this.value.toLowerCase();
        filterCardsBySearch(query);
    });

    // Initial display of cards
    displayAllCards(currentType);
}

// Function to display all cards of a certain type with current filters
function displayAllCards(type) {
    // Clear the search input
    document.getElementById('search-input').value = '';

    const cardList = document.getElementById('card-list');
    cardList.innerHTML = '';

    let filteredCards = cardData.filter(card => card.type === type);

    if (currentFilter) {
        filteredCards = filteredCards.filter(card => card.player === currentFilter);
    }

    displayFilteredCards(filteredCards);
}

// New function to display all assigned cards (Leader, Lore, Court) for the selected player in specific order
function displayAllAssignedCards(playerColor) {
    const cardList = document.getElementById('card-list');
    cardList.innerHTML = '';

    // Filter all cards (Leader, Lore, Court) by the selected player color
    let assignedCards = cardData.filter(card => card.player === playerColor);

    // Sort cards by type: Leader first, then Lore, then Court
    assignedCards.sort((a, b) => {
        const order = { 'leader': 1, 'lore': 2, 'court': 3 };
        return order[a.type] - order[b.type];
    });

    displayFilteredCards(assignedCards); // Display all sorted cards
}

// Function to display filtered cards
function displayFilteredCards(cards) {
    const cardList = document.getElementById('card-list');
    cardList.innerHTML = '';

    cards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        // Card Title
        const title = document.createElement('h2');
        title.textContent = card.title;
        cardElement.appendChild(title);

        // Card Description
        const description = document.createElement('div');
        description.classList.add('description');
        description.innerHTML = formatDescription(card.description);
        cardElement.appendChild(description);

        // Player Picker (Assignment Buttons)
        const playerPicker = document.createElement('div');
        playerPicker.classList.add('player-picker');

        // Define the options array based on card type
        let options = ['none', 'court', 'red', 'blue', 'gold', 'white'];

        // Create assignment buttons
        options.forEach(optionValue => {
            const button = document.createElement('button');
            button.classList.add('assign-button', `${optionValue}-button`);
            button.textContent = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
            button.setAttribute('data-value', optionValue);
            button.setAttribute('aria-label', `Assign to ${optionValue.charAt(0).toUpperCase() + optionValue.slice(1)}`);
        
            // Highlight the button if it's the current assignment
            if (card.player === optionValue) {
                button.classList.add('active');
            }
        
            // Add event listener for assignment
            button.addEventListener('click', () => {
                // Update the card's player assignment
                card.player = optionValue;
        
                // Save updated card data to Firestore
                saveCardData();
        
                // Re-render the cards to reflect changes
                displayAllCards(currentType);
            });
        
            playerPicker.appendChild(button);
        });

        cardElement.appendChild(playerPicker);
        cardList.appendChild(cardElement);
    });
}

// Function to filter cards based on search query
function filterCardsBySearch(query) {
    let filteredCards = cardData.filter(card => {
        return card.type === currentType &&
            (card.title.toLowerCase().includes(query) ||
                card.description.toLowerCase().includes(query));
    });

    if (currentFilter) {
        filteredCards = filteredCards.filter(card => card.player === currentFilter);
    }

    displayFilteredCards(filteredCards);
}

// Function to format description text with bold phrases
function formatDescription(text) {
    const phrasesToBold = [
        "When Secured:",
        "Abduct (Battle):",
        "Prelude:",
        "Pressgang (Build):",
        "Execute (Influence):",
        "Manufacture (Build):",
        "Synthesize (Build):",
        "Trade (Tax):",
        "Nurture (Build):",
        "Prune (Repair):",
        "Fire Rifles (Battle):",
        "Martyr (Move):",
        "Annex (Build):",
        "Guide (Move):",
    ];

    const escapedPhrases = phrasesToBold.map(phrase => phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const pattern = '\\b(' + escapedPhrases.join('|') + ')';
    const regex = new RegExp(pattern, 'g');

    return text.replace(regex, '<strong>$1</strong>');
}

// Function to reset all selections
function resetSelections() {
    cardData.forEach(card => {
        card.player = 'none';
    });
    saveCardData(); // Save updated card data to Firestore
    currentFilter = null;
    filterButtons.forEach(btn => btn.classList.remove('active'));
    displayAllCards(currentType);
}
