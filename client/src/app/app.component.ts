import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SocketService } from './socket.service';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSelectChange } from '@angular/material/select';

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
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('selectFilesToolTip') selectFilesToolTip: MatTooltip;
  @ViewChild('selectSpecToolTip') selectSpecToolTip: MatTooltip;
  @ViewChild('selectResolutionToolTip')
  selectResolutionToolTip: MatTooltip;
  @ViewChild('startToolTip')
  startToolTip: MatTooltip;
  spectrogramForm: FormGroup;
  logMessage: string;
  spectrograms: any[];

  private selectedFiles: FileList | null;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private socketService: SocketService,
    private bottomSheet: MatBottomSheet,
  ) {
    this.spectrogramForm = this.formBuilder.group({
      files: ['', Validators.required],
      type: ['', Validators.required],
      resolution: ['', [Validators.required, Validators.min(1)]],
    });
    this.spectrograms = [];
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.showTooltip(
      this.selectFilesToolTip,
      'Select mp3 or wav file/s',
    );
  }

  private showTooltip(toolTip: MatTooltip, message: string) {
    setTimeout(() => {
      toolTip.message = message;
      toolTip.show();
    }, 0);
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
    const event: HTMLInputEvent = inputEvent as HTMLInputEvent;
    if (event.target.files && event.target.files.length) {
      this.selectedFiles = event.target.files;
      this.openBottomSheet();
      for (let i = 0; i < this.selectedFiles.length; i++) {
        this.socketService.logSubject.next(
          `${this.selectedFiles[i].name} selected!`,
        );
      }
      this.spectrogramForm.controls.files.setValue(
        this.selectedFiles,
      );
      this.spectrogramForm.controls.files.updateValueAndValidity();
      this.showTooltip(
        this.selectSpecToolTip,
        'Select spectrogram type',
      );
    }
  }

  setSpectrogramType(selectChaceEvent: MatSelectChange) {
    this.spectrogramForm.controls.type.setValue(
      selectChaceEvent.value,
    );
    this.spectrogramForm.controls.type.updateValueAndValidity();
    if (!this.spectrogramForm.controls.resolution.value) {
      this.showTooltip(
        this.selectResolutionToolTip,
        'Select spectrogram resolution',
      );
    }
  }

  setSpectrogramResolution(inputEvent: any) {
    this.spectrogramForm.controls.resolution.setValue(
      Number(inputEvent.target.value),
    );
    this.spectrogramForm.controls.resolution.updateValueAndValidity();
    if (
      this.spectrogramForm.controls.files.value &&
      this.spectrogramForm.controls.resolution.value &&
      this.spectrogramForm.valid
    ) {
      this.showTooltip(this.startToolTip, 'Start');
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
    if (array && array.length) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
  }

  start(
    spectrogramForm: FormGroup,
    formDirective: FormGroupDirective,
  ) {
    if (
      this.selectedFiles &&
      this.selectedFiles.length &&
      this.spectrogramForm.valid
    ) {
      const start = async () => {
        try {
          await this.asyncForEach(
            this.selectedFiles as any,
            async (file: File) => {
              this.openBottomSheet();
              const response = await this.readFile(file);
              console.log('response: ', response);
            },
          );
          console.log('Done');
          this.reset(spectrogramForm, formDirective);
        } catch (error) {
          console.error(error);
        }
      };
      start();
    }
  }

  private reset(
    spectrogramForm: FormGroup,
    formDirective: FormGroupDirective,
  ) {
    this.loadData();
    spectrogramForm.reset();
    formDirective.resetForm();
    this.selectedFiles = null;
    this.showTooltip(
      this.selectFilesToolTip,
      'Select mp3 or wav file/s',
    );
  }
}
