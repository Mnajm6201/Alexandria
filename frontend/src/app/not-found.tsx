"use client"; 

import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';

export default function Custom404() {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <>
      <Head>
        <title>404 – Book Not Found</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          fontFamily: "'Cinzel', serif",
        }}
      >
        <Image
          src="/alexandria-library.jpg"
          alt="Alexandria Library"
          fill
          style={{ objectFit: 'cover', zIndex: -1 }}
          priority
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404 – Book Not Found</h1>
          <p>The Library of Alexandria was once the center of the world's knowledge.</p>
          <p>Seneca estimated it held nearly 700,000 volumina.</p>
          <p>The fire that broke out in 298 AD destroyed the library...</p>
          <p>And all of its books.</p>
          <p>Perhaps the book you're looking for can be found in its ashes?</p>
        </div>
      </div>
    </>
  );
}