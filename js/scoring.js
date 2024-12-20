class ScoreCalculator {
    constructor(preferences) {
        this.preferences = preferences;
    }

    calculateRunnabilityScore(weatherData) {
        let totalScore = 0;
        let totalWeight = 0;

        // Get enabled parameters from preferences
        const enabledParams = Object.entries(weatherParameters)
            .filter(([_, param]) => param.enabled);

        // Calculate score for each enabled parameter
        enabledParams.forEach(([key, param]) => {
            const value = this.getWeatherValue(weatherData, key);
            const paramScore = this.getParameterScore(key, value);
            totalScore += paramScore * param.weight;
            totalWeight += param.weight;
        });

        // Normalize score to 0-100
        return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    }

    getParameterScore(parameter, value) {
        const ranges = weatherParameters[parameter].ranges;
        
        // Check each range category
        if (this.isInRange(value, ranges.great)) return 1.0;
        if (this.isInRange(value, ranges.good)) return 0.75;
        if (this.isInRange(value, ranges.okay)) return 0.5;
        return 0.25; // poor
    }

    isInRange(value, range) {
        return value >= range.min && value <= range.max;
    }

    getWeatherValue(weatherData, parameter) {
        // Map weather data parameters to their corresponding values
        const mappings = {
            temperature: weatherData.temperature,
            windSpeed: weatherData.windSpeed,
            precipitation: weatherData.precipitation,
            humidity: weatherData.humidity,
            visibility: this.convertVisibilityToKm(weatherData.visibility),
            uvIndex: weatherData.uvIndex
        };
        return mappings[parameter];
    }

    convertVisibilityToKm(visibilityCode) {
        // Met Office visibility codes to km conversion
        const visibilityMap = {
            UN: 0, // Unknown
            VP: 0.1, // Very Poor
            PO: 1, // Poor
            MO: 4, // Moderate
            GO: 10, // Good
            VG: 20, // Very Good
            EX: 40 // Excellent
        };
        return visibilityMap[visibilityCode] || 0;
    }

    getRunnabilityCategory(score) {
        if (score >= 80) return { category: 'Excellent', class: 'excellent' };
        if (score >= 60) return { category: 'Good', class: 'good' };
        if (score >= 40) return { category: 'Fair', class: 'fair' };
        return { category: 'Poor', class: 'poor' };
    }

    processTimeSlots(weatherDataArray) {
        return weatherDataArray.map(data => ({
            ...data,
            score: this.calculateRunnabilityScore(data),
            get category() {
                return this.getRunnabilityCategory(this.score);
            }
        }))
        .sort((a, b) => b.score - a.score); // Sort by score descending
    }
}

// Initialize scoring system and add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const scoreCalculator = new ScoreCalculator(weatherParameters);
    
    // Listen for weather updates
    document.addEventListener('weatherUpdated', (event) => {
        const processedData = scoreCalculator.processTimeSlots(event.detail);
        displayResults(processedData);
    });
});

// Function to display results
function displayResults(processedData) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ''; // Clear previous results

    processedData.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot ${slot.category.class}`;
        
        slotElement.innerHTML = `
            <div class="time">${slot.date} ${slot.time}</div>
            <div class="score">Score: ${Math.round(slot.score)}%</div>
            <div class="category">${slot.category.category}</div>
            <div class="weather-details">
                🌡️ ${slot.temperature}°C
                💨 ${slot.windSpeed} mph
                ☔ ${slot.precipitation}%
            </div>
        `;

        resultsContainer.appendChild(slotElement);
    });
} 