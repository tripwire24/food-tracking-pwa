// Food Tracking PWA - AI Vision Processing

class AIVision {
    static API_ENDPOINTS = {
        VISION: '/api/vision/analyze',
        TEXT_ANALYSIS: '/api/text/analyze',
        NUTRITION_LOOKUP: '/api/nutrition/lookup'
    };

    // Check if AI vision is available
    static isAvailable() {
        // In a real implementation, this would check for API availability
        return true;
    }

    // Analyze food from image
    static async analyzeFood(imageFile) {
        try {
            // Mock implementation - replace with actual API call
            console.log('Analyzing food image:', imageFile.name);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock nutrition data - replace with real API response
            const mockData = {
                detectedFoods: [
                    { name: 'Chicken Breast', confidence: 85 },
                    { name: 'Broccoli', confidence: 78 },
                    { name: 'Brown Rice', confidence: 72 }
                ],
                calories: 420,
                protein: 35,
                carbs: 45,
                fat: 8,
                fiber: 6,
                sugar: 3,
                portionSize: '1 serving',
                confidence: 80
            };
            
            // Cache the result
            const cacheKey = `image_${await this.generateImageHash(imageFile)}`;
            await FoodStorage.cacheNutritionData(cacheKey, mockData);
            
            return mockData;
            
        } catch (error) {
            console.error('AI Vision analysis failed:', error);
            throw new Error('Failed to analyze food image');
        }
    }

    // Analyze food from text description
    static async analyzeTextDescription(description) {
        try {
            console.log('Analyzing text description:', description);
            
            // Check cache first
            const cacheKey = `text_${this.hashString(description)}`;
            const cached = await FoodStorage.getCachedNutritionData(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Mock implementation - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simple keyword-based mock analysis
            const mockData = this.generateMockNutritionFromText(description);
            
            // Cache the result
            await FoodStorage.cacheNutritionData(cacheKey, mockData);
            
            return mockData;
            
        } catch (error) {
            console.error('Text analysis failed:', error);
            throw new Error('Failed to analyze food description');
        }
    }

    // Generate mock nutrition data from text
    static generateMockNutritionFromText(description) {
        const lowerDesc = description.toLowerCase();
        let calories = 300;
        let protein = 20;
        let carbs = 30;
        let fat = 10;
        
        // Adjust based on keywords
        if (lowerDesc.includes('chicken') || lowerDesc.includes('beef') || lowerDesc.includes('fish')) {
            protein += 15;
            calories += 100;
        }
        
        if (lowerDesc.includes('rice') || lowerDesc.includes('pasta') || lowerDesc.includes('bread')) {
            carbs += 20;
            calories += 80;
        }
        
        if (lowerDesc.includes('salad') || lowerDesc.includes('vegetables') || lowerDesc.includes('broccoli')) {
            carbs -= 10;
            calories -= 50;
            protein -= 5;
        }
        
        if (lowerDesc.includes('oil') || lowerDesc.includes('butter') || lowerDesc.includes('nuts')) {
            fat += 10;
            calories += 90;
        }
        
        return {
            detectedFoods: [
                { name: 'Mixed Foods', confidence: 75 }
            ],
            calories: Math.max(50, calories),
            protein: Math.max(0, protein),
            carbs: Math.max(0, carbs),
            fat: Math.max(0, fat),
            fiber: Math.floor(carbs * 0.1),
            sugar: Math.floor(carbs * 0.15),
            portionSize: '1 serving',
            confidence: 75,
            source: 'text_analysis'
        };
    }

    // Generate hash for image (simplified)
    static async generateImageHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashArray = Array.from(new Uint8Array(arrayBuffer.slice(0, 1000)));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }

    // Simple string hash
    static hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Get nutrition info for specific food item
    static async lookupNutritionInfo(foodName, portion = '100g') {
        try {
            const cacheKey = `nutrition_${foodName.toLowerCase()}_${portion}`;
            const cached = await FoodStorage.getCachedNutritionData(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Mock nutrition lookup - replace with real database/API
            const nutritionData = this.getMockNutritionData(foodName);
            
            await FoodStorage.cacheNutritionData(cacheKey, nutritionData);
            return nutritionData;
            
        } catch (error) {
            console.error('Nutrition lookup failed:', error);
            throw new Error('Failed to lookup nutrition information');
        }
    }

    // Mock nutrition database
    static getMockNutritionData(foodName) {
        const nutritionDB = {
            'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
            'brown rice': { calories: 123, protein: 2.6, carbs: 23, fat: 0.9 },
            'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
            'salmon': { calories: 208, protein: 20, carbs: 0, fat: 12 },
            'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15 },
            'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }
        };
        
        const key = foodName.toLowerCase();
        const baseData = nutritionDB[key] || { calories: 100, protein: 5, carbs: 15, fat: 3 };
        
        return {
            ...baseData,
            fiber: Math.floor(baseData.carbs * 0.1),
            sugar: Math.floor(baseData.carbs * 0.3),
            portionSize: '100g'
        };
    }

    // Analyze portion size from image
    static async estimatePortionSize(imageFile, foodType) {
        // Mock portion estimation - in reality this would use computer vision
        return {
            estimatedWeight: '150g',
            confidence: 70,
            method: 'visual_estimation'
        };
    }

    // Batch analyze multiple foods in one image
    static async analyzeBatchFoods(imageFile) {
        try {
            const foods = await this.analyzeFood(imageFile);
            
            // Mock multiple food detection
            if (foods.detectedFoods && foods.detectedFoods.length > 1) {
                const batchResults = [];
                
                for (const food of foods.detectedFoods) {
                    const nutrition = await this.lookupNutritionInfo(food.name);
                    batchResults.push({
                        food: food.name,
                        confidence: food.confidence,
                        nutrition
                    });
                }
                
                return batchResults;
            }
            
            return [{ food: 'Unknown', confidence: 50, nutrition: foods }];
            
        } catch (error) {
            console.error('Batch analysis failed:', error);
            throw new Error('Failed to analyze multiple foods');
        }
    }

    // Get nutritional recommendations based on analysis
    static getNutritionalInsights(nutritionData, userGoals = {}) {
        const insights = [];
        
        // Calorie insights
        if (userGoals.calories && nutritionData.calories > userGoals.calories * 0.3) {
            insights.push({
                type: 'warning',
                message: 'This meal is quite high in calories for a single serving.'
            });
        }
        
        // Protein insights
        if (nutritionData.protein > 25) {
            insights.push({
                type: 'positive',
                message: 'Great protein content! This will help with muscle maintenance.'
            });
        }
        
        // Fiber insights
        if (nutritionData.fiber < 3) {
            insights.push({
                type: 'suggestion',
                message: 'Consider adding more fiber-rich foods like vegetables or whole grains.'
            });
        }
        
        return insights;
    }

    // Format nutrition data for display
    static formatNutritionData(data) {
        return {
            calories: Math.round(data.calories || 0),
            macros: {
                protein: Math.round((data.protein || 0) * 10) / 10,
                carbs: Math.round((data.carbs || 0) * 10) / 10,
                fat: Math.round((data.fat || 0) * 10) / 10
            },
            micros: {
                fiber: Math.round((data.fiber || 0) * 10) / 10,
                sugar: Math.round((data.sugar || 0) * 10) / 10
            },
            confidence: data.confidence || 0,
            portionSize: data.portionSize || '1 serving'
        };
    }
}