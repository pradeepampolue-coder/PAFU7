
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  lastLogin: string;
  isOnline: boolean;
  role: 'A' | 'B';
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: number;
  read: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  isActive: boolean;
}

export interface VaultMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  timestamp: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  audioUrl: string;
  duration: number;
  isLocal?: boolean;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  isLocal?: boolean;
}

export interface PetConfig {
  id: string;
  emoji: string;
  name: string;
  mood: string;
}

export type AppView = 'dashboard' | 'chat' | 'location' | 'vault' | 'calling' | 'settings' | 'music' | 'movie';

export interface AppState {
  currentUser: User | null;
  otherUser: User | null;
  messages: Message[];
  locations: Record<string, Location>;
  vault: VaultMedia[];
  vaultUnlocked: boolean;
}
