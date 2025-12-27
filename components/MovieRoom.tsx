
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Movie } from '../types';

interface MovieRoomProps {
  sharedMovie: Movie | null;
  watchlist: Movie[];
  onUpdateWatchlist: (list: Movie[]) => void;
  isPlaying: boolean;
  seekTime: number;
  partnerName: string;
  onSync: (action: string, payload?: any) => void;
  onUpload: (file: File) => void;
  onBack: () => void;
}

const MovieRoom: React.FC<MovieRoomProps> = ({ 
  sharedMovie, 
  watchlist,
  onUpdateWatchlist,
  isPlaying, 
  seekTime, 
  partnerName, 
  onSync, 
  onUpload,
  onBack 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'search'>('watchlist');
  const videoRef = useRef<HTMLVideoElement>(null);
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
        contents: `Find movie info or trailers for: "${searchQuery}". Return JSON array of 5 results.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                thumbnail: { type: Type.STRING },
                videoUrl: { type: Type.STRING },
                duration: { type: Type.NUMBER }
              },
              required: ['id', 'title', 'description', 'thumbnail', 'videoUrl', 'duration']
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
      setActiveTab('watchlist');
    }
  };

  const selectMovie = (movie: Movie) => onSync('SET_MOVIE', { movie });
  const togglePlay = () => onSync(isPlaying ? 'PAUSE' : 'PLAY');

  useEffect(() => {
    if (!videoRef.current || !sharedMovie?.videoUrl) return;
    if (isPlaying) {
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, sharedMovie?.videoUrl]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - seekTime) > 2) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLocalLoading = sharedMovie?.isLocal && !sharedMovie.videoUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 overflow-hidden relative">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg></button>
          <h2 className="font-semibold text-slate-200">Shared Theater</h2>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          <button onClick={() => setActiveTab('watchlist')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'watchlist' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Watchlist</button>
          <button onClick={() => setActiveTab('search')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Discover</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-40">
        <div className="bg-black aspect-video w-full flex items-center justify-center relative group">
          {sharedMovie ? (
            <>
              {sharedMovie.videoUrl ? (
                <video 
                  ref={videoRef} 
                  src={sharedMovie.videoUrl} 
                  className="w-full h-full object-contain" 
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} 
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-blue-500 animate-pulse">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Waking up High Quality Media...</p>
                </div>
              )}
              
              {!isLocalLoading && (
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-4">
                  <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSync('SEEK', { time: parseFloat(e.target.value) })} className="w-full h-1 accent-blue-500 cursor-pointer" />
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="p-2 text-white bg-blue-600 rounded-full shadow-lg active:scale-90 transition-transform">{isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}</button>
                        <span className="text-xs font-mono text-white/90">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Live with {partnerName}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 opacity-30">
               <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
               <p className="text-sm italic">Choose a movie to start the sync.</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600/10 border border-blue-500/30 rounded-2xl py-5 flex flex-col items-center gap-2 hover:bg-blue-600/20 transition-all group active:scale-[0.98]">
            <svg className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Upload High Quality Video</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
          </button>

          {activeTab === 'search' && (
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search trailers..." className="w-full bg-slate-900 border border-slate-800 rounded-full py-4 px-12 text-sm focus:outline-none focus:border-blue-500/50 text-slate-200" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{isSearching ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>}</div>
            </form>
          )}

          <div className="space-y-4">
            {(activeTab === 'watchlist' ? watchlist : searchResults).map((movie) => (
              <div key={movie.id} className={`flex gap-4 p-4 bg-slate-900/50 rounded-2xl border transition-all hover:bg-slate-800 group ${sharedMovie?.id === movie.id ? 'border-blue-500/50 bg-blue-500/5 shadow-xl' : 'border-slate-800'}`}>
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 cursor-pointer" onClick={() => selectMovie(movie)}>
                  <img src={movie.thumbnail} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                     <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${sharedMovie?.id === movie.id ? 'text-blue-400' : 'text-slate-100'}`}>{movie.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {movie.isLocal && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-black uppercase">4K High-Res</span>}
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{movie.isLocal ? 'Shared' : 'Preview'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieRoom;
