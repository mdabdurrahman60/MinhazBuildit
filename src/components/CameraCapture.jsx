import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, ImageUp } from 'lucide-react';
import EnhancementPreview from './EnhancementPreview.jsx';

export default function CameraCapture({ title, instructions, guideOverlay = false, onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) setUseFallback(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (isMounted) setIsReady(true);
        }
      } catch (err) {
        if (isMounted) {
          setUseFallback(true);
          setError('Camera access was denied or is unavailable. You can upload a photo instead.');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const objectUrl = URL.createObjectURL(blob);
        stopStream();
        setCapturedImage({ blob, url: objectUrl });
        setShowPreview(true);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCapturedImage({ blob: file, url: objectUrl });
    setShowPreview(true);
    event.target.value = '';
  };

  const handlePreviewConfirm = (enhancedBlob) => {
    if (capturedImage && enhancedBlob) {
      // Create a URL for the enhanced blob
      const enhancedUrl = URL.createObjectURL(enhancedBlob);
      // Pass the enhanced blob and URL to the parent
      onCapture(enhancedBlob, enhancedUrl);
      // Revoke the original image URL
      URL.revokeObjectURL(capturedImage.url);
      setShowPreview(false);
      setCapturedImage(null);
    }
  };

  const handlePreviewCancel = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    setShowPreview(false);
    // Restart camera if not in fallback mode
    if (!useFallback && !streamRef.current) {
      setIsReady(false);
      // Will be restarted by useEffect on mount
    }
  };

  const handleCancel = () => {
    stopStream();
    onCancel();
  };

  const handleMainCancel = () => {
    if (showPreview) {
      handlePreviewCancel();
    } else {
      handleCancel();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-base font-semibold text-slate-100">{title}</h2>
          <button
            onClick={handleMainCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-slate-300"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {!showPreview && (
          <>
            <div className="relative flex-1 overflow-hidden bg-black">
              {!useFallback && (
                <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
              )}

              {guideOverlay && !useFallback && isReady && (
                <div className="pointer-events-none absolute inset-0">
                  {/* Darken the areas outside the frame */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Guide frame for ID number section */}
                  <div className="absolute right-0 top-0 h-1/4 w-1/2">
                    <div className="relative h-full w-full border-4 border-scanner-400 bg-scanner-400/5">
                      {/* Corner markers */}
                      <div className="absolute -left-1 -top-1 h-4 w-4 border-t-4 border-l-4 border-scanner-400" />
                      <div className="absolute -right-1 -top-1 h-4 w-4 border-t-4 border-r-4 border-scanner-400" />
                      <div className="absolute -left-1 -bottom-1 h-4 w-4 border-b-4 border-l-4 border-scanner-400" />
                      <div className="absolute -right-1 -bottom-1 h-4 w-4 border-b-4 border-r-4 border-scanner-400" />
                      
                      <span className="absolute -top-8 left-0 right-0 rounded bg-scanner-400 px-3 py-1 text-center text-xs font-bold text-ink-950">
                        ✓ Keep ID Number Here
                      </span>
                      <p className="absolute inset-0 flex items-center justify-center text-center text-sm font-semibold text-scanner-400/80">
                        Position document ID in this frame
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {useFallback && (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                  <ImageUp size={48} className="text-slate-500" />
                  <p className="text-sm text-slate-400">{error || 'Use your device camera app to take the photo.'}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-scanner-500 px-6 py-3 text-sm font-semibold text-ink-950"
                  >
                    Open Camera / Choose Photo
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="px-5 py-4 text-center">
              <p className="mb-4 text-xs text-slate-400">{instructions}</p>

              {!useFallback && (
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-slate-300"
                    aria-label="Upload photo instead"
                  >
                    <ImageUp size={20} />
                  </button>
                  <button
                    onClick={handleCapture}
                    disabled={!isReady}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-scanner-400 bg-paper disabled:opacity-40"
                    aria-label="Capture photo"
                  >
                    <Camera size={26} className="text-ink-950" />
                  </button>
                  <div className="h-12 w-12" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Enhancement Preview */}
      {showPreview && capturedImage && (
        <EnhancementPreview
          imageUrl={capturedImage.url}
          onConfirm={handlePreviewConfirm}
          onCancel={handlePreviewCancel}
          title="Document Enhancement Preview"
        />
      )}
    </>
  );
}
