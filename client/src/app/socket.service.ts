import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from '../environments/environment';

@Injectable()
export class SocketService {
  socket: any;
  logSubject: Subject<any>;

  constructor() {
    this.socket = io(environment.socketBaseUrl, {
      transports: ['websocket', 'polling'],
    });
    this.logSubject = new Subject();
    this.initSocketListeners();
  }

  private initSocketListeners(): void {
    this.socket.on('connect', () => {
      console.info('Socket connected!');
    });
    this.socket.on('reconnect_attempt', (attemptCount: number) => {
      console.log('Socket reconnect attempt count: ', attemptCount);
    });
    this.socket.on('disconnect', () => {
      console.error('Socket disconnected!');
    });
    this.socket.on('log', (message: string) => {
      console.log('log: ', message);
      this.logSubject.next(message);
    });
  }
}
