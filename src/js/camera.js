// Food Tracking PWA - Camera Handler

class CameraHandler {
    static stream = null;
    static video = null;
    static canvas = null;

    // Check if camera is supported
    static isSupported() {
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    }

    // Start camera stream
    static async startCamera(constraints = { video: { facingMode: 'environment' }, audio: false }) {
        try {
            if (!this.isSupported()) {
                throw new Error('Camera not supported');
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video = document.getElementById('camera-video');
            
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.play();
            }

            return this.stream;
        } catch (error) {
            console.error('Camera start error:', error);
            throw new Error('Could not access camera');
        }
    }

    // Stop camera stream
    static stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
    }

    // Capture photo from video stream
    static capturePhoto() {
        if (!this.video || !this.stream) {
            throw new Error('Camera not initialized');
        }

        this.canvas = document.getElementById('camera-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }

        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        context.drawImage(this.video, 0, 0);
        
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
    }

    // Switch camera (front/back)
    static async switchCamera() {
        const currentFacingMode = this.stream?.getVideoTracks()[0]?.getSettings()?.facingMode || 'user';
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        this.stopCamera();
        await this.startCamera({ video: { facingMode: newFacingMode }, audio: false });
    }
}

// Initialize camera modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('camera-modal');
    const closeBtn = modal?.querySelector('.close');
    const captureBtn = document.getElementById('capture-photo-btn');

    closeBtn?.addEventListener('click', () => {
        CameraHandler.stopCamera();
        modal.classList.add('hidden');
    });

    captureBtn?.addEventListener('click', async () => {
        try {
            const photo = await CameraHandler.capturePhoto();
            CameraHandler.stopCamera();
            modal.classList.add('hidden');
            
            // Trigger photo analysis
            if (window.foodTrackerApp) {
                window.foodTrackerApp.handleFileUpload(photo);
            }
        } catch (error) {
            console.error('Photo capture failed:', error);
            alert('Failed to capture photo. Please try again.');
        }
    });
});