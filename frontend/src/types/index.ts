export interface User {
  id: string;
  nickname: string;
  country: string;
  city: string;
  radius: number;
  language: string;
  contacts: {
    telegram?: string;
    phone?: string;
    email?: string;
  };
  createdAt: Date;
  registrationDate?: string;
  banned?: boolean;
}

export interface Listing {
  id: string;
  serialNumber: string;
  userId: string;
  userNickname: string;
  category: string;
  title: string;
  description: string;
  price: number | null;
  negotiable: boolean;
  city: string;
  country: string;
  photos: string[];
  status: 'active' | 'hidden' | 'rejected' | 'deleted';
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  listingId: string;
  participants: {
    userId: string;
    nickname: string;
    contactsShared: boolean;
    contacts?: {
      telegram?: string;
      phone?: string;
      email?: string;
    };
  }[];
  messages: Message[];
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  isSystemMessage?: boolean;
  createdAt: Date;
}

export interface Report {
  id: string;
  listingSerialNumber: string;
  reporterId: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type Language = 'ru' | 'en' | 'uk' | 'de' | 'fr' | 'es' | 'pl';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
}
