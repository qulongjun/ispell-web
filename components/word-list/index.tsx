/*
 * @Date: 2025-10-27 21:54:27
 * @LastEditTime: 2026-02-16 20:26:31
 * @Description: 单词列表的入口组件（支持拖动与吸边）
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { List } from 'lucide-react';
import WordListDrawer from './WordListDrawer';

const STORAGE_KEY = 'ispell_wordlist_btn_position';
const SNAP_THRESHOLD = 80; // 距离边缘小于此 px 时吸边
const EDGE_PADDING = 16;
const BUTTON_SIZE = 48;

const defaultPosition = () => ({ left: EDGE_PADDING, bottom: 24 });

function loadStoredPosition(): { left: number; bottom: number } {
  if (typeof window === 'undefined') return defaultPosition();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPosition();
    const parsed = JSON.parse(raw) as { left?: number; bottom?: number };
    const left = typeof parsed.left === 'number' ? parsed.left : defaultPosition().left;
    const bottom = typeof parsed.bottom === 'number' ? parsed.bottom : defaultPosition().bottom;
    return { left, bottom };
  } catch {
    return defaultPosition();
  }
}

function clampPosition(left: number, bottom: number): { left: number; bottom: number } {
  const maxLeft = typeof window !== 'undefined' ? window.innerWidth - BUTTON_SIZE - EDGE_PADDING : 999;
  const maxBottom = typeof window !== 'undefined' ? window.innerHeight - BUTTON_SIZE - EDGE_PADDING : 999;
  return {
    left: Math.max(EDGE_PADDING, Math.min(maxLeft, left)),
    bottom: Math.max(EDGE_PADDING, Math.min(maxBottom, bottom)),
  };
}

/** 根据当前 left 计算吸边后的 left */
function snapHorizontal(left: number): number {
  if (typeof window === 'undefined') return left;
  const w = window.innerWidth;
  if (left < SNAP_THRESHOLD) return EDGE_PADDING;
  if (left > w - BUTTON_SIZE - SNAP_THRESHOLD) return w - BUTTON_SIZE - EDGE_PADDING;
  return left;
}

/**
 * 单词列表入口组件
 * 渲染一个可拖动的触发按钮，靠近左右边缘时自动吸边，位置持久化到 localStorage。
 */
const WordList = () => {
  const [isWordListOpen, setIsWordListOpen] = useState(false);
  const [position, setPosition] = useState(loadStoredPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, bottom: 0 });
  const didDragRef = useRef(false);

  // 持久化位置
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      // ignore
    }
  }, [position]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setIsDragging(true);
      didDragRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        left: position.left,
        bottom: position.bottom,
      };
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const { x, y, left: startLeft, bottom: startBottom } = dragStartRef.current;
      const deltaX = e.clientX - x;
      const deltaY = -(e.clientY - y);
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) didDragRef.current = true;
      const next = clampPosition(startLeft + deltaX, startBottom + deltaY);
      setPosition(next);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setPosition((prev) => ({
      ...prev,
      left: snapHorizontal(prev.left),
    }));
  }, [isDragging]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsWordListOpen(true);
  }, []);

  return (
    <>
      <button
        id="spelling-guide-wordlist"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="打开单词列表"
        className="fixed p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-full shadow-lg transition-shadow duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-2 z-30 touch-none select-none"
        style={{
          left: position.left,
          bottom: position.bottom,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <List className="w-full h-full pointer-events-none" />
      </button>

      <WordListDrawer
        isOpen={isWordListOpen}
        onClose={() => setIsWordListOpen(false)}
      />
    </>
  );
};

export default WordList;
