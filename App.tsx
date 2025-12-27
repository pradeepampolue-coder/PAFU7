
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Peer, DataConnection, MediaConnection } from 'peerjs';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import LocationSharing from './components/LocationSharing';
import PrivateVault from './components/PrivateVault';
import Calling from './components/Calling';
import Settings from './components/Settings';
import SongRoom from './components/SongRoom';
import MovieRoom from './components/MovieRoom';
import { AppView, User, Message, Location, VaultMedia, Song, Movie } from './types';
import { PRE_APPROVED_USERS, VAULT_PASSWORD } from './constants';

const CHUNK_SIZE = 1024 * 512;

// IndexedDB Setup
const dbRequest = indexedDB.open("SanctuaryFiles", 2);
dbRequest.onupgradeneeded = (e: any) => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("media_meta")) db.createObjectStore("media_meta");
  if (!db.objectStoreNames.contains("media_chunks")) db.createObjectStore("media_chunks");
};

const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem('sanctuary_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });
  
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [vault, setVault] = useState<VaultMedia[]>([]);
  
  const [playlist, setPlaylist] = useState<Song[]>(() => JSON.parse(localStorage.getItem('pair_playlist') || '[]'));
  const [watchlist, setWatchlist] = useState<Movie[]>(() => JSON.parse(localStorage.getItem('pair_watchlist') || '[]'));

  const [sharedSong, setSharedSong] = useState<Song | null>(null);
  const [sharedMovie, setSharedMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [videoSeekTime, setVideoSeekTime] = useState(0);

  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [vaultPassword, setVaultPassword] = useState(() => localStorage.getItem('custom_vault_password') || VAULT_PASSWORD);

  // Calling States
  const [incomingCall, setIncomingCall] = useState<MediaConnection | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const transferBuffer = useRef<Record<string, any>>({});
  const activeObjectUrlRef = useRef<string | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const saveFileToLocalDB = async (id: string, base64Data: string, mimeType: string) => {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open("SanctuaryFiles", 2);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction(["media_meta", "media_chunks"], "readwrite");
        const numChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
        for (let i = 0; i < numChunks; i++) {
          const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          tx.objectStore("media_chunks").put(chunk, `${id}_${i}`);
        }
        tx.objectStore("media_meta").put({ id, numChunks, mimeType }, id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
    });
  };

  const getFileUrlFromLocalDB = async (id: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const dbRequest = indexedDB.open("SanctuaryFiles", 2);
      dbRequest.onsuccess = async () => {
        const db = dbRequest.result;
        const metaTx = db.transaction("media_meta", "readonly");
        const metaReq = metaTx.objectStore("media_meta").get(id);
        metaReq.onsuccess = async () => {
          const meta = metaReq.result;
          if (!meta) return resolve(null);
          const chunkTx = db.transaction("media_chunks", "readonly");
          const chunkStore = chunkTx.objectStore("media_chunks");
          const binaryChunks: Uint8Array[] = [];
          for (let i = 0; i < meta.numChunks; i++) {
            const base64Chunk = await new Promise<string>((res) => {
              const req = chunkStore.get(`${id}_${i}`);
              req.onsuccess = () => res(req.result);
              req.onerror = () => res("");
            });
            if (base64Chunk) {
              const pureBase64 = i === 0 ? base64Chunk.split(',')[1] || base64Chunk : base64Chunk;
              const binaryString = atob(pureBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
              binaryChunks.push(bytes);
            }
          }
          if (binaryChunks.length === 0) return resolve(null);
          const blob = new Blob(binaryChunks, { type: meta.mimeType || 'video/mp4' });
          if (activeObjectUrlRef.current) URL.revokeObjectURL(activeObjectUrlRef.current);
          const url = URL.createObjectURL(blob);
          activeObjectUrlRef.current = url;
          resolve(url);
        };
      };
    });
  };

  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio(RINGTONE_URL);
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(e => console.log("Audio play blocked by browser."));
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const handleIncomingData = async (data: any) => {
    if (data.type === 'MSG') {
      setIsOtherUserTyping(false);
      setMessages(prev => {
        if (prev.some(m => m.id === data.payload.id)) return prev;
        const updated = [...prev, data.payload];
        localStorage.setItem('pair_messages', JSON.stringify(updated));
        return updated;
      });
    } else if (data.type === 'MUSIC_SYNC') {
      if (data.action === 'SET_SONG') {
        const song = data.song as Song;
        if (song.isLocal) {
          const localUrl = await getFileUrlFromLocalDB(song.id);
          setSharedSong({ ...song, audioUrl: localUrl || "" });
        } else { setSharedSong(song); }
      }
      if (data.action === 'PLAY') setIsPlaying(true);
      if (data.action === 'PAUSE') setIsPlaying(false);
      if (data.action === 'SEEK') setSeekTime(data.time);
    } else if (data.type === 'MOVIE_SYNC') {
      if (data.action === 'SET_MOVIE') {
        const movie = data.movie as Movie;
        if (movie.isLocal) {
          const localUrl = await getFileUrlFromLocalDB(movie.id);
          setSharedMovie({ ...movie, videoUrl: localUrl || "" });
        } else { setSharedMovie(movie); }
      }
      if (data.action === 'PLAY') setIsVideoPlaying(true);
      if (data.action === 'PAUSE') setIsVideoPlaying(false);
      if (data.action === 'SEEK') setVideoSeekTime(data.time);
    } else if (data.type === 'TYPING_START') setIsOtherUserTyping(true);
    else if (data.type === 'TYPING_STOP') setIsOtherUserTyping(false);
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const myId = `sanct_v8_${currentUser.email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const otherUser = PRE_APPROVED_USERS.find(u => u.id !== currentUser.id)!;
    const partnerId = `sanct_v8_${otherUser.email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const peer = new Peer(myId, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      debug: 0
    });
    peerRef.current = peer;

    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('data', handleIncomingData);
      conn.on('open', () => setIsOtherUserOnline(true));
      conn.on('close', () => setIsOtherUserOnline(false));
    });

    peer.on('call', (call) => {
      setIncomingCall(call);
      playRingtone();
      showNotification("Incoming Call", `${otherUser.name} is calling you...`);
    });

    const setupPartnerConn = () => {
      const conn = peer.connect(partnerId, { reliable: true });
      connRef.current = conn;
      conn.on('data', handleIncomingData);
      conn.on('open', () => setIsOtherUserOnline(true));
      conn.on('close', () => setIsOtherUserOnline(false));
    };

    peer.on('open', setupPartnerConn);

    return () => peer.destroy();
  }, [currentUser]);

  const onUploadLocalFile = async (file: File, type: 'song' | 'movie') => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const fileId = `local_${Date.now()}`;
      const fullMetadata = {
        id: fileId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: type === 'song' ? "Private Hi-Fi" : undefined,
        description: type === 'movie' ? "Shared Cinema" : undefined,
        thumbnail: `https://picsum.photos/seed/${fileId}/800/450`,
        audioUrl: "", videoUrl: "", isLocal: true, duration: 0
      };
      await saveFileToLocalDB(fileId, base64Data, file.type);
      if (type === 'song') {
        const updated = [...playlist, fullMetadata as Song];
        setPlaylist(updated);
        localStorage.setItem('pair_playlist', JSON.stringify(updated));
      } else {
        const updated = [...watchlist, fullMetadata as Movie];
        setWatchlist(updated);
        localStorage.setItem('pair_watchlist', JSON.stringify(updated));
      }
      if (connRef.current?.open) {
        const numChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
        connRef.current.send({ type: 'FILE_CHUNK_START', fileId, totalChunks: numChunks, metadata: fullMetadata, mediaType: type, mimeType: file.type });
        for (let i = 0; i < numChunks; i++) {
          const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          connRef.current.send({ type: 'FILE_CHUNK', fileId, index: i, chunk });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSyncAction = async (type: 'MUSIC' | 'MOVIE', action: string, payload: any) => {
    if (action === 'SET_SONG') {
      const song = payload.song as Song;
      if (song.isLocal) {
        setSharedSong({ ...song, audioUrl: "" }); 
        const localUrl = await getFileUrlFromLocalDB(song.id);
        setSharedSong({ ...song, audioUrl: localUrl || "" });
      } else { setSharedSong(song); }
    } else if (action === 'SET_MOVIE') {
      const movie = payload.movie as Movie;
      if (movie.isLocal) {
        setSharedMovie({ ...movie, videoUrl: "" }); 
        const localUrl = await getFileUrlFromLocalDB(movie.id);
        setSharedMovie({ ...movie, videoUrl: localUrl || "" });
      } else { setSharedMovie(movie); }
    }
    if (type === 'MUSIC') {
       if (action === 'PLAY') setIsPlaying(true);
       if (action === 'PAUSE') setIsPlaying(false);
       if (action === 'SEEK') setSeekTime(payload.time);
    } else {
       if (action === 'PLAY') setIsVideoPlaying(true);
       if (action === 'PAUSE') setIsVideoPlaying(false);
       if (action === 'SEEK') setVideoSeekTime(payload.time);
    }
    connRef.current?.send({ type: `${type}_SYNC`, action, ...payload });
  };

  const navigateTo = (view: AppView) => {
    window.history.pushState({ view }, '', '');
    setActiveView(view);
  };

  if (!currentUser) return <Auth onLogin={(email) => {
    const user = PRE_APPROVED_USERS.find(u => u.email === email);
    if (user) { setCurrentUser(user); localStorage.setItem('sanctuary_session', JSON.stringify(user)); navigateTo('dashboard'); }
  }} />;

  const otherUser = PRE_APPROVED_USERS.find(u => u.id !== currentUser.id)!;
  const partnerId = `sanct_v8_${otherUser.email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden relative">
      {/* INCOMING CALL NOTIFICATION OVERLAY */}
      {incomingCall && activeView !== 'calling' && (
        <div className="fixed top-6 left-4 right-4 z-[200] animate-in slide-in-from-top duration-500">
           <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xl relative">
                    <span className="absolute inset-0 bg-rose-600 rounded-full animate-ping opacity-20"></span>
                    {otherUser.name[0]}
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-white">{otherUser.name} is calling</h4>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Incoming Private Stream</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => { incomingCall.close(); setIncomingCall(null); stopRingtone(); }}
                  className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/30 active:scale-90 transition-transform"
                 >
                    <svg className="w-6 h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
                 </button>
                 <button 
                  onClick={() => { navigateTo('calling'); stopRingtone(); }}
                  className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform animate-bounce"
                 >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
                 </button>
              </div>
           </div>
        </div>
      )}

      <main className="max-w-xl mx-auto pb-24 relative z-10">
        {activeView === 'dashboard' && <Dashboard currentUser={currentUser} otherUser={{ ...otherUser, isOnline: isOtherUserOnline }} onNavigate={navigateTo} />}
        {activeView === 'chat' && <Chat messages={messages} onSend={(text) => {
          const msg = { id: Date.now().toString(), senderId: currentUser.id, text, timestamp: Date.now(), read: false };
          setMessages([...messages, msg]);
          connRef.current?.send({ type: 'MSG', payload: msg, senderId: currentUser.id });
        }} onTyping={(t) => connRef.current?.send({ type: t ? 'TYPING_START' : 'TYPING_STOP' })} isPartnerTyping={isOtherUserTyping} partnerName={otherUser.name} onClear={() => setMessages([])} currentUserId={currentUser.id} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'music' && <SongRoom sharedSong={sharedSong} playlist={playlist} onUpdatePlaylist={(p) => { setPlaylist(p); localStorage.setItem('pair_playlist', JSON.stringify(p)); connRef.current?.send({type: 'PLAYLIST_SYNC', playlist: p}); }} isPlaying={isPlaying} seekTime={seekTime} partnerName={otherUser.name} onSync={(action, payload) => handleSyncAction('MUSIC', action, payload)} onUpload={(f) => onUploadLocalFile(f, 'song')} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'movie' && <MovieRoom sharedMovie={sharedMovie} watchlist={watchlist} onUpdateWatchlist={(w) => { setWatchlist(w); localStorage.setItem('pair_watchlist', JSON.stringify(w)); connRef.current?.send({type: 'WATCHLIST_SYNC', watchlist: w}); }} isPlaying={isVideoPlaying} seekTime={videoSeekTime} partnerName={otherUser.name} onSync={(action, payload) => handleSyncAction('MOVIE', action, payload)} onUpload={(f) => onUploadLocalFile(f, 'movie')} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'location' && <LocationSharing locations={locations} onUpdate={(loc) => connRef.current?.send({ type: 'LOC', payload: loc, senderId: currentUser.id })} otherUser={otherUser} currentUserId={currentUser.id} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'vault' && <PrivateVault media={vault} password={vaultPassword} onAdd={(m) => setVault([...vault, m])} onRemove={(id) => setVault(vault.filter(v => v.id !== id))} onShare={() => {}} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'settings' && <Settings currentUser={currentUser} vaultPassword={vaultPassword} onVaultPassUpdate={(p) => { setVaultPassword(p); connRef.current?.send({type: 'VAULT_SYNC', payload: p}); }} onLogout={() => { setCurrentUser(null); localStorage.removeItem('sanctuary_session'); }} onBack={() => navigateTo('dashboard')} />}
        {activeView === 'calling' && (
          <Calling 
            isIncoming={!!incomingCall} 
            activeCall={incomingCall} 
            callerName={otherUser.name} 
            peer={peerRef.current} 
            targetPeerId={partnerId} 
            onAccepted={() => { setIncomingCall(null); stopRingtone(); }}
            onClose={() => { navigateTo('dashboard'); setIncomingCall(null); stopRingtone(); }} 
          />
        )}
      </main>

      {activeView !== 'calling' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center p-4 z-[60] pb-8">
           <button onClick={() => navigateTo('dashboard')} className={`p-2 transition-all active:scale-90 ${activeView === 'dashboard' ? 'text-rose-500' : 'text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></button>
           <button onClick={() => navigateTo('music')} className={`p-2 transition-all active:scale-90 ${activeView === 'music' ? 'text-rose-500' : 'text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg></button>
           <button onClick={() => navigateTo('movie')} className={`p-2 transition-all active:scale-90 ${activeView === 'movie' ? 'text-rose-500' : 'text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></button>
           <button onClick={() => navigateTo('chat')} className={`p-2 transition-all active:scale-90 ${activeView === 'chat' ? 'text-rose-500' : 'text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></button>
           <button onClick={() => navigateTo('location')} className={`p-2 transition-all active:scale-90 ${activeView === 'location' ? 'text-rose-500' : 'text-slate-500'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
        </nav>
      )}
    </div>
  );
};

export default App;
