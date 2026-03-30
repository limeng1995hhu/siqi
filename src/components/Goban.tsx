'use client';

import { useRef, useEffect } from 'react';

import { Goban as PreactGoban } from '@sabaki/shudan';
import { render, createElement } from 'preact';

import '../theme.css';

interface GobanProps {
  vertexSize: number;
  signMap: number[][];
  markerMap: any[][];
  [key: string]: any;
}

export default function Goban(props: GobanProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    render(createElement(PreactGoban as any, props), element);

    return () => {
      render(null, element);
    };
  }, [props]);

  return <div ref={containerRef} />;
}
