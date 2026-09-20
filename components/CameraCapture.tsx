import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onClose: () => void;
  onCapture: (base64: string, mediaType: string) => void;
  isProcessing: boolean;
  error: string | null;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onClose, onCapture, isProcessing, error }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError('Impossibile accedere alla fotocamera. Controlla i permessi del browser.'));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const [header, base64] = dataUrl.split(',');
    const mediaType = header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    onCapture(base64, mediaType);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Scansiona Prodotto</h3>
          <button onClick={onClose} aria-label="Chiudi fotocamera" className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {(cameraError || error) ? (
          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-4">
            {cameraError || error}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square mb-4">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm font-medium">Riconoscimento in corso...</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleCapture}
          disabled={!!cameraError || isProcessing}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          Scatta Foto
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
