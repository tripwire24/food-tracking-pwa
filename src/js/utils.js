// Food Tracking PWA - Utility Functions

class Utils {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format date for display
    static formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    // Format bytes to human readable
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Debounce function
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Check if object is empty
    static isEmpty(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Calculate BMI
    static calculateBMI(weight, height) {
        // weight in kg, height in meters
        return (weight / (height * height)).toFixed(1);
    }

    // Calculate daily calorie needs (simple formula)
    static calculateDailyCalories(weight, height, age, gender, activityLevel) {
        let bmr;
        
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * (height * 100) - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * (height * 100) - 5 * age - 161;
        }

        // Activity level multipliers
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            heavy: 1.725,
            extreme: 1.9
        };

        return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
    }

    // Format nutrition value with unit
    static formatNutrition(value, unit = 'g') {
        if (typeof value !== 'number') return '0' + unit;
        return value.toFixed(1) + unit;
    }

    // Calculate percentage of daily value
    static calculatePercentDV(value, dailyValue) {
        if (!dailyValue || dailyValue === 0) return 0;
        return Math.round((value / dailyValue) * 100);
    }

    // Convert units
    static convertWeight(value, fromUnit, toUnit) {
        const conversions = {
            kg: { lb: 2.20462, g: 1000, oz: 35.274 },
            lb: { kg: 0.453592, g: 453.592, oz: 16 },
            g: { kg: 0.001, lb: 0.00220462, oz: 0.035274 },
            oz: { kg: 0.0283495, lb: 0.0625, g: 28.3495 }
        };

        if (fromUnit === toUnit) return value;
        return value * conversions[fromUnit][toUnit];
    }

    // Generate color palette for charts
    static generateColorPalette(count) {
        const colors = [
            '#2E7D32', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
            '#FF6F00', '#FFA726', '#FFB74D', '#FFCC02', '#FFD54F',
            '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB',
            '#F44336', '#EF5350', '#E57373', '#EF9A9A', '#FFCDD2'
        ];
        
        const palette = [];
        for (let i = 0; i < count; i++) {
            palette.push(colors[i % colors.length]);
        }
        return palette;
    }

    // Check device capabilities
    static getDeviceInfo() {
        return {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
            isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            hasFileAPI: 'File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window,
            hasOfflineSupport: 'serviceWorker' in navigator,
            hasNotificationSupport: 'Notification' in window,
            hasLocationSupport: 'geolocation' in navigator
        };
    }

    // Storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage:', error);
            return false;
        }
    }

    // Image utilities
    static resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Network utilities
    static async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    // Performance utilities
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Animation utilities
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    static animate(from, to, duration, callback, easing = Utils.easeInOutCubic) {
        const start = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const value = from + (to - from) * easedProgress;
            
            callback(value);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // Error handling
    static logError(error, context = '') {
        console.error(`Error ${context}:`, error);
        
        // In production, you might want to send this to an error tracking service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false,
                custom_map: { context }
            });
        }
    }

    // URL utilities
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static updateURL(path, state = {}) {
        if (window.history && window.history.pushState) {
            window.history.pushState(state, '', path);
        }
    }
}