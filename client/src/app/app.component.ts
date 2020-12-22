import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SocketService } from './socket.service';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';

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
export class AppComponent implements OnInit {
  spectrogramForm: FormGroup;
  logMessage: string;
  spectrograms: any[];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private socketService: SocketService,
    private bottomSheet: MatBottomSheet,
  ) {
    this.spectrogramForm = this.formBuilder.group({
      files: ['', Validators.required],
      type: ['', Validators.required],
      resolution: ['', Validators.required],
    });
    this.spectrograms = [];
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.spectrograms = await this.getSpectrograms();
    } catch (error) {
      console.log(error);
    }
  }

  async getSpectrograms(): Promise<any> {
    return this.http
      .get('http://localhost:8080/spectrograms')
      .toPromise()
      .then((response: any) => response);
  }

  openBottomSheet(): void {
    this.bottomSheet.open(BottomSheetComponent);
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
              this.openBottomSheet();
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
