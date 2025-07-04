"use client";

import { useEffect, useRef, useState } from 'react';
import {
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';

export default function RpsCore() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [gestureName, setGestureName] = useState('Waiting...');
    const [gameResult, setGameResult] = useState('');

    useEffect(() => {
        let gestureRecognizer;
        let running = true;

        async function init() {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );

        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
            modelAssetPath: './gesture_recognizer.task',
            delegate: 'GPU',
            },
            runningMode: 'VIDEO',
        });

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let countdownStart = Date.now();

        const loop = () => {
            if (!running) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const now = Date.now();
            const secondsElapsed = Math.floor((now - countdownStart) / 1000);
            const secondsRemaining = 5 - secondsElapsed;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, 400, 40);
            ctx.fillStyle = 'white';
            ctx.font = '20px sans-serif';
            ctx.fillText(`rock, paper, scissors, shoot! in: ${secondsRemaining}`, 10, 30);

            if (secondsRemaining > 0) {
            requestAnimationFrame(loop);
            } else {
            // Capture one frame and recognize
            const result = gestureRecognizer.recognizeForVideo(video, Date.now());

            let name = 'no gesture recognized';
            if (
                result.gestures.length > 0 &&
                result.gestures[0].length > 0
            ) {
                name = result.gestures[0][0].categoryName;
                if (name === 'Open_Palm') name = 'paper';
                if (name === 'Closed_Fist') name = 'rock';
                if (name === 'Victory') name = 'scissors';
            }

            setGestureName(name);

            const computer = ['rock', 'paper', 'scissors'][
                Math.floor(Math.random() * 3)
            ];

            let resultText;
            if (name === computer) {
                resultText = `You tied! Both chose ${name}`;
            } else if (
                (name === 'rock' && computer === 'scissors') ||
                (name === 'paper' && computer === 'rock') ||
                (name === 'scissors' && computer === 'paper')
            ) {
                resultText = `You win! You chose ${name}, computer chose ${computer}`;
            } else {
                resultText = `You lose! You chose ${name}, computer chose ${computer}`;
            }

            setGameResult(resultText);
            }
        };

        requestAnimationFrame(loop);
        }

        init();

        return () => {
        running = false;
        };
    }, []);

    return (
        <main>
            <video ref={videoRef} style={{ display: 'none' }} ></video>
            <canvas ref={canvasRef}></canvas>
            <p>result: {gameResult}</p>
        </main>
    );
}