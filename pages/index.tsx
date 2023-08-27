import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { useContract, useNFTs, ThirdwebNftMedia, useAddress, useOwnedNFTs, ConnectWallet } from "@thirdweb-dev/react";
import React, { useRef, useEffect } from 'react';

const Home: NextPage = () => {
  const address = useAddress();
  const contractAddress = "0x2CceC284704fb77b0845b4A86f610585521eC374";
  const { contract } = useContract(contractAddress);
  const { data: nfts } = useOwnedNFTs(contract, address);

  const canvasHistoryRef = useRef<ImageData[]>([]);
  const currentHistoryIndexRef = useRef<number>(-1);

  const truncateAddress = (address: string) => {
    return (
      address.substring(0, 6) + "..." + address.substring(address.length - 4)
    );
  };

  const drawCircleOnCanvas = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    addToCanvasHistory(canvas);
  };

  const addToCanvasHistory = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (currentHistoryIndexRef.current !== canvasHistoryRef.current.length - 1) {
      canvasHistoryRef.current = canvasHistoryRef.current.slice(0, currentHistoryIndexRef.current + 1);
    }

    canvasHistoryRef.current.push(imageData);
    currentHistoryIndexRef.current++;
};

const undoCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentHistoryIndexRef.current <= 0) return;

    currentHistoryIndexRef.current--;
    ctx.putImageData(canvasHistoryRef.current[currentHistoryIndexRef.current], 0, 0);
};

  const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addToCanvasHistory(canvas);
  };

  const setupCanvasInteraction = (canvas: HTMLCanvasElement) => {
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      drawCircleOnCanvas(canvas, x, y);
    });
  };

  return (
    <div className={styles.container}>
      <ConnectWallet />
      {nfts && nfts.length > 0 && (
        <div className={styles.cards}>
          {nfts.filter(nft => nft.owner !== "0x0000000000000000000000000000000000000000").map(nft => (
            <div key={nft.metadata.id.toString()} className={styles.card}>
              <h1>{nft.metadata.name}</h1>

              <div className={styles.canvasContainer}>
                <ThirdwebNftMedia metadata={nft.metadata} className={styles.image} />
                <canvas ref={(el) => {
                  if (el) {
                    el.width = el.offsetWidth;
                    el.height = el.offsetHeight;
                    setupCanvasInteraction(el);
                  }
                }}
                className={styles.canvas}
                />
              </div>

              <button onClick={(e) => {
                const canvas = e.currentTarget.parentElement?.querySelector('canvas');
                if (canvas) undoCanvas(canvas);
              }}>
                Undo
              </button>

              <button onClick={(e) => {
                const canvas = e.currentTarget.parentElement?.querySelector('canvas');
                if (canvas) clearCanvas(canvas);
              }}>
                Clear
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
