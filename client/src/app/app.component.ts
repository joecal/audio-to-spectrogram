import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SocketService } from './socket.service';

interface SpectrogramType {
  value: string;
  viewValue: string;
}

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'audio-to-spectrogram-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  spectrogramForm: FormGroup;
  logMessage: string;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private socketService: SocketService,
  ) {
    this.spectrogramForm = this.formBuilder.group({
      files: ['', Validators.required],
      type: ['', Validators.required],
      resolution: ['', Validators.required],
    });
    this.logMessage = 'test';
    this.socketService.logSubject.subscribe((message: string) => {
      this.logMessage = message;
    });
  }

  onFilesChanged(inputEvent: Event) {
    console.log('inputEvent: ', inputEvent);
    const event: HTMLInputEvent = inputEvent as HTMLInputEvent;
    if (event.target.files && event.target.files.length) {
      console.log('event.target.files: ', event.target.files);
      const selectedFiles = event.target.files;
      const start = async () => {
        try {
          await this.asyncForEach(
            selectedFiles as any,
            async (file: File) => {
              const response = await this.readFile(file);
              console.log('response: ', response);
            },
          );
          console.log('Done');
        } catch (error) {
          console.error(error);
        }
      };
      start();
    }
  }

  private async readFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const response = await this.sendToServer(
          file.name,
          reader.result as string,
        );
        resolve(response);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
    });
  }

  private async sendToServer(
    fileName: string,
    fileContent: string,
  ): Promise<any> {
    return this.http
      .post('http://localhost:8080/file', {
        name: fileName,
        content: fileContent,
      })
      .toPromise()
      .then((response: any) => response);
  }

  private async asyncForEach(
    array: any[],
    callback: Function,
  ): Promise<void> {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
}
