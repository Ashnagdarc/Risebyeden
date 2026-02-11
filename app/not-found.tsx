"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  const shardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (trailRef.current) {
        trailRef.current.style.left = x + "px";
        trailRef.current.style.top = y + "px";
      }
      shardsRef.current.forEach((shard, index) => {
        if (shard) {
          const speed = (index + 1) * 0.02;
          const moveX = (window.innerWidth / 2 - x) * speed;
          const moveY = (window.innerHeight / 2 - y) * speed;
          shard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${index * 15}deg)`;
        }
      });
      if (heroRef.current) {
        const tiltX = (window.innerHeight / 2 - y) * 0.01;
        const tiltY = (window.innerWidth / 2 - x) * -0.01;
        heroRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const items = document.querySelectorAll(`.${styles.tickerItem}`);
      if (items.length > 0) {
        const target = items[Math.floor(Math.random() * items.length)] as HTMLElement;
        target.style.opacity = "0.2";
        setTimeout(() => (target.style.opacity = "1"), 50);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.pageRoot}>
      <div className={styles.scanlines}></div>
      <div className={styles.cursorTrail} ref={trailRef}></div>
      {/* Background Shards */}
      <div
        className={styles.shard}
        style={{ width: 300, height: 400, top: "-10%", right: "10%", rotate: "15deg" }}
        ref={el => { shardsRef.current[0] = el; }}
      ></div>
      <div
        className={styles.shard}
        style={{ width: 200, height: 200, bottom: "5%", left: "5%", rotate: "-25deg" }}
        ref={el => { shardsRef.current[1] = el; }}
      ></div>
      <div
        className={styles.shard}
        style={{ width: 150, height: 300, bottom: "20%", right: "-5%", rotate: "45deg" }}
        ref={el => { shardsRef.current[2] = el; }}
      ></div>

      <div className={styles.tickerWrap}>
        <div className={styles.tickerMove}>
          <span className={`${styles.tickerItem} ${styles.down}`}>VOID -99.9%</span>
          <span className={`${styles.tickerItem} ${styles.up}`}>LOST +404.0</span>
          <span className={`${styles.tickerItem} ${styles.down}`}>NULL -ERR.X</span>
          <span className={`${styles.tickerItem} ${styles.up}`}>DARK +0.002</span>
          <span className={`${styles.tickerItem} ${styles.down}`}>EXIT -500.2</span>
          <span className={`${styles.tickerItem} ${styles.up}`}>VOID -99.9%</span>
          <span className={`${styles.tickerItem} ${styles.up}`}>LOST +404.0</span>
          <span className={`${styles.tickerItem} ${styles.down}`}>NULL -ERR.X</span>
          <span className={`${styles.tickerItem} ${styles.up}`}>DARK +0.002</span>
          <span className={`${styles.tickerItem} ${styles.down}`}>EXIT -500.2</span>
        </div>
      </div>

      <div className={styles.voidContainer}>
        <div className={styles.hero} ref={heroRef}>
          <div className={styles.errorCode}>
            <span className={styles.shardTop}>404</span>
            <span className={styles.shardBottom}>404</span>
          </div>
          <div className={styles.metaData}>
            <h1>Asset Delisted</h1>
            <p>
              The page you are looking for has been liquidated. Our algorithms suggest
              this route is no longer profitable or has been moved to a cold wallet
              outside our current scope.
            </p>
            <div className={styles.controls}>
              <Link href="/" className={styles.btn}>REBALANCE PORTFOLIO</Link>
              <Link href="/" className={styles.btn}>MARKET OVERVIEW</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
