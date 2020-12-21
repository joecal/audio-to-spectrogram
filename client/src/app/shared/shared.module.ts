import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';

@NgModule({
  exports: [
    CommonModule,
    MaterialModule,
    ScrollingModule,
    CdkTableModule,
  ],
})
export class SharedModule {}
