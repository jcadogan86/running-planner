class PreferencesManager {
    constructor() {
        this.preferences = {
            considerTemperature: true,
            considerWind: true,
            considerRain: true
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Get all toggle inputs
        const temperatureToggle = document.getElementById('considerTemperature');
        const windToggle = document.getElementById('considerWind');
        const rainToggle = document.getElementById('considerRain');

        if (temperatureToggle) {
            temperatureToggle.checked = this.preferences.considerTemperature;
            temperatureToggle.addEventListener('change', () => {
                console.log('Temperature preference changed:', temperatureToggle.checked);
                this.preferences.considerTemperature = temperatureToggle.checked;
                this.refreshDisplay();
            });
        }

        if (windToggle) {
            windToggle.checked = this.preferences.considerWind;
            windToggle.addEventListener('change', () => {
                console.log('Wind preference changed:', windToggle.checked);
                this.preferences.considerWind = windToggle.checked;
                this.refreshDisplay();
            });
        }

        if (rainToggle) {
            rainToggle.checked = this.preferences.considerRain;
            rainToggle.addEventListener('change', () => {
                console.log('Rain preference changed:', rainToggle.checked);
                this.preferences.considerRain = rainToggle.checked;
                this.refreshDisplay();
            });
        }
    }

    refreshDisplay() {
        console.log('Refreshing display with new preferences:', this.preferences);
        if (window.app && window.app.weatherData) {
            window.app.displayResults();
        }
    }

    getPreferences() {
        return this.preferences;
    }
} 