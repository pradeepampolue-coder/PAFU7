
import React, { useState } from 'react';
import { User } from '../types';
import { PRE_APPROVED_USERS } from '../constants';

interface SettingsProps {
  currentUser: User;
  vaultPassword: string;
  onVaultPassUpdate: (pass: string) => void;
  onLogout: () => void;
  onBack: () => void;
}

type SettingsAction = 'login_pass' | 'vault_pass' | 'email';

const Settings: React.FC<SettingsProps> = ({ currentUser, vaultPassword, onVaultPassUpdate, onLogout, onBack }) => {
  const [loginPass, setLoginPass] = useState('');
  const [newVaultPass, setNewVaultPass] = useState('');
  const [newEmail, setNewEmail] = useState(currentUser.email);
  const [success, setSuccess] = useState('');
  
  // Verification Gate State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<SettingsAction | null>(null);
  const [verifyError, setVerifyError] = useState('');

  const triggerVerification = (action: SettingsAction) => {
    setPendingAction(action);
    setIsVerifying(true);
    setVerifyError('');
  };

  const handleVerifyAndExecute = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against current custom pass or default pre-approved pass
    const customPass = localStorage.getItem(`custom_pass_${currentUser.email}`);
    const currentValidPass = customPass || PRE_APPROVED_USERS.find(u => u.id === currentUser.id)?.password;

    if (verifyPassword === currentValidPass) {
      executeAction();
      setIsVerifying(false);
      setVerifyPassword('');
      setPendingAction(null);
    } else {
      setVerifyError('Verification failed. Incorrect password.');
      setVerifyPassword('');
    }
  };

  const executeAction = () => {
    switch (pendingAction) {
      case 'login_pass':
        if (loginPass.length < 8) return alert("Password must be at least 8 characters.");
        localStorage.setItem(`custom_pass_${currentUser.email}`, loginPass);
        setLoginPass('');
        showSuccess('Login password updated.');
        break;
      case 'vault_pass':
        if (newVaultPass.length < 8) return alert("Vault password must be at least 8 characters.");
        onVaultPassUpdate(newVaultPass);
        setNewVaultPass('');
        showSuccess('Vault key synced with partner.');
        break;
      case 'email':
        if (!newEmail.includes('@')) return alert("Please enter a valid Gmail address.");
        // Update local storage session
        const updatedUser = { ...currentUser, email: newEmail.toLowerCase() };
        localStorage.setItem('sanctuary_session', JSON.stringify(updatedUser));
        showSuccess('Identity updated. Restart app to apply.');
        break;
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in slide-in-from-right duration-300 relative">
      <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="font-semibold text-slate-200">Security & Identity</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-2xl text-center font-bold animate-bounce">
            {success}
          </div>
        )}

        {/* IDENTITY SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Gmail Identity</h3>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">Your email is used to generate your private P2P tunnel ID. Changing this affects how your partner finds you.</p>
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Partner Linked Gmail" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-slate-200"
            />
            <button 
              onClick={() => triggerVerification('email')}
              className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Update Identity
            </button>
          </div>
        </section>

        {/* LOGIN PASSWORD SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Personal Login Key</h3>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">This password is required to unlock this app on this device.</p>
            <input 
              type="password" 
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="New Personal Password" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50 text-slate-200"
            />
            <button 
              onClick={() => triggerVerification('login_pass')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Change Personal Key
            </button>
          </div>
        </section>

        {/* SHARED VAULT SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Global Vault Key</h3>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">Updating this will sync the new vault password to your partner's device automatically.</p>
            <input 
              type="password" 
              value={newVaultPass}
              onChange={(e) => setNewVaultPass(e.target.value)}
              placeholder="New Shared Vault Key" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 text-slate-200"
            />
            <button 
              onClick={() => triggerVerification('vault_pass')}
              className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Sync New Vault Key
            </button>
          </div>
        </section>

        {/* LOGOUT SECTION */}
        <section className="pt-4">
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout Sanctuary
          </button>
        </section>

        <div className="pt-8 text-center space-y-2 opacity-40">
           <div className="h-[1px] w-8 bg-slate-800 mx-auto"></div>
           <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-loose">P2P Encryption Active<br/>No database storage utilized</p>
        </div>
      </div>

      {/* SECURITY GATE MODAL */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-200">Confirm Access</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Please enter your current personal key to authorize changes.</p>
            </div>

            <form onSubmit={handleVerifyAndExecute} className="space-y-4">
              <input 
                type="password"
                autoFocus
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-rose-500 font-mono tracking-widest focus:outline-none focus:border-rose-500/50"
              />
              {verifyError && <p className="text-rose-500 text-[10px] text-center font-bold uppercase">{verifyError}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsVerifying(false)}
                  className="py-3 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-950/40"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
