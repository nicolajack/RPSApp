"use client";

import { useEffect, useRef, useState } from 'react';
import {
    GestureRecognizer,
    FilesetResolver,
} from '@mediapipe/tasks-vision';

export default function rpsCore() {
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
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
              ctx.fillStyle = 'rgba(93, 137, 239, 0.6)';
              ctx.fillRect(120, 0, 400, 45);
              ctx.fillStyle = 'rgb(247 206 56)';
              ctx.font = 'bold 22px sans-serif';
              ctx.fillText(`rock, paper, scissors, shoot! in: ${secondsRemaining}`, 140, 30);

              if (secondsRemaining > 0) {
              requestAnimationFrame(loop);
              } else {
              const result = gestureRecognizer.recognizeForVideo(video, Date.now());

              // recognizing logic
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

              // computer choice logic
              const computer = ['rock', 'paper', 'scissors'][
                  Math.floor(Math.random() * 3)
              ];

              // shows results
              let resultText;
              if (name === computer) {
                  resultText = `u tied! both u and the computer chose ${name}`;
              } else if (
                  (name === 'rock' && computer === 'scissors') ||
                  (name === 'paper' && computer === 'rock') ||
                  (name === 'scissors' && computer === 'paper')
              ) {
                  resultText = `u win! u chose ${name}, and the computer chose ${computer}`;
              } else {
                  resultText = `u lose! u chose ${name}, and the computer chose ${computer}`;
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

    return (
        <main className="h-screen flex items-center justify-center flex-col gap-4">
            <p className="text-[#E87777] font-bold text-3xl">are you ready to rock? paper... scissors...</p>
            <video ref={videoRef} style={{ display: 'none' }}></video>
            {!buttonClicked ? (
                <img src="./rps.png" alt="rock paper scissors" className="scale-200 m-20" />
            ) : (
              <canvas ref={canvasRef} className="border-2 border-[#5D89EF] rounded-lg"></canvas>
            )}
            <button type="button" onClick={handleClick} className="text-[#F7CE38] font-bold text-2xl bg-[#5D89EF] hover:bg-[#3F6EDD] rounded-lg px-5 py-2.5 me-2 mb-2">
                {!buttonClicked ? 'play' : 'stop'}
            </button>
            {!buttonClicked ? (
                <p className="text-[#E87777] font-bold text-xl">click the button to start the game!</p>
            ) : (
                <p className="text-[#E87777] font-bold text-xl">result: {gameResult}</p>
            )}
        </main>
    );
}
