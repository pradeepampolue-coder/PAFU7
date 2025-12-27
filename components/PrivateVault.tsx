
import React, { useState, useEffect } from 'react';
import { VaultMedia } from '../types';
import { VAULT_TIMEOUT } from '../constants';

interface VaultProps {
  media: VaultMedia[];
  password: string;
  onAdd: (m: VaultMedia) => void;
  onRemove: (id: string) => void;
  onShare: (url: string, type: 'image' | 'video') => void;
  onBack: () => void;
}

const PrivateVault: React.FC<VaultProps> = ({ media, password, onAdd, onRemove, onShare, onBack }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<VaultMedia | null>(null);

  useEffect(() => {
    let timeout: number;
    if (isUnlocked) {
      timeout = window.setTimeout(() => {
        setIsUnlocked(false);
        setInputPassword('');
        setSelectedItem(null);
      }, VAULT_TIMEOUT);
    }
    return () => clearTimeout(timeout);
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === password) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Invalid Vault Key');
      setInputPassword('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAdd({
          id: Date.now().toString(),
          url: reader.result as string,
          type: file.type.startsWith('video') ? 'video' : 'image',
          timestamp: Date.now()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = () => {
    if (selectedItem) {
      onShare(selectedItem.url, selectedItem.type);
      setSelectedItem(null);
    }
  };

  const handleDelete = () => {
    if (selectedItem && confirm("Permanently remove from vault?")) {
      onRemove(selectedItem.id);
      setSelectedItem(null);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 border border-slate-800">
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Secret Vault</h2>
        <p className="text-slate-500 text-sm mb-8">Enter the secondary key to reveal contents</p>
        
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Vault Password"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center text-rose-500 font-mono tracking-widest focus:outline-none focus:border-rose-500/50"
            autoFocus
          />
          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 font-semibold transition-all active:scale-95"
          >
            Unlock Access
          </button>
          <button 
            type="button"
            onClick={onBack}
            className="w-full py-2 text-slate-600 hover:text-slate-400 text-sm"
          >
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-in slide-in-from-right duration-300 bg-slate-950 relative">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="font-semibold text-slate-200">The Vault</h2>
        </div>
        <div className="flex gap-2">
          <label className="p-2 bg-rose-600 rounded-full text-white cursor-pointer hover:bg-rose-500 transition-colors">
            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          </label>
          <button onClick={() => setIsUnlocked(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {media.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700">
            <p className="text-sm font-light italic">"Our hidden moments live here."</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden group border border-slate-800 cursor-pointer hover:border-rose-500/50 transition-colors"
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt="Vault item" className="w-full h-full object-cover" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                   <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Viewer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
           <header className="p-4 flex items-center justify-between z-10">
              <button onClick={() => setSelectedItem(null)} className="p-3 text-slate-400 hover:text-white bg-slate-900/50 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={handleShare}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Share to Chat
                </button>
                <button onClick={handleDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
           </header>
           
           <div className="flex-1 flex items-center justify-center p-4">
              {selectedItem.type === 'image' ? (
                <img src={selectedItem.url} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Vault Preview" />
              ) : (
                <video src={selectedItem.url} controls autoPlay className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              )}
           </div>

           <footer className="p-8 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Vault Protected Item • {new Date(selectedItem.timestamp).toLocaleString()}</p>
           </footer>
        </div>
      )}
      
      <footer className="p-4 text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Vault locks automatically in 5 minutes</p>
      </footer>
    </div>
  );
};

export default PrivateVault;
