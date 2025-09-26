// Food Tracking PWA - Storage Management

class FoodStorage {
    static DB_NAME = 'food-tracker-db';
    static DB_VERSION = 1;
    static STORES = {
        FOOD_ENTRIES: 'food-entries',
        USER_DATA: 'user-data',
        NUTRITION_CACHE: 'nutrition-cache'
    };

    // Initialize IndexedDB
    static async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Food entries store
                if (!db.objectStoreNames.contains(this.STORES.FOOD_ENTRIES)) {
                    const foodStore = db.createObjectStore(this.STORES.FOOD_ENTRIES, { 
                        keyPath: 'id' 
                    });
                    foodStore.createIndex('timestamp', 'timestamp');
                    foodStore.createIndex('date', 'date');
                }
                
                // User data store
                if (!db.objectStoreNames.contains(this.STORES.USER_DATA)) {
                    db.createObjectStore(this.STORES.USER_DATA, { 
                        keyPath: 'key' 
                    });
                }
                
                // Nutrition cache store
                if (!db.objectStoreNames.contains(this.STORES.NUTRITION_CACHE)) {
                    const cacheStore = db.createObjectStore(this.STORES.NUTRITION_CACHE, { 
                        keyPath: 'key' 
                    });
                    cacheStore.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    // Save food entry
    static async saveFoodEntry(entry) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.FOOD_ENTRIES], 'readwrite');
        const store = transaction.objectStore(this.STORES.FOOD_ENTRIES);
        
        // Add date for easier querying
        entry.date = new Date(entry.timestamp).toDateString();
        
        return new Promise((resolve, reject) => {
            const request = store.add(entry);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get today's nutrition totals
    static async getTodayNutrition() {
        const today = new Date().toDateString();
        const entries = await this.getFoodEntriesByDate(today);
        
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0
        };
        
        entries.forEach(entry => {
            const nutrition = entry.nutritionData || {};
            totals.calories += nutrition.calories || 0;
            totals.protein += nutrition.protein || 0;
            totals.carbs += nutrition.carbs || 0;
            totals.fat += nutrition.fat || 0;
            totals.fiber += nutrition.fiber || 0;
            totals.sugar += nutrition.sugar || 0;
        });
        
        return totals;
    }

    // Get food entries by date
    static async getFoodEntriesByDate(date) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.FOOD_ENTRIES], 'readonly');
        const store = transaction.objectStore(this.STORES.FOOD_ENTRIES);
        const index = store.index('date');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get all food history
    static async getFoodHistory(limit = 100) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.FOOD_ENTRIES], 'readonly');
        const store = transaction.objectStore(this.STORES.FOOD_ENTRIES);
        const index = store.index('timestamp');
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const results = [];
            let count = 0;
            
            request.onerror = () => reject(request.error);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    results.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    // Get dashboard data
    static async getDashboardData() {
        // Get last 7 days of data
        const weeklyData = {};
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const entries = await this.getFoodEntriesByDate(dateString);
            const dayTotal = entries.reduce((total, entry) => {
                return total + (entry.nutritionData?.calories || 0);
            }, 0);
            
            weeklyData[date.toLocaleDateString()] = dayTotal;
        }
        
        // Get today's macro breakdown
        const todayNutrition = await this.getTodayNutrition();
        const macroBreakdown = {
            protein: todayNutrition.protein * 4, // 4 cal per gram
            carbs: todayNutrition.carbs * 4,     // 4 cal per gram
            fat: todayNutrition.fat * 9          // 9 cal per gram
        };
        
        // Daily progress (example goals)
        const goals = {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 70
        };
        
        const dailyProgress = {
            calories: (todayNutrition.calories / goals.calories) * 100,
            protein: (todayNutrition.protein / goals.protein) * 100,
            carbs: (todayNutrition.carbs / goals.carbs) * 100,
            fat: (todayNutrition.fat / goals.fat) * 100
        };
        
        return {
            weeklyCalories: weeklyData,
            macroBreakdown,
            dailyProgress
        };
    }

    // Save user data
    static async saveUserData(key, data) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.USER_DATA], 'readwrite');
        const store = transaction.objectStore(this.STORES.USER_DATA);
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, data, timestamp: Date.now() });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get user data
    static async getUserData(key = 'profile') {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.USER_DATA], 'readonly');
        const store = transaction.objectStore(this.STORES.USER_DATA);
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.data || null);
        });
    }

    // Cache nutrition data
    static async cacheNutritionData(key, data) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.NUTRITION_CACHE], 'readwrite');
        const store = transaction.objectStore(this.STORES.NUTRITION_CACHE);
        
        return new Promise((resolve, reject) => {
            const request = store.put({ 
                key, 
                data, 
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get cached nutrition data
    static async getCachedNutritionData(key) {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.NUTRITION_CACHE], 'readonly');
        const store = transaction.objectStore(this.STORES.NUTRITION_CACHE);
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.expires > Date.now()) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
        });
    }

    // Clear old cache entries
    static async clearExpiredCache() {
        const db = await this.initDB();
        const transaction = db.transaction([this.STORES.NUTRITION_CACHE], 'readwrite');
        const store = transaction.objectStore(this.STORES.NUTRITION_CACHE);
        const index = store.index('timestamp');
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor();
            request.onerror = () => reject(request.error);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.expires <= Date.now()) {
                        cursor.delete();
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });
    }

    // Export data
    static async exportData() {
        const foodEntries = await this.getFoodHistory(1000);
        const userData = await this.getUserData();
        
        return {
            foodEntries,
            userData,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Import data
    static async importData(data) {
        if (!data.foodEntries) return false;
        
        const db = await this.initDB();
        
        // Import food entries
        for (const entry of data.foodEntries) {
            try {
                await this.saveFoodEntry(entry);
            } catch (error) {
                console.warn('Failed to import entry:', entry.id, error);
            }
        }
        
        // Import user data
        if (data.userData) {
            await this.saveUserData('profile', data.userData);
        }
        
        return true;
    }
}