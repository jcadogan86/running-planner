class LocationService {
    constructor() {
        console.log('LocationService constructor called');
        this.currentPosition = null;
    }

    async searchLocation(query) {
        console.log('LocationService: searchLocation called with query:', query);
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=6404e2a5133993587e9a508143663afc`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Geocoding response:', data);

            if (data && data.length > 0) {
                const location = data[0];
                await this.updateLocation({
                    coords: {
                        latitude: location.lat,
                        longitude: location.lon
                    }
                });
            } else {
                alert('Location not found. Please try another search.');
            }
        } catch (error) {
            console.error('Error in searchLocation:', error);
            alert('Error searching for location. Please try again.');
        }
    }

    async detectLocation() {
        console.log('LocationService: detectLocation called');
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            
            console.log('Geolocation position received:', position);
            await this.updateLocation(position);
        } catch (error) {
            console.error('Error in detectLocation:', error);
            alert('Unable to get your location. Please try searching instead.');
        }
    }

    async updateLocation(position) {
        console.log('LocationService: updateLocation called with position:', position);
        this.currentPosition = position;

        try {
            // Update location name
            const locationName = await this.getLocationName(position.coords);
            console.log('Location name received:', locationName);
            
            // Update location display through AppUI
            if (window.app) {
                window.app.updateLocationDisplay(locationName);
            }

            // Get weather data
            const weatherData = await window.weatherService.getWeatherData({
                lat: position.coords.latitude,
                lon: position.coords.longitude
            });

            console.log('Weather data received:', weatherData);
            
            // Update the UI with new weather data
            if (window.app) {
                window.app.updateWeatherData(weatherData);
            }
        } catch (error) {
            console.error('Error in updateLocation:', error);
            alert('Error updating weather data. Please try again.');
        }
    }

    async getLocationName(coords) {
        console.log('LocationService: getLocationName called with coords:', coords);
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=6404e2a5133993587e9a508143663afc`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Location API response:', data);

            const locationName = `${data.name}, ${data.sys.country}`;
            console.log('Location name formatted:', locationName);
            return locationName;
        } catch (error) {
            console.error('Error in getLocationName:', error);
            return 'Unknown Location';
        }
    }
}

// Make sure locationService is available globally
console.log('Creating global LocationService instance');
window.locationService = new LocationService(); 