import React, { useEffect, useRef, useState, useCallback } from 'react';

const AudioAnalyzer: React.FC = () => {
  const [micAccessStatus, setMicAccessStatus] = useState<'unchecked' | 'granted' | 'denied'>('unchecked');
  const [grantLabel, setGrantLabel] = useState<string>('Please wait...');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micImageRef = useRef<HTMLImageElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const kickOffAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 2048;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      micRef.current = microphone;

      setMicAccessStatus('granted');
      loadMicImage();
    } catch (error) {
      console.error('Error setting up audio:', error);
      setMicAccessStatus('denied');
    }
  }, []);

  const loadMicImage = () => {
    const img = new Image();
    img.src = '/mic-icon.png';
    img.onload = () => {
      micImageRef.current = img;
      setIsReady(true);
    };
  };

  const checkMicrophoneAccess = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'prompt') {
        setGrantLabel('Grant Microphone Access');
      } else {
        setMicAccessStatus(result.state === 'granted' ? 'granted' : 'denied');
        if (result.state === 'granted') {
          kickOffAnalysis();
        }
      }
    } catch (err) {
      console.error('Error checking microphone permission:', err);
      setMicAccessStatus('denied');
    }
  }, [kickOffAnalysis]);

  useEffect(() => {
    checkMicrophoneAccess();
  }, [checkMicrophoneAccess]);

  useEffect(() => {
    if (isReady) {
      draw();
    }
  }, [isReady]);

  const draw = () => {
    console.log('draw');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    console.log('ctx', ctx, 'analyserRef', analyserRef.current, 'canvas', canvas);
    if (!ctx || !analyserRef.current || !canvas) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    console.log('calling drawVisual');

    const drawVisual = () => {
      //console.log('drawVisual');
      requestAnimationFrame(drawVisual);
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        const normalized = (value / 128.0) - 1;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      const radius = rms * 500;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);  // Clear the canvas on each frame

      // Draw the microphone image
      if (micImageRef.current) {
        ctx.drawImage(micImageRef.current, WIDTH / 2 - 50, HEIGHT / 2 - 50, 100, 100);
      }

      // Drawing circles
      ctx.beginPath();
      ctx.arc(WIDTH / 2, HEIGHT / 2 - 30, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'green';
      ctx.lineWidth = Math.max(5,radius / 5.0);
      ctx.stroke();
    };

    drawVisual();
  };

  return (
    <>
      {micAccessStatus === 'unchecked' && (
        <button
          onClick={kickOffAnalysis}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {grantLabel}
        </button>
      )}
      {micAccessStatus === 'granted' && (
        <>
          <canvas ref={canvasRef} width="240" height="340" />
          <h3>Analyzing your microphone for sound quality...</h3>
        </>
      )}
    </>
  );
};

export default AudioAnalyzer;
