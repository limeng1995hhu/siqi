'use client';

import { useCallback } from 'react';

import { Goban as PreactGoban } from '@sabaki/shudan';
import { render, createElement } from 'preact';

import './goban.css';
import '../theme.css';

export default function Goban(props: any) {
  const refCallback = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;

    // 使用Preact渲染Goban组件
    render(createElement(PreactGoban as any, props), element);

    // 清理函数
    return () => render(null, element);
  }, [props]);

  return <div ref={refCallback} />;
}
