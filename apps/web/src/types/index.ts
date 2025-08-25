import { Socket } from 'socket.io-client';

export * from './simulation';

export interface AppProps {
  socket: Socket;
}

export type ToastVariant = 'default' | 'destructive' | null | undefined;
