
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PetConfig } from '../types';

interface VirtualPetProps {
  pet: PetConfig;
}

type PetState = 'WALKING' | 'SITTING' | 'CLIMBING' | 'FALLING' | 'DRAGGED';

const VirtualPet: React.FC<VirtualPetProps> = ({ pet }) => {
  const [pos, setPos] = useState({ x: 100, y: window.innerHeight - 80 });
  const [state, setState] = useState<PetState>('WALKING');
  const [dir, setDir] = useState<1 | -1>(1); // 1 = right, -1 = left
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Fix: useRef requires an initial value. Initializing with null.
  const requestRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(performance.now());
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Physics constants
  const SPEED = 1.2;
  const GRAVITY = 0.5;
  const PET_SIZE = 64;

  const update = useCallback((time: number) => {
    const deltaTime = time - lastUpdateRef.current;
    lastUpdateRef.current = time;

    if (isDraggingRef.current) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    setPos(prev => {
      let { x, y } = prev;
      let nextState = state;
      let nextRotation = 0;
      let nextDir = dir;

      const ground = window.innerHeight - PET_SIZE;
      const rightWall = window.innerWidth - PET_SIZE;
      const leftWall = 0;

      // Behavior Logic
      if (state === 'FALLING') {
        velocityRef.current.y += GRAVITY;
        y += velocityRef.current.y;
        if (y >= ground) {
          y = ground;
          velocityRef.current.y = 0;
          nextState = 'SITTING';
        }
      } else if (state === 'WALKING') {
        x += SPEED * dir;
        // Chance to sit
        if (Math.random() < 0.005) nextState = 'SITTING';
        // Wall hits
        if (x >= rightWall) {
          x = rightWall;
          nextState = Math.random() > 0.5 ? 'CLIMBING' : 'WALKING';
          if (nextState === 'WALKING') nextDir = -1;
        } else if (x <= leftWall) {
          x = leftWall;
          nextState = Math.random() > 0.5 ? 'CLIMBING' : 'WALKING';
          if (nextState === 'WALKING') nextDir = 1;
        }
      } else if (state === 'CLIMBING') {
        y -= SPEED * 0.8;
        nextRotation = x <= leftWall ? 90 : -90;
        if (y <= 100 || Math.random() < 0.002) {
          nextState = 'FALLING';
        }
      } else if (state === 'SITTING') {
        if (Math.random() < 0.01) nextState = 'WALKING';
      }

      setDir(nextDir);
      setIsFlipped(nextDir === -1 && nextState !== 'CLIMBING');
      setState(nextState);
      setRotation(nextRotation);

      return { x, y };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [state, dir]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Interaction handlers
  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    setState('DRAGGED');
    setRotation(0);
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      setPos({ x: clientX - PET_SIZE/2, y: clientY - PET_SIZE/2 });
    };

    const upHandler = () => {
      isDraggingRef.current = false;
      setState('FALLING');
      velocityRef.current = { x: 0, y: 0 };
      window.removeEventListener('mousemove', moveHandler as any);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler as any);
      window.removeEventListener('touchend', upHandler);
    };

    window.addEventListener('mousemove', moveHandler as any);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler as any, { passive: false });
    window.addEventListener('touchend', upHandler);
  };

  return (
    <div 
      className="fixed z-[9999] pointer-events-none select-none touch-none"
      style={{ 
        left: pos.x, 
        top: pos.y,
        width: PET_SIZE,
        height: PET_SIZE,
        transition: state === 'DRAGGED' ? 'none' : 'transform 0.1s linear'
      }}
    >
      <div 
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
        className="pointer-events-auto cursor-grab active:cursor-grabbing relative group"
        style={{
          transform: `scaleX(${isFlipped ? -1 : 1}) rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <div className={`text-5xl drop-shadow-lg ${state === 'DRAGGED' ? 'scale-125' : 'animate-bounce-subtle'}`}>
          {state === 'DRAGGED' ? '😲' : pet.emoji}
        </div>
        
        {/* Interaction Bubble */}
        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-xl transition-opacity duration-300 ${state === 'SITTING' || state === 'DRAGGED' ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[8px] font-black text-slate-800 uppercase whitespace-nowrap">
            {state === 'DRAGGED' ? 'HEY!' : `I'M ${pet.mood}`}
          </p>
        </div>

        {/* Dynamic Shadow */}
        {state !== 'CLIMBING' && state !== 'DRAGGED' && (
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/20 blur-sm rounded-full transition-all"
            style={{ 
                width: state === 'FALLING' ? '10px' : '30px', 
                height: '4px',
                opacity: state === 'FALLING' ? 0.1 : 0.4
            }}
          ></div>
        )}
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-3px) scaleY(0.95); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VirtualPet;
