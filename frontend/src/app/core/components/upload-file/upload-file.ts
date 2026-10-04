import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../services/notification';
import { UiPreferencesService } from '../../services/ui-preferences';
import { Icon } from '../icon/icon';

let nextUploadId = 0;

@Component({
  selector: 'app-upload-file',
  imports: [CommonModule, MatSnackBarModule, MatTooltipModule, Icon],
  templateUrl: './upload-file.html',
  styleUrl: './upload-file.scss',
})
export class UploadFile implements OnInit {
  @Input() label: string = '';
  @Input() accept: string = 'application/pdf';
  @Input() multiple: boolean = true;
  @Input() maxFileSizeMB: number = 5;
  @Input() hint: string = '';
  @Input() inputId: string = `upload-file-${nextUploadId++}`;
  @Input() describedBy: string | null = null;
  @Input() invalid: boolean = false;
  @Input() initialFiles: File[] = [];

  @Output() filesChanged = new EventEmitter<File[]>();

  selectedFiles: File[] = [];
  dragging = false;

  constructor(
    private notification: NotificationService,
    readonly ui: UiPreferencesService,
  ) { }

  ngOnInit(): void {
    if (this.initialFiles?.length) {
      this.selectedFiles = [...this.initialFiles];
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      const isValidType = this.accept.includes(file.type) || this.accept.includes(file.name.split('.').pop() || '');
      const isValidSize = file.size <= this.maxFileSizeMB * 1024 * 1024;

      if (!isValidType) this.notification.error(this.ui.replace('upload.invalidType', { name: file.name }));
      if (!isValidSize) {
        this.notification.error(this.ui.replace('upload.invalidSize', { name: file.name, size: this.maxFileSizeMB }));
      }

      return isValidType && isValidSize;
    });

    if (this.multiple) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    } else if (validFiles.length > 0) {
      this.selectedFiles = validFiles.slice(0, 1);
    }

    this.filesChanged.emit(this.selectedFiles);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filesChanged.emit(this.selectedFiles);
  }

  previewFile(file: File): void {
    const blobUrl = URL.createObjectURL(file);

    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      this.notification.info(this.ui.t('upload.allowPopups'));
    }
  }

}
