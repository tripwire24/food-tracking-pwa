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
    async openCamera() {
        const captureArea = document.getElementById('capture-area');
        const resultsContainer = document.getElementById('analysis-results');
        
        // Clear previous results
        if (resultsContainer) resultsContainer.classList.add('hidden');
        
        if (!CameraHandler.isSupported()) {
            this.showNotification('Camera not supported on this device', 'error');
            return;
        }

        try {
            captureArea.innerHTML = `
                <div class="card">
                    <div class="camera-container" style="position: relative; background: #000; border-radius: 0.75rem; overflow: hidden;">
                        <video id="camera-video" style="width: 100%; height: auto; display: block;" autoplay playsinline></video>
                    </div>
                    <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                        <button id="capture-photo-btn" class="btn btn-primary" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.2c1.74 0 3.15-1.41 3.15-3.15S13.74 8.9 12 8.9s-3.15 1.41-3.15 3.15S10.26 15.2 12 15.2z"/>
                                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                            Capture
                        </button>
                        <button id="cancel-camera-btn" class="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            `;

            await CameraHandler.startCamera();
            
            document.getElementById('capture-photo-btn')?.addEventListener('click', async () => {
                try {
                    const file = await CameraHandler.capturePhoto();
                    CameraHandler.stopCamera();
                    this.handleFileUpload(file);
                } catch (error) {
                    this.showNotification('Failed to capture photo', 'error');
                }
            });
            
            document.getElementById('cancel-camera-btn')?.addEventListener('click', () => {
                CameraHandler.stopCamera();
                captureArea.innerHTML = '';
            });
            
        } catch (error) {
            console.error('Camera error:', error);
            this.showNotification(error.message || 'Camera not available', 'error');
            captureArea.innerHTML = '';
        }
    }

    openFileUpload() {
        document.getElementById('file-input')?.click();
    }

    openTextInput() {
        const captureArea = document.getElementById('capture-area');
        const resultsContainer = document.getElementById('analysis-results');
        
        // Clear previous results
        if (resultsContainer) resultsContainer.classList.add('hidden');
        
        if (captureArea) {
            captureArea.innerHTML = `
                <div class="card">
                    <h3 class="result-header">Describe Your Food</h3>
                    <textarea id="food-description" class="input" 
                        placeholder="e.g., Grilled chicken breast with steamed broccoli and brown rice\n\nBe specific about portions and preparation methods for better accuracy." 
                        rows="5"
                        style="resize: vertical; min-height: 100px;"></textarea>
                    <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                        <button id="analyze-text-btn" class="btn btn-primary" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.5rem;">
                                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                            </svg>
                            Analyze Nutrition
                        </button>
                        <button id="clear-text-btn" class="btn btn-secondary">
                            Clear
                        </button>
                    </div>
                </div>
            `;

            // Focus on textarea
            document.getElementById('food-description')?.focus();

            document.getElementById('analyze-text-btn')?.addEventListener('click', () => {
                const description = document.getElementById('food-description').value.trim();
                if (description) {
                    this.analyzeTextDescription(description);
                } else {
                    this.showNotification('Please describe your food first', 'warning');
                }
            });
            
            document.getElementById('clear-text-btn')?.addEventListener('click', () => {
                document.getElementById('food-description').value = '';
                document.getElementById('food-description').focus();
            });
            
            // Allow Enter key to submit (with Shift+Enter for new lines)
            document.getElementById('food-description')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('analyze-text-btn')?.click();
                }
            });
        }
    }

    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        // Clear previous results
        const resultsContainer = document.getElementById('analysis-results');
        if (resultsContainer) resultsContainer.classList.add('hidden');

        try {
            const imageUrl = URL.createObjectURL(file);
            
            // Show image preview with loading state
            const captureArea = document.getElementById('capture-area');
            if (captureArea) {
                captureArea.innerHTML = `
                    <div class="card">
                        <div style="position: relative;">
                            <img src="${imageUrl}" alt="Food preview" 
                                style="max-width: 100%; border-radius: 0.75rem; display: block;">
                            <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem;">
                                ${(file.size / 1024 / 1024).toFixed(1)}MB
                            </div>
                        </div>
                        <p style="text-align: center; margin-top: 1rem; color: var(--gray-600);">
                            <span class="spinner" style="display: inline-block; width: 16px; height: 16px; margin-right: 0.5rem; vertical-align: middle;"></span>
                            Analyzing image...
                        </p>
                    </div>
                `;
            }

            // Small delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 500));

            // Analyze with improved AI
            const nutritionData = await AIVision.analyzeFood(file);
            
            // Update preview to show "Ready"
            const loadingText = captureArea.querySelector('p');
            if (loadingText) {
                loadingText.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--success)" style="margin-right: 0.5rem; vertical-align: middle;">
                        <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
                    </svg>
                    Analysis complete
                `;
            }
            
            this.displayNutritionResults(nutritionData, imageUrl);

        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Failed to analyze image. Please try again.', 'error');
            const captureArea = document.getElementById('capture-area');
            if (captureArea) captureArea.innerHTML = '';
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
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
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
                  type === 'warning' ? '<path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16"/>' :
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