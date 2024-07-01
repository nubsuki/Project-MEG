const cards = document.querySelectorAll('.card');

const cardOptions = {
    1: [
        { name: 'Valorant', url: 'starrail.html' },
        { name: 'Honkai Star Rail', url: 'starrail.html' },
        { name: 'Extensions', url: 'starrail.html' }
    ],
    2: [
        { name: 'Screen Capture', url: 'record.html' },
        { name: 'Editing Softwares', url: 'record.html' },
        { name: 'Extensions', url: 'record.html' }
    ],
    3: [
        { name: 'PiratedGames', url: 'option3-1.html' },
        { name: 'PiratedSoftwares', url: 'option3-2.html' }
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
