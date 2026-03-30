'use client';

import { useCallback, useRef, useEffect } from 'react';

import { Goban as PreactGoban } from '@sabaki/shudan';
import { render, createElement } from 'preact';

import '../theme.css';

export default function Goban(props) {
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    render(createElement(PreactGoban, props), element);

    return () => {
      render(null, element);
    };
  }, [props]);

  return <div ref={containerRef} />;
}
