'use client';

import React from 'react';
import AudioAnalyzer from '../components/AudioAnalyzer';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl mb-6">Getting You Ready For Your Meeting with: <span className="font-bold">Will Kessler</span></h1>
      <AudioAnalyzer />
    </main>
  );
}
