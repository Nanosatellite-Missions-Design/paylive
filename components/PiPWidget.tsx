'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export default function RealHtmlPiP() {
  const [isPiP, setIsPiP] = useState(false);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setRandomNumber(Math.floor(Math.random() * 100));

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(30); // 30 FPS
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    videoRef.current = video;

    // Try to start playing once metadata is ready
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(console.error);
    });

    // Optional: play video after user gesture
    document.body.appendChild(video); // not visible, but required by some browsers
    video.style.display = 'none';
  }, []);

  const startPiP = async () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!container || !canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawLoop = () => {
      if (!isPiP) return;
      html2canvas(container).then((snapshot) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawLoop);
      });
    };

    try {
      await video.play();
      await video.requestPictureInPicture();
      setIsPiP(true);
      drawLoop();
    } catch (err) {
      console.error('❌ PiP start failed:', err);
    }
  };

  const stopPiP = async () => {
    setIsPiP(false);
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        ref={containerRef}
        style={{
          width: 300,
          height: 200,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: 10,
        }}
      >
        <h4 style={{ margin: 0 }}>🧩 PiP Widget</h4>
        <p style={{ margin: 0 }}>
          Number: dfdf
        </p>
        <p style={{ fontSize: 12, color: '#666' }}>
          Time: efrdf
        </p>
      </div>

      <button onClick={startPiP} style={{ marginTop: 10, marginRight: 10 }}>
        Start PiP
      </button>
      <button onClick={stopPiP}>Stop PiP</button>
    </div>
  );
}
