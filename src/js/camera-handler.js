// Camera Handler for Food Tracking PWA
class CameraHandler {
    static video = null;
    static stream = null;
    static facingMode = 'environment'; // Use back camera by default

    // Check if camera is supported
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // Start camera
    static async startCamera(videoElement) {
        if (!this.isSupported()) {
            throw new Error('Camera not supported on this device');
        }

        try {
            // Stop any existing stream
            this.stopCamera();

            // Get video element
            this.video = videoElement || document.getElementById('camera-video');
            if (!this.video) {
                throw new Error('Video element not found');
            }

            // Request camera access
            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            return true;
        } catch (error) {
            console.error('Camera start error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera access denied. Please allow camera access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found on this device.');
            } else {
                throw new Error('Failed to start camera. Please try again.');
            }
        }
    }

    // Capture photo from camera
    static capturePhoto() {
        if (!this.video || !this.stream) {
            throw new Error('Camera not started');
        }

        // Create canvas for capture
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(this.video, 0, 0);
        
        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create file from blob
                    const file = new File([blob], `photo_${Date.now()}.jpg`, {
                        type: 'image/jpeg'
                    });
                    resolve(file);
                } else {
                    reject(new Error('Failed to capture photo'));
                }
            }, 'image/jpeg', 0.9);
        });
    }

    // Stop camera
    static stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
    }

    // Switch camera (front/back)
    static async switchCamera() {
        this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
        if (this.video) {
            await this.startCamera(this.video);
        }
    }
}

// Make it available globally
window.CameraHandler = CameraHandler;