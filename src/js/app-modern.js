// Modern Food Tracking PWA
class NutriTrackApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        console.log('🥗 NutriTrack initializing...');
        this.setupBottomNavigation();
        this.setupPageButtons();
        this.setupServiceWorker();
        this.showPage('home');
        console.log('✅ NutriTrack ready!');
    }

    // Bottom Navigation Setup
    setupBottomNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    // Update active state
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                    
                    // Show page
                    this.showPage(page);
                }
            });
        });
    }

    // Setup page-specific buttons
    setupPageButtons() {
        // Quick actions on home
        document.getElementById('quick-capture-btn')?.addEventListener('click', () => {
            this.showPage('capture');
            document.querySelector('[data-page="capture"]').classList.add('active');
        });

        document.getElementById('view-dashboard-btn')?.addEventListener('click', () => {
            this.showPage('dashboard');
            document.querySelector('[data-page="dashboard"]').classList.add('active');
        });

        // Capture page buttons
        document.getElementById('camera-btn')?.addEventListener('click', () => this.openCamera());
        document.getElementById('upload-btn')?.addEventListener('click', () => this.openFileUpload());
        document.getElementById('text-input-btn')?.addEventListener('click', () => this.openTextInput());

        // File input
        const fileInput = document.getElementById('file-input');
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files?.[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    // Page Navigation
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Update nav
            this.updateNavigation(pageName);
            
            // Load page content
            this.loadPageContent(pageName);
        }
    }

    updateNavigation(activePage) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    loadPageContent(pageName) {
        switch (pageName) {
            case 'home':
                this.updateTodaySummary();
                break;
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'history':
                this.loadHistory();
                break;
        }
    }

    // Food Capture Methods
    openCamera() {
        this.showNotification('Camera feature coming soon!', 'info');
    }

    openFileUpload() {
        document.getElementById('file-input')?.click();
    }

    openTextInput() {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            captureArea.innerHTML = `
                <div class="card">
                    <h3 class="result-header">Describe Your Food</h3>
                    <textarea id="food-description" class="input" 
                        placeholder="e.g., Grilled chicken breast with steamed broccoli" 
                        rows="4"></textarea>
                    <button id="analyze-text-btn" class="btn btn-primary" style="margin-top: 1rem;">
                        Analyze Food
                    </button>
                </div>
            `;

            document.getElementById('analyze-text-btn')?.addEventListener('click', () => {
                const description = document.getElementById('food-description').value.trim();
                if (description) {
                    this.analyzeTextDescription(description);
                }
            });
        }
    }

    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        this.showLoading('Analyzing your food...');

        try {
            const imageUrl = URL.createObjectURL(file);
            
            // Show image preview
            const captureArea = document.getElementById('capture-area');
            if (captureArea) {
                captureArea.innerHTML = `
                    <div class="card">
                        <img src="${imageUrl}" alt="Food preview" 
                            style="max-width: 100%; border-radius: 0.75rem;">
                    </div>
                `;
            }

            // Analyze with improved AI
            const nutritionData = await AIVision.analyzeFood(file);
            this.displayNutritionResults(nutritionData, imageUrl);

        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Failed to analyze image', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async analyzeTextDescription(description) {
        this.showLoading('Analyzing description...');

        try {
            const nutritionData = await AIVision.analyzeTextDescription(description);
            this.displayNutritionResults(nutritionData);
        } catch (error) {
            console.error('Analysis error:', error);
            this.showNotification('Failed to analyze description', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayNutritionResults(data, imageUrl = null) {
        const resultsContainer = document.getElementById('analysis-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="nutrition-results">
                <h3 class="result-header">Nutrition Analysis</h3>
                
                <div class="detected-foods" style="margin-bottom: 1.5rem;">
                    <p style="color: var(--gray-600); margin-bottom: 0.5rem;">Detected Food:</p>
                    <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--gray-900);">
                        ${data.detectedFoods?.[0]?.name || 'Unknown Food'}
                    </h4>
                    <p style="color: var(--gray-500); font-size: 0.875rem;">
                        Confidence: ${data.confidence || 0}% • ${data.portionSize || '100g'}
                    </p>
                </div>

                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <span class="nutrition-label">Calories</span>
                        <span class="nutrition-value">${data.calories || 0}</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Protein</span>
                        <span class="nutrition-value">${data.protein || 0}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Carbs</span>
                        <span class="nutrition-value">${data.carbs || 0}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Fat</span>
                        <span class="nutrition-value">${data.fat || 0}g</span>
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <button id="save-entry-btn" class="btn btn-primary" style="flex: 1;">
                        Save to Log
                    </button>
                    <button id="discard-btn" class="btn btn-secondary">
                        Discard
                    </button>
                </div>
            </div>
        `;

        resultsContainer.classList.remove('hidden');

        // Setup buttons
        document.getElementById('save-entry-btn')?.addEventListener('click', () => {
            this.saveFoodEntry(data, imageUrl);
        });

        document.getElementById('discard-btn')?.addEventListener('click', () => {
            resultsContainer.classList.add('hidden');
            document.getElementById('capture-area').innerHTML = '';
        });
    }

    async saveFoodEntry(nutritionData, imageUrl = null) {
        try {
            const entry = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                nutritionData,
                imageUrl
            };

            await FoodStorage.saveFoodEntry(entry);
            this.showNotification('Food saved successfully!', 'success');
            
            // Clear capture area
            setTimeout(() => {
                document.getElementById('capture-area').innerHTML = '';
                document.getElementById('analysis-results').classList.add('hidden');
                this.updateTodaySummary();
            }, 1500);

        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save entry', 'error');
        }
    }

    // Dashboard & Summary
    async updateTodaySummary() {
        try {
            const todayData = await FoodStorage.getTodayNutrition();
            
            document.getElementById('today-calories').textContent = todayData.calories || 0;
            document.getElementById('today-protein').textContent = `${todayData.protein || 0}g`;
            document.getElementById('today-carbs').textContent = `${todayData.carbs || 0}g`;
            document.getElementById('today-fat').textContent = `${todayData.fat || 0}g`;
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    }

    async loadDashboard() {
        const container = document.querySelector('#dashboard-page .dashboard-container');
        if (container) {
            container.innerHTML = `
                <div class="card">
                    <h2 class="welcome-title">Your Stats</h2>
                    <p style="text-align: center; color: var(--gray-600);">
                        Dashboard features coming soon!
                    </p>
                </div>
            `;
        }
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (historyList) {
            try {
                const entries = await FoodStorage.getFoodHistory();
                
                if (entries.length === 0) {
                    historyList.innerHTML = `
                        <div class="card" style="text-align: center;">
                            <p style="color: var(--gray-600);">No food entries yet.</p>
                            <p style="color: var(--gray-500); font-size: 0.875rem;">
                                Start by capturing your first meal!
                            </p>
                        </div>
                    `;
                } else {
                    historyList.innerHTML = entries.map(entry => `
                        <div class="card" style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <h4 style="font-weight: 600; margin-bottom: 0.25rem;">
                                        ${entry.nutritionData.detectedFoods?.[0]?.name || 'Food Entry'}
                                    </h4>
                                    <p style="font-size: 0.875rem; color: var(--gray-600);">
                                        ${new Date(entry.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div style="text-align: right;">
                                    <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">
                                        ${entry.nutritionData.calories} cal
                                    </p>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading history:', error);
            }
        }
    }

    // UI Helpers
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        document.getElementById('loading-overlay')?.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // Remove existing
        document.querySelector('.notification')?.remove();

        // Create new
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <svg class="notification-icon" viewBox="0 0 24 24" fill="currentColor">
                ${type === 'success' ? '<path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>' :
                  type === 'error' ? '<path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>' :
                  '<path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>'}
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.error('Service Worker failed:', err));
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.nutriTrackApp = new NutriTrackApp();
});