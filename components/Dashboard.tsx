
import React from 'react';
import { User, AppView } from '../types';

interface DashboardProps {
  currentUser: User;
  otherUser: User;
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, otherUser, onNavigate }) => {
  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('settings')}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
          <div>
            <h2 className="text-slate-400 text-sm font-light mb-1">Welcome, {currentUser.name}</h2>
            <h1 className="text-3xl font-serif font-bold text-rose-500">Sanctuary</h1>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${otherUser.isOnline ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {otherUser.name} {otherUser.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Direct P2P Tunnel Active</span>
        </div>
      </header>

      {/* Hero Action: Call Partner */}
      <button 
        onClick={() => onNavigate('calling')}
        className={`w-full relative group overflow-hidden h-36 rounded-[2.5rem] border-2 transition-all ${otherUser.isOnline ? 'bg-rose-600/10 border-rose-500/30' : 'bg-slate-900 border-slate-800 opacity-60'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${otherUser.isOnline ? 'bg-rose-600 animate-pulse text-white shadow-2xl shadow-rose-900/40' : 'bg-slate-800 text-slate-500'}`}>
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
            </div>
            <div className="text-center">
                <p className="text-xs font-bold text-white uppercase tracking-widest">
                    {otherUser.isOnline ? `Call ${otherUser.name}` : 'Partner is Offline'}
                </p>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Encrypted Video Sanctuary</p>
            </div>
        </div>
      </button>

      {/* Main Feature Grid */}
      <div className="space-y-4">
        {/* Featured: Movie Room (Full Width) */}
        <button 
          onClick={() => onNavigate('movie')}
          className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-[2.5rem] flex items-center gap-6 transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600/20 transition-colors shrink-0">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-100 block">Movie Room</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter mt-1 block">Watch synchronized cinema together</span>
          </div>
        </button>

        {/* 2x2 Sub Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('chat')}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Messages</span>
          </button>

          <button 
            onClick={() => onNavigate('music')}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Song Room</span>
          </button>

          <button 
            onClick={() => onNavigate('location')}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Live GPS</span>
          </button>

          <button 
            onClick={() => onNavigate('vault')}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 group"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Media Vault</span>
          </button>
        </div>
      </div>

      <footer className="bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
           <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">End-to-End Encryption</h4>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed italic">
          Your digital sanctuary is secure. Real-time sync for movies and music is active.
          The Private Vault is currently {currentUser.isOnline ? 'locked and protected' : 'offline'}.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
