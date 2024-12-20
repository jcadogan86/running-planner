class WeatherService {
    constructor() {
        console.log('WeatherService constructor called');
    }

    async getWeatherData(position) {
        console.log('Fetching weather data for position:', position);
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/forecast.json?q=${position.lat},${position.lon}&days=3&key=33caf145ffd246e7b08160603241912&aqi=no`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Weather data received:', data);
            return this.processWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    processWeatherData(data) {
        console.log('Raw weather data:', {
            current: data.current,
            forecast: data.forecast.forecastday[0]
        });

        // Helper function to format time
        const formatTime = (timeStr) => {
            const date = new Date(timeStr);
            return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        };

        // Process current weather
        const results = [{
            date: new Date().toISOString().split('T')[0],
            time: formatTime(new Date()),
            temperature: data.current.temp_c,
            feelsLike: data.current.feelslike_c,
            windSpeed: data.current.wind_mph,
            windDirection: data.current.wind_degree,
            precipitation: data.current.precip_mm > 0 ? 
                data.forecast.forecastday[0].day.daily_chance_of_rain : 
                data.forecast.forecastday[0].hour[new Date().getHours()].chance_of_rain,
            rainIntensity: data.current.precip_mm,
            humidity: data.current.humidity,
            visibility: data.current.vis_km,
            description: data.current.condition.text,
            icon: data.current.condition.icon,
            sunTimes: {
                sunrise: data.forecast.forecastday[0].astro.sunrise,
                sunset: data.forecast.forecastday[0].astro.sunset
            }
        }];

        // Process hourly forecast data
        const forecastData = data.forecast.forecastday.flatMap(day => 
            day.hour
                .filter(hour => new Date(hour.time) > new Date())
                .map(hour => ({
                    date: day.date,
                    time: formatTime(hour.time),
                    temperature: hour.temp_c,
                    feelsLike: hour.feelslike_c,
                    windSpeed: hour.wind_mph,
                    windDirection: hour.wind_degree,
                    precipitation: hour.chance_of_rain,
                    rainIntensity: hour.precip_mm,
                    humidity: hour.humidity,
                    visibility: hour.vis_km,
                    description: hour.condition.text,
                    icon: hour.condition.icon,
                    sunTimes: {
                        sunrise: day.astro.sunrise,
                        sunset: day.astro.sunset
                    }
                }))
        );

        const allResults = [...results, ...forecastData];
        console.log('Processed weather data:', allResults[0]);
        return allResults;
    }

    calculateRunnabilityScore(timeSlot, preferences) {
        let score = 100;
        
        if (preferences.considerTemperature) {
            // Temperature scoring (ideal range 10-20°C)
            const temp = timeSlot.temperature;
            if (temp < 5 || temp > 25) score -= 30;
            else if (temp < 10 || temp > 20) score -= 15;
        }
        
        if (preferences.considerWind) {
            // Wind scoring (penalize high winds)
            const wind = timeSlot.windSpeed;
            if (wind > 20) score -= 30;
            else if (wind > 15) score -= 20;
            else if (wind > 10) score -= 10;
        }
        
        if (preferences.considerRain) {
            // Rain scoring
            const rain = timeSlot.precipitation;
            if (rain > 50) score -= 30;
            else if (rain > 30) score -= 20;
            else if (rain > 10) score -= 10;
        }

        // Add humidity scoring (always considered)
        const humidity = timeSlot.humidity;
        const temp = timeSlot.temperature;

        // Calculate humidity impact based on temperature
        if (temp > 20) {
            // High temperature makes humidity more impactful
            if (humidity > 80) score -= 30;
            else if (humidity > 70) score -= 20;
            else if (humidity > 60) score -= 10;
        } else if (temp > 15) {
            // Moderate temperature
            if (humidity > 85) score -= 20;
            else if (humidity > 75) score -= 15;
            else if (humidity > 65) score -= 5;
        } else {
            // Lower temperatures - humidity less impactful
            if (humidity > 90) score -= 10;
            else if (humidity > 80) score -= 5;
        }
        
        return Math.max(0, score);
    }

    getRunnabilityCategory(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Poor';
        return 'Bad';
    }
}

// Make sure weatherService is available globally
console.log('Creating global WeatherService instance');
window.weatherService = new WeatherService(); 