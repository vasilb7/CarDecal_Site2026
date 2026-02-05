import * as nsfwjs from 'nsfwjs';

// Cache the model instance
let model: nsfwjs.NSFWJS | null = null;

export const NSFW_THRESHOLDS = {
    porn: 0.70,    // Increased strictness (was 0.85)
    hentai: 0.75,  // Increased strictness (was 0.85)
    sexy: 0.92,    // Now actively enforced. Modeling allows sexy, but not "lewd" levels.
};

interface ScanResult {
    isSafe: boolean;
    reason?: string;
    predictions: nsfwjs.PredictionType[];
}

/**
 * Loads the model if not already loaded.
 * Call this early (e.g. on page mount) to warm up if you want instant checks later.
 */
export const preloadModel = async () => {
    if (!model) {
        try {
            model = await nsfwjs.load();
            console.log("NSFW Model loaded");
        } catch (err) {
            console.error("Failed to load NSFW model", err);
        }
    }
    return model;
};

/**
 * Scans an HTML Image element for NSFW content.
 * @param imgElement The <img> element (must be loaded)
 */
export const scanImage = async (imgElement: HTMLImageElement): Promise<ScanResult> => {
    try {
        if (!model) await preloadModel();
        if (!model) {
            // Fail safe: if model prevents blocking, we might chose to allow or block. 
            // For now allow, but log error.
            return { isSafe: true, predictions: [] }; // Fail open
        }

        const predictions = await model.classify(imgElement);
        
        // Find top prediction
        const pornScore = predictions.find(p => p.className === 'Porn')?.probability || 0;
        const hentaiScore = predictions.find(p => p.className === 'Hentai')?.probability || 0;
        const sexyScore = predictions.find(p => p.className === 'Sexy')?.probability || 0;
        
        // Logic: Block Porn and Hentai.
        if (pornScore > NSFW_THRESHOLDS.porn) {
            return { isSafe: false, reason: `Explicit Content Detected (Porn: ${(pornScore * 100).toFixed(0)}%)`, predictions };
        }
        
        if (hentaiScore > NSFW_THRESHOLDS.hentai) {
            return { isSafe: false, reason: `Explicit Content Detected (Hentai: ${(hentaiScore * 100).toFixed(0)}%)`, predictions };
        }

        // Logic for bypass protection: 
        // 1. High Sexy score
        if (sexyScore > NSFW_THRESHOLDS.sexy) {
            return { isSafe: false, reason: `Inappropriate Content Detected (Suggestive: ${(sexyScore * 100).toFixed(0)}%)`, predictions };
        }

        // 2. Combined Score (Bypass Detection for censored nudity)
        // If Porn score is moderate and Sexy is high, it's often censored/masked nudity.
        const combinedScore = pornScore + sexyScore;
        if (combinedScore > 0.88 && pornScore > 0.25) {
            return { isSafe: false, reason: `Restricted Content Detected (Mixed: ${(combinedScore * 100).toFixed(0)}%)`, predictions };
        }

        return { isSafe: true, predictions };

    } catch (err) {
        console.error("Image scan error", err);
        return { isSafe: true, predictions: [] }; // Fail open on error
    }
};

/**
 * Helper to create an image element from a file and scan it
 */
export const validateImageFile = async (file: File): Promise<ScanResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const src = e.target?.result as string;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = async () => {
                const result = await scanImage(img);
                resolve(result);
            };
            img.onerror = (err) => resolve({ isSafe: true, predictions: [] }); // Skip if bad image
        };
        reader.readAsDataURL(file);
    });
};
