"use client";

import { useEffect, useRef, useState } from 'react';
import {
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';

export default function RpsCore() {
    // initializing refs & states
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [gameResult, setGameResult] = useState('get ready!');
    const [buttonClicked, setButtonClicked] = useState(false);

    function handleClick() {
        setButtonClicked(!buttonClicked);
    }

    useEffect(() => {
        if (buttonClicked) {
            let gestureRecognizer;
            let running = true;
            let stream;

            async function init() {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
            );

            // assigning model to recognizer
            gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                modelAssetPath: './gesture_recognizer.task',
                delegate: 'GPU',
                },
                runningMode: 'VIDEO',
            });

            // initializing video & cnavas to display video
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // asks for camera perms
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // starts a countdown from 5 for rps game
            let countdownStart = Date.now();

            const loop = () => {
                if (!running) return;

                // mirrors video
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                ctx.restore();

                // countdown
                const now = Date.now();
                const secondsElapsed = Math.floor((now - countdownStart) / 1000);
                const secondsRemaining = 5 - secondsElapsed;

                // canvas display
                ctx.fillStyle = 'rgba(0, 40, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0, 0, 0, .8)';
                ctx.fillRect(0, canvas.height - 50, canvas.width, 50)
                ctx.font = '22px "VT232", monospace';
                ctx.fillStyle = 'white';
                ctx.fillText(
                    secondsRemaining > 0
                        ? `> SHOOT IN ${secondsRemaining}...`
                        : '> ANALYZING...',
                    canvas.width / 2,
                    canvas.height - 16
                );
                ctx.textAlign = 'center';
                if (secondsRemaining > 0) {
                requestAnimationFrame(loop);
                } else {
                const result = gestureRecognizer.recognizeForVideo(video, Date.now());

                // recognizing logic
                let name = 'UNKNOWN';
                if (
                    result.gestures.length > 0 &&
                    result.gestures[0].length > 0
                ) {
                    name = result.gestures[0][0].categoryName;
                    if (name === 'Open_Palm') name = 'PAPER';
                    if (name === 'Closed_Fist') name = 'ROCK';
                    if (name === 'Victory') name = 'SCISSORS';
                }

                // computer choice logic
                const computer = ['ROCK', 'PAPER', 'SCISSORS'][
                    Math.floor(Math.random() * 3)
                ];

                // shows results
                let resultText;
                if (name === computer) {
                    resultText = `DRAW // YOU: ${name} - CPU: ${name}`;
                } else if (
                    (name === 'ROCK' && computer === 'SCISSORS') ||
                    (name === 'PAPER' && computer === 'ROCK') ||
                    (name === 'SCISSORS' && computer === 'PAPER')
                ) {
                    resultText = `YOU WIN // YOU: ${name} - CPU: ${computer}`;
                } else {
                    resultText = `YOU LOSE // YOU: ${name} - CPU: ${computer}`;
                }

                setGameResult(resultText);
                }
            };

            requestAnimationFrame(loop);
            }

            init();

            return () => {
            // figure out where to put this so it works as expected..

                running = false;
                setButtonClicked(!buttonClicked);

            };
        }
    }, [buttonClicked]);

    let date = new Date().toLocaleDateString();

    return (
        <main className="h-screen flex items-center justify-center flex-col gap-3" id="crt">
            <div id="titlediv">
                <p className="title">rock, paper, scissors</p>
                <p className="cursor">_</p>
            </div>
            <p className='subtitle'>GESTURE RECOGNITION TERMINAL</p>
            <video ref={videoRef} style={{ display: 'none' }}></video>
            {!buttonClicked ? (
                <div className="monitor-frame">
                    <div className="monitor-inner">
                        <img
                            src="./8bitrps.png"
                            alt="rock paper scissors"
                            className="w-48 h-48 object-contain"
                            id="image"
                        />
                        <p className="awaiting-text">&gt; AWAITING INPUT_</p>
                    </div>
                </div>
            ) : (
                <div className="monitor-frame">
                    <canvas ref={canvasRef}></canvas>
                </div>
            )}
            <button type="button" onClick={handleClick} className="button">
                {!buttonClicked ? 'EXECUTE' : 'TERMINATE'}
            </button>
            <div className='outputBar'>
                {!buttonClicked ? (
                    <p className="status-text">Click to start.</p>
                ) : (
                    <p className="status-text">result: {gameResult}</p>
                )}
            </div>
            <p className="footer-text">SYS://RPS_TERMINAL — {date}</p>
        </main>
    );
}
