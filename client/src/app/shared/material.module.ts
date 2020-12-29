import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  exports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatBottomSheetModule,
    MatTooltipModule,
  ],
})
export class MaterialModule {}
