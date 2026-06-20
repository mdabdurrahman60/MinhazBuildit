import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { enhanceDocument, canvasToBlob } from '../utils/documentEnhancer.js';

export default function EnhancementPreview({ imageUrl, onConfirm, onCancel, title = 'Document Preview' }) {
  const [originalPreview, setOriginalPreview] = useState(null);
  const [enhancedPreview, setEnhancedPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [showEnhanced, setShowEnhanced] = useState(true);
  const [enhancementMetadata, setEnhancementMetadata] = useState(null);
  const [enhancedBlob, setEnhancedBlob] = useState(null);

  useEffect(() => {
    async function processImage() {
      try {
        // Load and display original
        const originalImg = new Image();
        originalImg.crossOrigin = 'anonymous';
        originalImg.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 400;
          const scale = Math.min(maxWidth / originalImg.width, 1);
          canvas.width = originalImg.width * scale;
          canvas.height = originalImg.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
          setOriginalPreview(canvas.toDataURL('image/jpeg'));
        };
        originalImg.src = imageUrl;

        // Apply enhancement
        const { canvas, enhanced, cornerPoints } = await enhanceDocument(imageUrl);

        // Create preview of enhanced image
        const previewCanvas = document.createElement('canvas');
        const maxWidth = 400;
        const scale = Math.min(maxWidth / canvas.width, 1);
        previewCanvas.width = canvas.width * scale;
        previewCanvas.height = canvas.height * scale;
        const ctx = previewCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);

        setEnhancedPreview(previewCanvas.toDataURL('image/jpeg'));
        
        // Convert the full-size enhanced canvas to blob for use
        const blob = await canvasToBlob(canvas, 0.95);
        setEnhancedBlob(blob);
        
        setEnhancementMetadata({
          enhanced,
          cornerPoints,
          documentDetected: !!cornerPoints && cornerPoints.length === 4
        });
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing image preview:', error);
        setIsProcessing(false);
      }
    }

    processImage();
  }, [imageUrl]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(enhancedBlob);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-gradient-to-t from-ink-900 to-ink-800 border-t border-neon-blue/20 rounded-t-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-ink-900/95 border-b border-neon-blue/20 px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {isProcessing ? 'Processing...' : enhancementMetadata?.documentDetected ? 'Document edges detected ✓' : 'Enhancement applied'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Toggle */}
          {!isProcessing && originalPreview && enhancedPreview && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowEnhanced(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !showEnhanced
                    ? 'bg-neon-blue text-ink-900'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setShowEnhanced(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  showEnhanced
                    ? 'bg-neon-blue text-ink-900'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Enhanced
              </button>
            </div>
          )}

          {/* Image Preview */}
          <div className="bg-ink-800 rounded-xl p-3 border border-slate-600 overflow-auto">
            {isProcessing ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block p-4 bg-neon-blue/20 rounded-full mb-3">
                    <div className="animate-spin">
                      <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full" />
                    </div>
                  </div>
                  <p className="text-slate-300">Enhancing document...</p>
                </div>
              </div>
            ) : showEnhanced && enhancedPreview ? (
              <img src={enhancedPreview} alt="Enhanced" className="w-full h-auto rounded-lg" />
            ) : originalPreview ? (
              <img src={originalPreview} alt="Original" className="w-full h-auto rounded-lg" />
            ) : null}
          </div>

          {/* Enhancement Details */}
          {!isProcessing && enhancementMetadata && (
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enhancementMetadata.enhanced ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-slate-300">
                  {enhancementMetadata.enhanced ? 'Perspective correction applied' : 'Basic enhancement applied'}
                </span>
              </div>
              {enhancementMetadata.documentDetected && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-slate-300">Document edges automatically detected</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-slate-300">Contrast enhanced for better OCR</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-slate-300">Converted to professional black & white</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Retake Photo
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-ink-900 font-bold transition-all hover:shadow-lg hover:shadow-neon-blue/50"
            >
              <Check className="w-5 h-5 inline mr-2" />
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
