// Food Tracking PWA - Main Application
class FoodTrackerApp {
    constructor() {
        this.currentPage = 'home';
        this.isOnline = navigator.onLine;
        this.nutritionData = {};
        this.foodHistory = [];
        this.installPrompt = null;
        
        this.init();
    }

    // Initialize the application
    init() {
        console.log('🍽️ Food Tracker PWA Starting...');
        
        // Initialize components
        this.setupEventListeners();
        this.setupServiceWorkerListener();
        this.setupPWAInstallPrompt();
        this.loadUserData();
        this.updateOnlineStatus();
        
        // Show initial page
        this.showPage('home');
        
        console.log('✅ Food Tracker PWA Ready!');
    }

    // Setup event listeners
    setupEventListeners() {
        // Menu toggle with debug logging
        const menuBtn = document.getElementById('menu-btn');
        const navMenu = document.getElementById('nav-menu');
        
        console.log('Setting up menu listeners:', { menuBtn: !!menuBtn, navMenu: !!navMenu });
        
        if (menuBtn && navMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Menu button clicked');
                menuBtn.classList.toggle('active');
                navMenu.classList.toggle('hidden');
                console.log('Menu state:', { active: menuBtn.classList.contains('active'), hidden: navMenu.classList.contains('hidden') });
            });
        } else {
            console.error('Menu elements not found:', { menuBtn, navMenu });
        }

        // Navigation links with debugging
        const navLinks = document.querySelectorAll('.nav-link');
        console.log(`Found ${navLinks.length} navigation links`);
        
        navLinks.forEach((link, index) => {
            console.log(`Nav link ${index}:`, link.dataset.page);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                console.log('Navigation clicked:', page);
                if (page) {
                    this.showPage(page);
                    if (navMenu) navMenu.classList.add('hidden');
                    if (menuBtn) menuBtn.classList.remove('active');
                } else {
                    console.error('No page data found for link:', e.target);
                }
            });
        });

        // Quick action buttons
        document.getElementById('quick-capture-btn')?.addEventListener('click', () => {
            this.showPage('capture');
        });

        document.getElementById('view-dashboard-btn')?.addEventListener('click', () => {
            this.showPage('dashboard');
        });

        // Capture page buttons
        document.getElementById('camera-btn')?.addEventListener('click', () => {
            this.openCamera();
        });

        document.getElementById('upload-btn')?.addEventListener('click', () => {
            this.openFileUpload();
        });

        document.getElementById('text-input-btn')?.addEventListener('click', () => {
            this.openTextInput();
        });

        // Online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });

        // File input for uploads
        const fileInput = document.getElementById('file-input');
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    // Setup service worker message listener
    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'SYNC_SUCCESS':
                        this.handleSyncSuccess(data);
                        break;
                    case 'UPDATE_AVAILABLE':
                        this.showUpdateNotification();
                        break;
                }
            });
        }
    }

    // Setup PWA install prompt
    setupPWAInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Store the event so we can trigger it later
            this.installPrompt = e;
            // Show install button/banner
            this.showInstallButton();
        });

        // Listen for the app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
            this.showNotification('App installed successfully!', 'success');
        });
    }

    // Show install button
    showInstallButton() {
        // Add install button to header if it doesn't exist
        const headerContent = document.querySelector('.header-content');
        if (headerContent && !document.getElementById('install-btn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.className = 'install-btn';
            installBtn.innerHTML = '📲 Install App';
            installBtn.addEventListener('click', () => this.promptInstall());
            
            // Insert before menu button
            const menuBtn = document.getElementById('menu-btn');
            headerContent.insertBefore(installBtn, menuBtn);
        }
    }

    // Hide install button
    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // Prompt user to install PWA
    async promptInstall() {
        if (!this.installPrompt) {
            this.showNotification('App installation not available', 'warning');
            return;
        }

        // Show the install prompt
        const result = await this.installPrompt.prompt();
        console.log('Install prompt result:', result);

        // Handle the result
        if (result.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the stored prompt
        this.installPrompt = null;
        this.hideInstallButton();
    }

    // Show loading overlay
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Update online status
    updateOnlineStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.className = this.isOnline ? 'status-indicator status-online' : 'status-indicator status-offline';
            statusIndicator.textContent = this.isOnline ? '🟢 Online' : '🔴 Offline';
        }
    }

    // Load user data (placeholder)
    async loadUserData() {
        try {
            // Placeholder for loading user preferences, settings, etc.
            console.log('Loading user data...');
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Load settings (placeholder)
    loadSettings() {
        console.log('Loading settings page...');
    }

    // Sync offline data (placeholder)
    syncOfflineData() {
        console.log('Syncing offline data...');
    }

    // Handle sync success (placeholder)
    handleSyncSuccess(data) {
        console.log('Sync successful:', data);
        this.showSuccess('Data synchronized successfully!');
    }

    // Show update notification (placeholder)
    showUpdateNotification() {
        this.showNotification('A new version is available! Please refresh the page.', 'info');
    }

    // Show specific page
    showPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Update navigation state
            this.updateNavigation(pageName);
            
            // Initialize page-specific functionality
            this.initializePage(pageName);
        }
    }

    // Update navigation active state
    updateNavigation(activePage) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === activePage) {
                link.classList.add('active');
            }
        });
    }

    // Initialize page-specific functionality
    initializePage(pageName) {
        switch (pageName) {
            case 'home':
                this.updateTodaySummary();
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'history':
                this.loadFoodHistory();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Update today's summary on home page
    async updateTodaySummary() {
        try {
            const today = new Date().toDateString();
            const todayData = await FoodStorage.getTodayNutrition();
            
            document.getElementById('today-calories').textContent = todayData.calories || 0;
            document.getElementById('today-protein').textContent = `${todayData.protein || 0}g`;
            document.getElementById('today-carbs').textContent = `${todayData.carbs || 0}g`;
            document.getElementById('today-fat').textContent = `${todayData.fat || 0}g`;
        } catch (error) {
            console.error('Error updating today\'s summary:', error);
        }
    }

    // Open camera for food capture
    async openCamera() {
        try {
            if (!CameraHandler.isSupported()) {
                throw new Error('Camera not supported on this device');
            }

            await CameraHandler.startCamera();
            document.getElementById('camera-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Camera not available. Please try uploading an image instead.');
        }
    }

    // Open file upload
    openFileUpload() {
        const fileInput = document.getElementById('file-input');
        fileInput?.click();
    }

    // Open text input for manual food description
    openTextInput() {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            captureArea.innerHTML = `
                <div class="text-input-container">
                    <h3>Describe Your Food</h3>
                    <textarea id="food-description" placeholder="Describe what you ate... (e.g., grilled chicken breast with steamed broccoli and brown rice)" rows="4"></textarea>
                    <button id="analyze-text-btn" class="primary-btn">Analyze Food</button>
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

    // Handle file upload
    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        this.showLoading('Analyzing your food...');

        try {
            // Create preview
            const imageUrl = URL.createObjectURL(file);
            this.showImagePreview(imageUrl);

            // Analyze image with AI
            const nutritionData = await AIVision.analyzeFood(file);
            this.displayNutritionResults(nutritionData, imageUrl);

        } catch (error) {
            console.error('File upload error:', error);
            this.showError('Failed to analyze image. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Analyze text description
    async analyzeTextDescription(description) {
        this.showLoading('Analyzing your food description...');

        try {
            const nutritionData = await AIVision.analyzeTextDescription(description);
            this.displayNutritionResults(nutritionData);
        } catch (error) {
            console.error('Text analysis error:', error);
            this.showError('Failed to analyze food description. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Show image preview
    showImagePreview(imageUrl) {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            captureArea.innerHTML = `
                <div class="image-preview">
                    <img src="${imageUrl}" alt="Food preview" style="max-width: 100%; height: auto; border-radius: 8px;">
                </div>
            `;
        }
    }

    // Display nutrition analysis results
    displayNutritionResults(nutritionData, imageUrl = null) {
        const resultsContainer = document.getElementById('analysis-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="nutrition-results">
                <h3>Nutrition Analysis</h3>
                ${imageUrl ? `<img src="${imageUrl}" alt="Analyzed food" class="result-image">` : ''}
                
                <div class="detected-foods">
                    <h4>Detected Foods:</h4>
                    <ul>
                        ${nutritionData.detectedFoods?.map(food => `
                            <li>${food.name} (${food.confidence}% confidence)</li>
                        `).join('') || '<li>No specific foods detected</li>'}
                    </ul>
                </div>

                <div class="nutrition-summary">
                    <h4>Nutritional Information:</h4>
                    <div class="nutrition-grid">
                        <div class="nutrition-item">
                            <span class="label">Calories:</span>
                            <span class="value">${nutritionData.calories || 0}</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Protein:</span>
                            <span class="value">${nutritionData.protein || 0}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Carbs:</span>
                            <span class="value">${nutritionData.carbs || 0}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Fat:</span>
                            <span class="value">${nutritionData.fat || 0}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Fiber:</span>
                            <span class="value">${nutritionData.fiber || 0}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Sugar:</span>
                            <span class="value">${nutritionData.sugar || 0}g</span>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button id="save-entry-btn" class="primary-btn">Save to Log</button>
                    <button id="edit-entry-btn" class="secondary-btn">Edit Details</button>
                </div>
            </div>
        `;

        resultsContainer.classList.remove('hidden');

        // Setup result action buttons
        document.getElementById('save-entry-btn')?.addEventListener('click', () => {
            this.saveFoodEntry(nutritionData, imageUrl);
        });

        document.getElementById('edit-entry-btn')?.addEventListener('click', () => {
            this.editFoodEntry(nutritionData, imageUrl);
        });
    }

    // Save food entry to storage
    async saveFoodEntry(nutritionData, imageUrl = null) {
        try {
            const entry = {
                id: Utils.generateId(),
                timestamp: new Date().toISOString(),
                nutritionData,
                imageUrl,
                source: imageUrl ? 'image' : 'text'
            };

            await FoodStorage.saveFoodEntry(entry);
            this.updateTodaySummary();
            
            this.showSuccess('Food entry saved successfully!');
            
            // Reset capture area
            setTimeout(() => {
                document.getElementById('capture-area').innerHTML = '';
                document.getElementById('analysis-results').classList.add('hidden');
            }, 2000);

        } catch (error) {
            console.error('Error saving food entry:', error);
            this.showError('Failed to save food entry. Please try again.');
        }
    }

    // Initialize dashboard
    async initializeDashboard() {
        try {
            const dashboardData = await FoodStorage.getDashboardData();
            
            if (typeof ChartWidgets !== 'undefined') {
                ChartWidgets.renderCaloriesChart(dashboardData.weeklyCalories);
                ChartWidgets.renderMacrosChart(dashboardData.macroBreakdown);
                ChartWidgets.renderProgressBars(dashboardData.dailyProgress);
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    // Load food history
    async loadFoodHistory() {
        try {
            const history = await FoodStorage.getFoodHistory();
            const historyList = document.getElementById('history-list');
            
            if (historyList) {
                if (history.length === 0) {
                    historyList.innerHTML = '<p class="text-center">No food entries yet. Start by capturing your first meal!</p>';
                } else {
                    historyList.innerHTML = history.map(entry => `
                        <div class="history-item">
                            <div class="history-date">${Utils.formatDate(entry.timestamp)}</div>
                            <div class="history-nutrition">
                                ${entry.nutritionData.calories} cal | 
                                ${entry.nutritionData.protein}g protein | 
                                ${entry.nutritionData.carbs}g carbs | 
                                ${entry.nutritionData.fat}g fat
                            </div>
                            ${entry.imageUrl ? `<img src="${entry.imageUrl}" alt="Food" class="history-image">` : ''}
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading food history:', error);
        }
    }

    // Load user settings
    loadSettings() {
        // Implementation for loading user settings
        console.log('Loading user settings...');
    }


    // Update online status indicator
    updateOnlineStatus() {
        // Add online/offline indicator to UI if needed
        const indicator = document.querySelector('.online-indicator');
        if (indicator) {
            indicator.textContent = this.isOnline ? '🟢 Online' : '🔴 Offline';
        }
    }

    // Sync offline data when back online
    async syncOfflineData() {
        if (this.isOnline) {
            console.log('Syncing offline data...');
            // Implementation for syncing offline data
        }
    }

    // Handle successful sync
    handleSyncSuccess(data) {
        console.log('Sync successful:', data);
        this.showSuccess('Data synced successfully!');
    }

    // Show update notification
    showUpdateNotification() {
        // Implementation for showing app update notification
        console.log('App update available');
    }

    // Show loading overlay
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Show success message
    showSuccess(message) {
        // Simple implementation - could be enhanced with toast notifications
        alert(`✅ ${message}`);
    }

    // Show error message
    showError(message) {
        // Simple implementation - could be enhanced with toast notifications
        alert(`❌ ${message}`);
    }

    // Edit food entry
    editFoodEntry(nutritionData, imageUrl) {
        // Implementation for editing food entry details
        console.log('Editing food entry:', nutritionData);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.foodTrackerApp = new FoodTrackerApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodTrackerApp;
}