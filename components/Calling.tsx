
import React, { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';

interface CallingProps {
  isIncoming: boolean;
  onClose: () => void;
  callerName: string;
  peer?: Peer | null;
  activeCall?: any;
  targetPeerId?: string;
  onAccepted?: () => void;
}

const Calling: React.FC<CallingProps> = ({ isIncoming, onClose, callerName, peer, activeCall, targetPeerId, onAccepted }) => {
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [timer, setTimer] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<any>(activeCall);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (status === 'connected') {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // CRITICAL: Attach streams to video elements whenever they change OR status changes (causing re-render)
  useEffect(() => {
    if (status === 'connected') {
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    } else if (status === 'ringing' && localStream && localVideoRef.current) {
      // Show local preview while ringing if available
      localVideoRef.current.srcObject = localStream;
    }
  }, [status, localStream, remoteStream]);

  const handleStream = (stream: MediaStream) => {
    console.log("Remote stream received");
    setRemoteStream(stream);
    setStatus('connected');
  };

  // Logic for OUTGOING call
  useEffect(() => {
    if (!isIncoming && peer && targetPeerId && !callRef.current) {
      const startOutgoingCall = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: true 
          });
          setLocalStream(stream);

          const call = peer.call(targetPeerId, stream);
          callRef.current = call;
          call.on('stream', handleStream);
          call.on('close', onClose);
          call.on('error', (err: any) => {
            console.error("Call error:", err);
            onClose();
          });
        } catch (err) {
          console.error("Media access error:", err);
          alert("Please allow camera and microphone access to call.");
          onClose();
        }
      };
      startOutgoingCall();
    }
  }, [isIncoming, peer, targetPeerId]);

  // Logic for INCOMING call (listening for the other side's stream)
  useEffect(() => {
    if (isIncoming && activeCall) {
      callRef.current = activeCall;
      // We don't call answer here yet; wait for user to click "Accept"
    }
  }, [isIncoming, activeCall]);

  const handleAcceptClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      setLocalStream(stream);
      
      if (callRef.current) {
        callRef.current.answer(stream);
        callRef.current.on('stream', handleStream);
        callRef.current.on('close', onClose);
        callRef.current.on('error', onClose);
        if (onAccepted) onAccepted();
      }
    } catch (err) {
      console.error("Media access error:", err);
      alert("Permission denied. Check camera settings.");
      onClose();
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (callRef.current) {
      callRef.current.close();
    }
    onClose();
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between p-6 animate-in fade-in duration-500 overflow-hidden">
      {/* BACKGROUND / VIDEO LAYER */}
      <div className="absolute inset-0 z-0 bg-black">
        {status === 'connected' ? (
          <>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Small floating local video */}
            <div className="absolute top-6 right-6 w-28 h-40 bg-slate-900 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-30 grayscale blur-sm"
            />
          </div>
        )}
      </div>

      {/* UI OVERLAY */}
      <div className="relative z-20 mt-20 flex flex-col items-center w-full">
        {status === 'ringing' && (
          <div className="relative mb-12">
            <div className="w-32 h-32 bg-slate-900/80 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-rose-500/30 relative z-10">
              <span className="text-4xl font-serif font-bold text-white uppercase">{callerName[0]}</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-pulse-ring scale-150"></div>
            <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-pulse-ring delay-700 scale-125"></div>
          </div>
        )}
        
        <h2 className="text-4xl font-serif font-bold text-white mb-3 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{callerName}</h2>
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 shadow-xl">
          <span className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'} animate-pulse`}></span>
          <span className="text-white uppercase tracking-[0.25em] text-[10px] font-black">
            {status === 'ringing' ? (isIncoming ? 'Incoming Call' : 'Ringing...') : `Live Connection • ${formatTime(timer)}`}
          </span>
        </div>
      </div>

      <div className="relative z-20 mb-20 w-full max-w-sm flex items-center justify-center gap-12">
        {status === 'ringing' && isIncoming ? (
          <>
            <button 
              onClick={handleEndCall}
              className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-950/60 transition-all hover:scale-110 active:scale-90"
            >
              <svg className="w-10 h-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
            </button>
            <button 
              onClick={handleAcceptClick}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-950/60 transition-all hover:scale-110 active:scale-90 animate-bounce"
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
            </button>
          </>
        ) : (
          <button 
            onClick={handleEndCall}
            className="w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-950/60 transition-all hover:scale-110 active:scale-90"
          >
            <svg className="w-10 h-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/></svg>
          </button>
        )}
      </div>

      <div className="absolute bottom-10 z-20 text-[10px] text-white/40 uppercase tracking-[0.3em] font-black px-12 text-center">
        P2P Encrypted Sanctuary Stream
      </div>
    </div>
  );
};

export default Calling;
