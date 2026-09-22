import { Component, ElementRef, ViewChild, input, output, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-upload-button',
  standalone: true,
  styleUrl: './upload-button.scss',
  templateUrl: './upload-button.html',
})
export class UploadButton {
  public label = input<string>('Import File');
  public accept = input<string>('.csv,.fit,.gpx');
  public disabled = input<boolean>(false);
  public loading = input<boolean>(false);
  public loadingText = input<string>('Parsing GPS streams...');
  public ariaLabel = input<string>('Import File');

  public fileSelected = output<File>();

  // Modal and drag-and-drop state
  public isModalOpen = signal(false);
  public isDragging = signal(false);
  public selectedFile = signal<File | null>(null);
  public dragError = signal<string | null>(null);

  @ViewChild('modalFileInput') private modalFileInputRef?: ElementRef<HTMLInputElement>;

  public openModal(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    this.selectedFile.set(null);
    this.dragError.set(null);
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    if (this.loading()) {
      return;
    }
    this.isModalOpen.set(false);
    this.isDragging.set(false);
    this.selectedFile.set(null);
    this.dragError.set(null);
  }

  public triggerFileSelect(): void {
    if (this.loading()) {
      return;
    }
    this.modalFileInputRef?.nativeElement.click();
  }

  public onFileInputChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    inputEl.value = '';
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.loading()) {
      this.isDragging.set(true);
    }
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.loading()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  public confirmUpload(): void {
    const file = this.selectedFile();
    if (file && !this.loading()) {
      this.fileSelected.emit(file);
    }
  }

  private handleFile(file: File): void {
    const acceptedExtensions = this.accept()
      .split(',')
      .map((ext) => ext.trim().toLowerCase());

    const fileExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isAccepted =
      acceptedExtensions.length === 0 ||
      acceptedExtensions.includes(fileExt) ||
      acceptedExtensions.includes('*');

    if (!isAccepted) {
      this.dragError.set(`Unsupported format. Accepted: ${this.accept().replace(/,/g, ', ')}`);
      return;
    }

    this.dragError.set(null);
    this.selectedFile.set(file);
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
