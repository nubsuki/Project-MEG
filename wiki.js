const cards = document.querySelectorAll('.card');

const cardOptions = {
    1: [
        { name: 'Valorant', url: 'valorant.html' },
        { name: 'Honkai Star Rail', url: 'starrail.html' },
        { name: 'Extensions', url: 'extension.html' }
    ],
    2: [
        { name: 'Screen Capture', url: 'software.html' },
        { name: 'Editing Softwares', url: 'software.html' },
        { name: 'Extensions', url: 'extension.html' }
    ],
    3: [
        { name: 'Option 3-1', url: 'option3-1.html' },
        { name: 'Option 3-2', url: 'option3-2.html' }
    ]
};

cards.forEach(card => {
    const searchBar = card.querySelector('.search-bar');
    const searchResults = card.querySelector('.search-results');
    const cardId = card.dataset.cardId;

    searchBar.addEventListener('input', () => {
        const query = searchBar.value.trim().toLowerCase();
        searchResults.innerHTML = '';

        if (query === '') {
            return;
        }

        const options = cardOptions[cardId];
        const filteredOptions = options.filter(option => option.name.toLowerCase().includes(query));

        filteredOptions.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option.name;
            li.addEventListener('click', () => {
                window.location.href = option.url; // Navigate to the specified URL
            });
            searchResults.appendChild(li);
        });
    });
});
