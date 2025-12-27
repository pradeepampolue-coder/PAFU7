
import React from 'react';
import { PetConfig } from '../types';

const PET_TYPES: PetConfig[] = [
  { id: 'shiba', emoji: '🐕', name: 'Shiba', mood: 'HAPPY' },
  { id: 'calico', emoji: '🐈', name: 'Calico', mood: 'SLEEPY' },
  { id: 'bunny', emoji: '🐰', name: 'Bunny', mood: 'CURIOUS' },
  { id: 'fox', emoji: '🦊', name: 'Fox', mood: 'PLAYFUL' },
  { id: 'bear', emoji: '🐻', name: 'Bear', mood: 'CHILL' },
  { id: 'panda', emoji: '🐼', name: 'Panda', mood: 'HUNGRY' },
  { id: 'koala', emoji: '🐨', name: 'Koala', mood: 'RELAXED' },
  { id: 'frog', emoji: '🐸', name: 'Frog', mood: 'ZEN' },
  { id: 'monkey', emoji: '🐵', name: 'Monkey', mood: 'WILD' },
  { id: 'chick', emoji: '🐤', name: 'Chick', mood: 'CHIRPY' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', mood: 'COOL' },
  { id: 'turtle', emoji: '🐢', name: 'Turtle', mood: 'SLOW' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', mood: 'MAGIC' },
  { id: 'dragon', emoji: '🐲', name: 'Dragon', mood: 'FIERCE' },
  { id: 'hamster', emoji: '🐹', name: 'Hamster', mood: 'BUSY' },
  { id: 'otter', emoji: '🦦', name: 'Otter', mood: 'CUDDLY' },
  { id: 'sloth', emoji: '🦥', name: 'Sloth', mood: 'DREAMING' },
  { id: 'axolotl', emoji: '🦎', name: 'Axolotl', mood: 'SMILING' },
  { id: 'owl', emoji: '🦉', name: 'Owl', mood: 'WISE' },
  { id: 'bee', emoji: '🐝', name: 'Bee', mood: 'BUZZING' },
];

interface PetSelectorProps {
  onSelect: (pet: PetConfig) => void;
  onBack: () => void;
}

const PetSelector: React.FC<PetSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300 pb-12">
      <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-100">Pet Nursery</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Choose your spirit companion</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {PET_TYPES.map((pet) => (
            <button
              key={pet.id}
              onClick={() => onSelect(pet)}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center gap-3 transition-all hover:border-rose-500/50 hover:bg-slate-800 active:scale-95 group"
            >
              <div className="text-5xl group-hover:animate-bounce transition-transform duration-300">
                {pet.emoji}
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-200">{pet.name}</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">{pet.mood}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-8 text-center opacity-30">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-loose italic">
          "They keep you company while you're apart"
        </p>
      </div>
    </div>
  );
};

export default PetSelector;
