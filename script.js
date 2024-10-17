// Variables for theme toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Your web app's Firebase configuration (Replace with your own Firebase project configuration)
const firebaseConfig = {
  apiKey: "AIzaSyDzW7DnZHz37xOyI6Nyp1SSq9gT1PxYjLI",
  authDomain: "arcs-card-tracker-aee70.firebaseapp.com",
  projectId: "arcs-card-tracker-aee70",
  storageBucket: "arcs-card-tracker-aee70.appspot.com",
  messagingSenderId: "1002391730061",
  appId: "1:1002391730061:web:b51f03c462f55dae476fc4",
  measurementId: "G-RVK40GKC8K"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore


// Variables for game hosting/joining
const hostGameBtn = document.getElementById('host-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const gamecodeInput = document.getElementById('gamecode-input');

let gameCode = ''; // The current game code

// Generate a random game code
function generateGameCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase(); // Random 6-character code
}

// Host a game (create a new session)
hostGameBtn.addEventListener('click', async () => {
    gameCode = generateGameCode(); // Generate a new game code

    try {
        // Create a new game document in Firestore
        await setDoc(doc(db, 'games', gameCode), {
            cardData: cardData, // Save current card state
            timestamp: new Date() // Store timestamp for session creation
        });

        alert(`Game hosted! Your game code is: ${gameCode}`);
        // Now the host can continue to update the game state
    } catch (error) {
        console.error('Error hosting game:', error);
    }
});

// Join a game (join an existing session)
joinGameBtn.addEventListener('click', async () => {
    const enteredCode = gamecodeInput.value.toUpperCase();

    try {
        // Fetch the game document from Firestore
        const gameDoc = await getDoc(doc(db, 'games', enteredCode));

        if (gameDoc.exists()) {
            cardData = gameDoc.data().cardData; // Load the game state from Firestore
            gameCode = enteredCode; // Set the current game code
            initializeApp(); // Re-initialize the app with the fetched card data
            alert(`Joined game with code: ${gameCode}`);
        } else {
            alert('Invalid game code. Please try again.');
        }
    } catch (error) {
        console.error('Error joining game:', error);
    }
});

// Function to sync card assignments to Firestore
async function syncCardAssignments() {
    if (gameCode) {
        try {
            await updateDoc(doc(db, 'games', gameCode), {
                cardData: cardData
            });
            console.log('Card assignments synced!');
        } catch (error) {
            console.error('Error syncing card assignments:', error);
        }
    }
}

// Call this function whenever card assignments change
// Example: After assigning a card to a player, call syncCardAssignments();

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

// Card data will be loaded from cards.json
let cardData = [];

// Load card data from JSON file
fetch('cards.json')
    .then(response => response.json())
    .then(data => {
        // Load from localStorage if available
        const savedData = localStorage.getItem('cardData');
        if (savedData) {
            cardData = JSON.parse(savedData);
        } else {
            cardData = data.cards;
        }
        initializeApp();
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

    cards.forEach((card, index) => {
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
        description.style.display = card.player !== 'none' ? 'block' : 'none';
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
        
                // Save updated card data to localStorage
                localStorage.setItem('cardData', JSON.stringify(cardData));
        
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
        // Add any other phrases you want to bold
    ];

    const escapedPhrases = phrasesToBold.map(phrase => phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const pattern = '\\b(' + escapedPhrases.join('|') + ')';
    const regex = new RegExp(pattern, 'g');

    const formattedText = text.replace(regex, '<strong>$1</strong>');
    return formattedText;
} 

// Function to reset all selections
function resetSelections() {
    cardData.forEach(card => {
        card.player = 'none';
    });
    localStorage.removeItem('cardData'); // Clear saved data
    currentFilter = null;
    filterButtons.forEach(btn => btn.classList.remove('active'));
    displayAllCards(currentType);
}
