import { Component, ElementRef, ViewChild } from '@angular/core';
import { SocketService } from '../socket.service';

@Component({
  selector: 'audio-to-spectrogram-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
})
export class BottomSheetComponent {
  @ViewChild('messageContainer')
  messageContainer: ElementRef;
  messages: string[];

  constructor(private socketService: SocketService) {
    this.messages = [];
    this.socketService.logSubject.subscribe((message: string) => {
      this.messages.push(message);
      this.scrollToBottom();
    });
  }

  scrollToBottom(): void {
    this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
  }
}
