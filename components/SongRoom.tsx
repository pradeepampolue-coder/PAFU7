
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Song } from '../types';

interface SongRoomProps {
  sharedSong: Song | null;
  playlist: Song[];
  onUpdatePlaylist: (playlist: Song[]) => void;
  isPlaying: boolean;
  seekTime: number;
  partnerName: string;
  onSync: (action: string, payload?: any) => void;
  onUpload: (file: File) => void;
  onBack: () => void;
}

const SongRoom: React.FC<SongRoomProps> = ({ 
  sharedSong, 
  playlist,
  onUpdatePlaylist,
  isPlaying, 
  seekTime, 
  partnerName, 
  onSync, 
  onUpload,
  onBack 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'search'>('library');
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search music info for: "${searchQuery}". Return JSON array of 5 songs.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                thumbnail: { type: Type.STRING },
                audioUrl: { type: Type.STRING },
                duration: { type: Type.NUMBER }
              },
              required: ['id', 'title', 'artist', 'thumbnail', 'audioUrl', 'duration']
            }
          }
        }
      });
      setSearchResults(JSON.parse(response.text));
    } finally { setIsSearching(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      setActiveTab('library');
    }
  };

  const selectSong = (song: Song) => onSync('SET_SONG', { song });
  const addToLibrary = (song: Song) => !playlist.some(s => s.id === song.id) && onUpdatePlaylist([...playlist, song]);
  const removeFromLibrary = (id: string) => onUpdatePlaylist(playlist.filter(s => s.id !== id));
  const togglePlay = () => onSync(isPlaying ? 'PAUSE' : 'PLAY');

  useEffect(() => {
    if (!audioRef.current || !sharedSong?.audioUrl) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, sharedSong?.audioUrl]);

  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - seekTime) > 1.5) {
      audioRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  const isLocalLoading = sharedSong?.isLocal && !sharedSong.audioUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 overflow-hidden relative">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg></button>
          <h2 className="font-semibold text-slate-200">Shared Rhythm</h2>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          <button onClick={() => setActiveTab('library')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'library' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Library</button>
          <button onClick={() => setActiveTab('search')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'search' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>Search</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40">
        <div className="flex gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-rose-600/10 border border-rose-500/30 rounded-2xl py-4 flex flex-col items-center gap-2 hover:bg-rose-600/20 transition-all group active:scale-95">
            <svg className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Upload Hi-Fi Track</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
          </button>
        </div>

        {activeTab === 'search' ? (
          <form onSubmit={handleSearch} className="relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search online tracks..." className="w-full bg-slate-900 border border-slate-800 rounded-full py-4 px-12 text-sm focus:outline-none focus:border-rose-500/50 text-slate-200" />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{isSearching ? <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>}</div>
          </form>
        ) : null}

        <div className="space-y-4">
          {(activeTab === 'library' ? playlist : searchResults).map((song) => (
            <div key={song.id} className={`flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border transition-all group hover:bg-slate-800 ${sharedSong?.id === song.id ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-800'}`}>
              <div className="relative w-12 h-12 shrink-0 cursor-pointer" onClick={() => selectSong(song)}>
                <img src={song.thumbnail} className="w-full h-full rounded-xl object-cover" alt="" />
                {sharedSong?.id === song.id && isPlaying && (
                  <div className="absolute inset-0 bg-rose-600/20 flex items-center justify-center rounded-xl">
                    <div className="flex gap-1 h-3 items-end">
                      <div className="w-0.5 bg-rose-400 animate-[bounce_0.6s_infinite]"></div>
                      <div className="w-0.5 bg-rose-400 animate-[bounce_0.6s_0.2s_infinite]"></div>
                      <div className="w-0.5 bg-rose-400 animate-[bounce_0.6s_0.4s_infinite]"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => selectSong(song)}>
                <p className={`text-sm font-bold truncate ${sharedSong?.id === song.id ? 'text-rose-500' : 'text-slate-200'}`}>{song.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{song.artist}</p>
                  {song.isLocal && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-black uppercase">Hi-Fi</span>}
                </div>
              </div>
              {activeTab === 'search' && <button onClick={() => addToLibrary(song)} className="p-2 text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></button>}
              {activeTab === 'library' && <button onClick={() => removeFromLibrary(song.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>}
            </div>
          ))}
        </div>
      </div>

      {sharedSong && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 p-4 flex items-center gap-4 shadow-2xl relative">
            {isLocalLoading && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center z-10">
                 <div className="flex items-center gap-3 text-rose-500">
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Reading Local Audio...</span>
                 </div>
              </div>
            )}
            <img src={sharedSong.thumbnail} className="w-14 h-14 rounded-2xl object-cover shadow-lg" alt="" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-100 truncate">{sharedSong.title}</h4>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest truncate">{sharedSong.artist}</p>
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSync('SEEK', { time: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-lg appearance-none accent-rose-500 mt-2 cursor-pointer" />
            </div>
            <button onClick={togglePlay} className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">{isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}</button>
          </div>
        </div>
      )}
      {sharedSong?.audioUrl && <audio ref={audioRef} src={sharedSong.audioUrl} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => onSync('PAUSE')} />}
    </div>
  );
};

export default SongRoom;
