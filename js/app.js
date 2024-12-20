class AppUI {
    constructor() {
        console.log('AppUI constructor called');
        this.weatherData = null;
        this.currentSort = 'time';
        this.preferencesManager = new PreferencesManager();
        this.ignoreRain = false;
        
        // Create controls first
        this.createControlsUI();
        this.setupTabEventListeners();
        this.setupSearchListeners();
    }

    createControlsUI() {
        console.log('Creating controls UI');
        // Get or create controls section
        const controlsSection = document.getElementById('controlsSection');
        if (!controlsSection) {
            console.error('Controls section not found');
            return;
        }

        // Clear existing content
        controlsSection.innerHTML = '';
        
        // Create controls section
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-section';
        
        // Create preferences section
        const preferencesSection = document.createElement('div');
        preferencesSection.className = 'preferences-section';
        preferencesSection.innerHTML = `
            <h3>Weather Preferences</h3>
            <div class="preference-toggle-container">
                <label>
                    <input type="checkbox" id="considerTemperature" class="preference-toggle" checked>
                    Consider Temperature
                </label>
            </div>
            <div class="preference-toggle-container">
                <label>
                    <input type="checkbox" id="considerWind" class="preference-toggle" checked>
                    Consider Wind
                </label>
            </div>
            <div class="preference-toggle-container">
                <label>
                    <input type="checkbox" id="considerRain" class="preference-toggle" checked>
                    Consider Rain
                </label>
            </div>
        `;

        // Create sort controls
        const sortControls = document.createElement('div');
        sortControls.className = 'sort-controls';
        sortControls.innerHTML = `
            <label>Sort by:</label>
            <select id="sortPreference" class="sort-select">
                <option value="score">Best Overall Score</option>
                <option value="wind">Lowest Wind Speed</option>
                <option value="temp">Most Comfortable Temperature</option>
                <option value="rain">Lowest Rain Chance</option>
            </select>
        `;

        // Add both sections to controls container
        controlsContainer.appendChild(preferencesSection);
        controlsContainer.appendChild(sortControls);

        // Add to page
        controlsSection.appendChild(controlsContainer);

        // Add event listener for sort control
        const sortPreference = document.getElementById('sortPreference');
        if (sortPreference) {
            sortPreference.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.displayResults();
            });
        }
    }

    updateLocationDisplay(locationName) {
        console.log('Updating location display:', locationName);
        const locationDisplay = document.getElementById('locationDisplay');
        if (locationDisplay) {
            locationDisplay.textContent = locationName;
        }
    }

    setupTabEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                const targetTab = document.getElementById(`${button.dataset.tab}-tab`);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }

    setupSearchListeners() {
        // Search button click
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => this.handleSearch());
        }

        // My Location button click
        const useLocationButton = document.getElementById('useLocationButton');
        if (useLocationButton) {
            useLocationButton.addEventListener('click', () => {
                console.log('Getting current location...');
                window.locationService.detectLocation();
            });
        }

        // Enter key in search input
        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    }

    handleSearch() {
        const locationInput = document.getElementById('locationInput');
        const searchTerm = locationInput?.value?.trim();
        
        if (searchTerm) {
            console.log('Searching for location:', searchTerm);
            window.locationService.searchLocation(searchTerm);
        } else {
            console.log('No search term provided');
        }
    }

    updateWeatherData(data) {
        console.log('Updating weather data:', data);
        this.weatherData = data;
        this.displayResults();
    }

    displayResults() {
        if (!this.weatherData) {
            console.log('No weather data available');
            const existingSort = document.querySelector('.sort-container');
            if (existingSort) {
                existingSort.remove();
            }
            return;
        }

        this.createSortDropdown();

        // Group data by date
        const groupedData = this.groupByDate(this.weatherData);
        const dates = Object.keys(groupedData);

        // Update each tab
        ['today', 'tomorrow', 'day3'].forEach((tabId, index) => {
            const date = dates[index];
            if (!date) return;

            const container = document.getElementById(`${tabId}-tab`);
            if (!container) return;

            // Clear previous content
            container.innerHTML = '';

            // Get and filter data for this date
            let dayData = groupedData[date].filter(timeSlot => {
                const hour = parseInt(timeSlot.time.split(':')[0]);
                // Keep hours between 5:00 and 21:59 (5am to 9:59pm)
                return hour >= 5 && hour < 22;
            });

            // Sort filtered data
            dayData = this.sortData(dayData, this.currentSort || 'time');

            // Create weather grid
            const weatherGrid = document.createElement('div');
            weatherGrid.className = 'weather-grid';

            dayData.forEach(timeSlot => {
                const score = window.weatherService.calculateRunnabilityScore(
                    timeSlot, 
                    {
                        ...this.preferencesManager.getPreferences(),
                        considerRain: !this.ignoreRain
                    }
                );
                const category = window.weatherService.getRunnabilityCategory(score);

                const slot = document.createElement('div');
                slot.className = 'weather-slot';
                slot.innerHTML = `
                    <div class="time">${timeSlot.time}</div>
                    <div class="score ${category.toLowerCase()}">${score}/100 - ${category}</div>
                    <div class="weather-details">
                        <img src="${timeSlot.icon}" alt="${timeSlot.description}" class="weather-icon">
                        <div class="temp">${timeSlot.temperature}°C</div>
                        <div class="weather-detail">Feels like: ${timeSlot.feelsLike}°C</div>
                        <div class="weather-detail">Wind: ${timeSlot.windSpeed} mph</div>
                        <div class="weather-detail">Rain: ${timeSlot.precipitation}%</div>
                        <div class="weather-detail">Humidity: ${timeSlot.humidity}%</div>
                    </div>
                `;
                weatherGrid.appendChild(slot);
            });

            container.appendChild(weatherGrid);
        });
    }

    sortData(data, sortType) {
        switch (sortType) {
            case 'wind':
                return [...data].sort((a, b) => a.windSpeed - b.windSpeed);
            case 'score':
                return [...data].sort((a, b) => {
                    const scoreA = window.weatherService.calculateRunnabilityScore(a, this.preferencesManager.getPreferences());
                    const scoreB = window.weatherService.calculateRunnabilityScore(b, this.preferencesManager.getPreferences());
                    return scoreB - scoreA; // Highest first
                });
            case 'time':
            default:
                return [...data].sort((a, b) => {
                    const timeA = parseInt(a.time.split(':')[0]);
                    const timeB = parseInt(b.time.split(':')[0]);
                    return timeA - timeB;
                });
        }
    }

    groupByDate(data) {
        return data.reduce((groups, item) => {
            const date = item.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(item);
            return groups;
        }, {});
    }

    createSortDropdown() {
        // Remove any existing sort container first
        const existingSort = document.querySelector('.sort-container');
        if (existingSort) {
            existingSort.remove();
        }

        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-container';
        sortContainer.innerHTML = `
            <div class="sort-controls">
                <select id="sortResults" class="sort-select">
                    <option value="time" ${this.currentSort === 'time' ? 'selected' : ''}>Sort by Time</option>
                    <option value="wind" ${this.currentSort === 'wind' ? 'selected' : ''}>Sort by Lowest Wind Speed</option>
                    <option value="score" ${this.currentSort === 'score' ? 'selected' : ''}>Sort by Best Score</option>
                </select>
                <label class="rain-toggle">
                    <input type="checkbox" id="ignoreRain" ${this.ignoreRain ? 'checked' : ''}>
                    I don't mind the rain
                </label>
            </div>
        `;

        // Insert after tab container
        const tabContainer = document.querySelector('.tab-container');
        if (tabContainer) {
            tabContainer.insertAdjacentElement('afterend', sortContainer);
        }

        // Add event listeners
        document.getElementById('sortResults')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.displayResults();
        });

        document.getElementById('ignoreRain')?.addEventListener('change', (e) => {
            this.ignoreRain = e.target.checked;
            this.displayResults();
        });
    }
}

// Add some CSS for the weather display
const style = document.createElement('style');
style.textContent = `
    .weather-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        padding: 16px;
    }

    .weather-slot {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .time {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 8px;
    }

    .score {
        padding: 4px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
        color: white;
        text-align: center;
    }

    .score.excellent { background: #4CAF50; }
    .score.good { background: #8BC34A; }
    .score.fair { background: #FFC107; }
    .score.poor { background: #FF9800; }
    .score.bad { background: #F44336; }

    .weather-details {
        display: grid;
        gap: 4px;
    }

    .weather-icon {
        width: 50px;
        height: 50px;
        margin: 0 auto;
    }

    .temp {
        font-size: 1.1em;
        text-align: center;
    }

    .weather-detail {
        color: #666;
        font-size: 0.9em;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Creating AppUI instance');
    window.app = new AppUI();
}); 