'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { useSpotFree } from '@/context/SpotFreeContext';
import { lookupRoomByQr } from '@/mock-data/qrCodes';

export const ScanRoomQRScreen: React.FC = () => {
  const { setSelectedRoomId, navigate, goBack, showToast, rooms } = useSpotFree();

  // Active view mode: 'scan' | 'upload'
  const [activeTab, setActiveTab] = useState<'scan' | 'upload'>('scan');

  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [detectedRoomId, setDetectedRoomId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Helper to handle a decoded QR value from camera or file
  const handleDecodedQr = useCallback((qrValue: string) => {
    const trimmed = qrValue.trim();
    const mapping = lookupRoomByQr(trimmed);

    if (!mapping) {
      showToast('QR code not recognized', 'error');
      setUploadError('QR code not recognized');
      return false;
    }

    // Match against centralized rooms
    const matchedRoom = rooms.find(
      (r) =>
        r.id.toUpperCase() === mapping.id.toUpperCase() ||
        r.roomNumber.toUpperCase() === mapping.roomNumber.toUpperCase() ||
        r.id.replace(/[\s\-_]/g, '').toUpperCase() === mapping.id.replace(/[\s\-_]/g, '').toUpperCase()
    );

    const roomIdToUse = matchedRoom ? matchedRoom.id : mapping.id;
    setDetectedRoomId(roomIdToUse);
    setSelectedRoomId(roomIdToUse);
    showToast(`Room ${roomIdToUse} Identified`, 'check_circle');

    // Proceed to Room Identified flow
    navigate('room-identified');
    return true;
  }, [rooms, setSelectedRoomId, showToast, navigate]);

  // Stop camera media stream and animation loop
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Frame scanning loop using jsQR
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          isScanningRef.current = false;
          const success = handleDecodedQr(code.data);
          if (success) {
            stopCamera();
            return;
          }
        }
      }
    }

    if (isScanningRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleDecodedQr, stopCamera]);

  // Start device camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this device/browser. Please use Upload QR Code.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings or use Upload QR Code.');
      } else {
        setCameraError('Unable to access device camera. Please use Upload QR Code or Enter Room No.');
      }
      setCameraActive(false);
    }
  }, [stopCamera, scanVideoFrame]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const capabilities = videoTrack.getCapabilities?.() as { torch?: boolean } | undefined;
      if (capabilities && capabilities.torch) {
        try {
          const nextState = !torchEnabled;
          await videoTrack.applyConstraints({
            advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
          });
          setTorchEnabled(nextState);
          showToast(nextState ? 'Torch enabled' : 'Torch disabled', 'flashlight_on');
          return;
        } catch {}
      }
    }
    // Visual feedback fallback
    setTorchEnabled((prev) => !prev);
    showToast(!torchEnabled ? 'Flashlight active' : 'Flashlight off', 'flashlight_on');
  };

  // Switch tabs cleanly
  useEffect(() => {
    if (activeTab === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Handle uploaded image file decoding
  const handleImageUpload = (file: File) => {
    if (!file) return;

    // Validate image format
    const validExtensions = /\.(png|jpe?g)$/i;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      showToast('Please upload a PNG, JPG, or JPEG image', 'error');
      setUploadError('Invalid file format. Please upload PNG, JPG, or JPEG.');
      return;
    }

    setUploadedFileName(file.name);
    setIsDecoding(true);
    setUploadError(null);
    setDetectedRoomId(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          setIsDecoding(false);
          setUploadError('QR code not recognized');
          showToast('QR code not recognized', 'error');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsDecoding(false);
        if (code && code.data) {
          const success = handleDecodedQr(code.data);
          if (!success) {
            setUploadError('QR code not recognized');
          }
        } else {
          setUploadError('QR code not recognized');
          showToast('QR code not recognized', 'error');
        }
      };

      img.onerror = () => {
        setIsDecoding(false);
        setUploadError('QR code not recognized');
        showToast('QR code not recognized', 'error');
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleResetUpload = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    setDetectedRoomId(null);
    setUploadError(null);
    setIsDecoding(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col text-white relative overflow-x-hidden overflow-y-auto pb-20">
      {/* Top Scanner Nav Header */}
      <div className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-white active:scale-95 transition-all shadow-md cursor-pointer"
          title="Close Scanner"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold tracking-wider text-emerald-400 block uppercase">
            Door Plaque Scanner
          </span>
          <span className="text-[10px] text-slate-400">SpotFree Room Identification</span>
        </div>

        {activeTab === 'scan' ? (
          <button
            onClick={toggleTorch}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md cursor-pointer ${
              torchEnabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/80 text-white hover:bg-slate-800'
            }`}
            title="Toggle Flashlight"
            aria-label="Flashlight"
          >
            <span className="material-symbols-outlined text-lg">
              {torchEnabled ? 'flashlight_on' : 'flashlight_off'}
            </span>
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>

      {/* 3 PRIMARY OPTIONS BAR */}
      <div className="px-3.5 z-20 flex justify-center w-full shrink-0 mb-2">
        <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl grid grid-cols-3 gap-1.5 w-full max-w-[400px] shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0 ${
              activeTab === 'scan'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-base">qr_code_scanner</span>
            <span className="text-[11px] leading-tight font-bold tracking-tight text-center">Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-w-0 ${
              activeTab === 'upload'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span className="text-[11px] leading-tight font-bold tracking-tight text-center">Upload QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('enter-room')}
            className="py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium cursor-pointer min-w-0"
          >
            <span className="material-symbols-outlined text-base">pin</span>
            <span className="text-[11px] leading-tight font-bold tracking-tight text-center">Enter Room No.</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Workspace */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-4 z-10 my-auto">
        {activeTab === 'scan' ? (
          /* SCAN QR CODE: Real Camera Viewfinder */
          <div className="flex flex-col items-center justify-center w-full max-w-sm">
            {/* Viewfinder Container */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-emerald-400/80 rounded-3xl relative flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.2)] overflow-hidden bg-slate-900 shrink-0">
              {/* Corner Accents */}
              <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl z-20" />
              <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl z-20" />
              <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl z-20" />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl z-20" />

              {/* Animated Laser Scanning Line */}
              {cameraActive && !cameraError && (
                <div className="absolute top-2 left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] laser-anim z-20 pointer-events-none" />
              )}

              {/* Live Video Element */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover rounded-2xl ${cameraActive && !cameraError ? 'block' : 'hidden'}`}
                playsInline
                autoPlay
                muted
              />

              {/* Hidden Canvas for Video Frame Processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Fallback / Error State */}
              {(!cameraActive || cameraError) && (
                <div className="absolute inset-0 p-4 text-center flex flex-col items-center justify-center gap-2 z-10 bg-slate-900/95">
                  <div className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
                    <span className="material-symbols-outlined text-2xl">videocam_off</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100">Camera Unavailable</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug max-w-[220px] px-1 line-clamp-3">
                    {cameraError || 'Allow camera access in browser, or use Upload QR Code.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="mt-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shrink-0"
                  >
                    Use Upload QR Code
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center max-w-[280px] shrink-0">
              Align classroom door plaque QR code inside the frame to scan
            </p>
          </div>
        ) : (
          /* UPLOAD QR CODE: File Selector & Real Image Decoder */
          <div className="flex flex-col items-center justify-center w-full max-w-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
              id="qr-file-input"
            />

            {!uploadedImage ? (
              /* Drop / Select Card */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group shadow-lg shrink-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <h3 className="font-bold text-sm text-slate-200">Upload QR Code</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-tight">
                  Select a door plaque QR image from your device
                </p>
                <span className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shrink-0">
                  Choose QR Image File
                </span>
                <span className="text-[10px] text-slate-500 mt-2 font-mono">
                  PNG, JPG, JPEG supported
                </span>
              </div>
            ) : (
              /* Image Uploaded Preview & Status */
              <div className="w-full max-w-[300px] flex flex-col items-center gap-3">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-slate-900 border-2 border-emerald-400/80 p-2 relative shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded plaque QR"
                    className="w-full h-full object-contain rounded-xl"
                  />

                  {isDecoding && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-emerald-400 text-3xl">
                        progress_activity
                      </span>
                      <span className="text-xs font-bold text-emerald-300">Decoding QR Code...</span>
                    </div>
                  )}
                </div>

                {/* Recognition Error State */}
                {!isDecoding && uploadError && (
                  <div className="w-full bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 flex flex-col gap-1.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-rose-300">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span className="text-xs font-bold">QR code not recognized</span>
                    </div>
                    <p className="text-[11px] text-rose-200/80 leading-tight">
                      The image did not contain a valid SpotFree room QR code. Please upload a clear photo of the room plaque or try another image.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetUpload}
                      className="mt-1 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Try Another Image
                    </button>
                  </div>
                )}

                {/* Successful Room Detected State */}
                {!isDecoding && detectedRoomId && (
                  <div className="w-full bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 flex flex-col gap-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          QR Code Recognized
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                        {uploadedFileName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Identified Room</span>
                        <span className="text-sm font-black text-white">Room {detectedRoomId}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                        Verified
                      </span>
                    </div>

                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleResetUpload}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Choose Another
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('room-identified')}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <span>Continue</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanRoomQRScreen;
