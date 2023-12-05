import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import Image from 'next/image';
import { useContract, ThirdwebNftMedia, useAddress, useOwnedNFTs, ConnectWallet } from "@thirdweb-dev/react";
import React, { useState, useRef, useCallback } from 'react';
import Head from 'next/head';

const contractAddress = "0x2CceC284704fb77b0845b4A86f610585521eC374";

const NFTCard = ({ nft, canvasRef, handleClearClick, handleUndoClick }: any) => (
    <div key={`nft-${nft.metadata.id.toString()}`} className={styles.card}>
        <h1>{nft.metadata.name}</h1>
        <div className={styles.canvasContainer}>
            <ThirdwebNftMedia metadata={nft.metadata} className={styles.image} />
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div className={styles.buttonContainer}>
            <button className={styles.clearButton} onClick={handleClearClick}>Clear</button>
            <button className={styles.undoButton} onClick={handleUndoClick}>Undo</button>
        </div>
    </div>
);


const Home: NextPage = () => {
  const address = useAddress();
  const { contract } = useContract(contractAddress);
  const { data: nfts, error } = useOwnedNFTs(contract, address);
  const [isLoading, setIsLoading] = useState(false);

  // Handle NFTs and errors
  React.useEffect(() => {
    if (address) {
        setIsLoading(true);
    }

    if (nfts || error) setIsLoading(false);

    if (nfts) console.log("NFTs data:", nfts);
    if (error) console.error("Error fetching NFTs:", error);
}, [nfts, error, address]);


  const canvasHistoryRef = useRef(new Map<HTMLCanvasElement, ImageData[]>());
  const currentHistoryIndexRef = useRef(new Map<HTMLCanvasElement, number>());
  const initializedCanvases = useRef(new Set<HTMLCanvasElement>());

  const drawCircleOnCanvas = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const radius = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    addToCanvasHistory(canvas);
  };

  const setupCanvasInteraction = useCallback((canvas: HTMLCanvasElement) => {
    if (initializedCanvases.current.has(canvas)) return;

    const drawOnCanvas = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      let x: number, y: number;

      if (event instanceof MouseEvent) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      } else if (event instanceof TouchEvent && event.touches.length > 0) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
      } else {
        return;  // If it's a TouchEvent with no touches, we just return
      }

      drawCircleOnCanvas(canvas, x, y); // You need to call this to actually draw the circle
    };

    // Add the event listeners
    canvas.addEventListener('mousedown', drawOnCanvas);
    canvas.addEventListener('touchstart', drawOnCanvas);

    // Remember to mark this canvas as initialized so we don't double-setup
    initializedCanvases.current.add(canvas);
}, [drawCircleOnCanvas]);

  

  const addToCanvasHistory = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const currentCanvasHistory = canvasHistoryRef.current.get(canvas) || [];
    const currentCanvasHistoryIndex = currentHistoryIndexRef.current.get(canvas) || 0;

    if (currentCanvasHistoryIndex !== currentCanvasHistory.length - 1) {
      const updatedHistory = currentCanvasHistory.slice(0, currentCanvasHistoryIndex + 1);
      updatedHistory.push(imageData);
      canvasHistoryRef.current.set(canvas, updatedHistory);
    } else {
      currentCanvasHistory.push(imageData);
      canvasHistoryRef.current.set(canvas, currentCanvasHistory);
    }

    currentHistoryIndexRef.current.set(canvas, currentCanvasHistory.length - 1);
  };

  const undoCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentCanvasHistoryIndex = currentHistoryIndexRef.current.get(canvas) || 0;
    if (currentCanvasHistoryIndex <= 0) return;

    const updatedCanvasHistoryIndex = currentCanvasHistoryIndex - 1;
    currentHistoryIndexRef.current.set(canvas, updatedCanvasHistoryIndex);

    const currentCanvasHistory = canvasHistoryRef.current.get(canvas) || [];
    const imageDataToRestore = currentCanvasHistory[updatedCanvasHistoryIndex];
    if (!imageDataToRestore) {
      console.error('No ImageData found at index', updatedCanvasHistoryIndex);
      return;
    }
    ctx.putImageData(imageDataToRestore, 0, 0);
  };

  const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addToCanvasHistory(canvas);
  };

  const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const canvasContainer = e.currentTarget.parentElement?.previousElementSibling;
    const canvas = canvasContainer?.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) clearCanvas(canvas);
  };

  const handleUndoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const canvasContainer = e.currentTarget.parentElement?.previousElementSibling;
    const canvas = canvasContainer?.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) undoCanvas(canvas);
  };

  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && !initializedCanvases.current.has(canvas)) {
        const dpr = window.devicePixelRatio || 1;  // Get device pixel ratio
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
            ctx.scale(dpr, dpr);  // Scale the canvas by the dpr value
            const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvasHistoryRef.current.set(canvas, [initialImageData]);
            currentHistoryIndexRef.current.set(canvas, 0);
        }
        setupCanvasInteraction(canvas);
    }
  }, [setupCanvasInteraction]);
  const [displayCount, setDisplayCount] = useState(6);  // Initially display 10 NFT cards
  const [hasMore, setHasMore] = useState(true);  // Initially assume there are more NFTs to display

  const handleViewMoreClick = () => {
    const newDisplayCount = displayCount + 10;  // Display 10 more NFT cards
    if (nfts && newDisplayCount >= nfts.length) {
      setHasMore(false);  // If the new display count exceeds or equals the total NFTs, then there are no more to display
    }
    setDisplayCount(newDisplayCount);
};

  return (
    <div className={styles.container}>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>
        
        <div className={styles.contentWrapper}>
            <div className={styles.header}>
                <a href="https://worldoftings.com/bingo" className={styles.purchaseButtonLink} 
                    target="_blank"
                    rel="noopener noreferrer">
                    <button className={styles.purchaseButton}>
                        PURCHASE MORE CARDS
                    </button>
                </a>
                <div className={styles.titleWrapper}>
                    <Image src="/images/PlayBingo.png" alt="Header" width={550} height={150} className={styles.headerImage} />
                </div>
                <ConnectWallet className={styles.connectWallet} />


            </div>

            {!address && <p className={styles.walletConnectPrompt}>Connect your wallet to load your Bingo Tings cards!</p>}

            
            {isLoading ? (
    <div className={styles.loadingScreen}>
      <Image src="/images/Loading.gif" alt="Loading..." width={160} height={40} />
    </div>
) : (
    <>
 <div className={styles.cards}>
            {nfts?.slice(0, displayCount).filter(nft => nft.owner !== "0x0000000000000000000000000000000000000000").map(nft => (
              <NFTCard
                key={`nft-${nft.metadata.id.toString()}`}
                nft={nft}
                canvasRef={canvasRef}
                handleClearClick={handleClearClick}
                handleUndoClick={handleUndoClick}
              />
            ))}
                 </div>
        {address && hasMore && (
            <div className={styles.viewMoreContainer}>
              <button onClick={handleViewMoreClick} className={styles.viewMoreButton}>View More</button>
            </div>
        )}
    </>
)}
        
        </div>
    </div>
);
}  

export default Home;





