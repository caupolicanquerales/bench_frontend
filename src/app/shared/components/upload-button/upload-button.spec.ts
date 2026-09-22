import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadButton } from './upload-button';

describe('UploadButton', () => {
  let component: UploadButton;
  let fixture: ComponentFixture<UploadButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadButton],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render default label "Import File" and icon', () => {
    const btn = fixture.nativeElement.querySelector('.upload-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Import File');
    expect(btn.querySelector('.upload-icon')).toBeTruthy();
  });

  it('should open modal when button is clicked', () => {
    expect(component.isModalOpen()).toBe(false);

    const btn = fixture.nativeElement.querySelector('.upload-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(component.isModalOpen()).toBe(true);
    const modal = fixture.nativeElement.querySelector('.upload-modal');
    expect(modal).toBeTruthy();
  });

  it('should close modal when close button is clicked', () => {
    component.openModal();
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.modal-close-btn') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(component.isModalOpen()).toBe(false);
  });

  it('should handle file selection via modal file input and allow confirming upload', () => {
    let emittedFile: File | null = null;
    component.fileSelected.subscribe((file) => {
      emittedFile = file;
    });

    component.openModal();
    fixture.detectChanges();

    const testFile = new File(['dummy,fit,data'], 'running_session.fit', { type: 'application/octet-stream' });
    const event = {
      target: {
        files: [testFile],
        value: 'C:\\fakepath\\running_session.fit',
      },
    } as unknown as Event;

    component.onFileInputChange(event);
    fixture.detectChanges();

    expect(component.selectedFile()).toBe(testFile);
    expect(fixture.nativeElement.querySelector('.file-name')?.textContent).toContain('running_session.fit');

    // Confirm upload
    component.confirmUpload();
    expect(emittedFile).toBe(testFile);
  });

  it('should reject unsupported file extensions and show error banner', () => {
    component.openModal();
    fixture.detectChanges();

    const exeFile = new File(['binary'], 'virus.exe', { type: 'application/octet-stream' });
    const event = {
      target: {
        files: [exeFile],
        value: 'C:\\fakepath\\virus.exe',
      },
    } as unknown as Event;

    component.onFileInputChange(event);
    fixture.detectChanges();

    expect(component.selectedFile()).toBeNull();
    expect(component.dragError()).toContain('Unsupported format');
  });

  it('should handle dragover, dragleave and drop events', () => {
    component.openModal();
    fixture.detectChanges();

    const mockPreventDefault = vi.fn();
    const mockStopPropagation = vi.fn();

    const dragOverEvent = {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    } as unknown as DragEvent;

    component.onDragOver(dragOverEvent);
    expect(component.isDragging()).toBe(true);

    const dragLeaveEvent = {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    } as unknown as DragEvent;

    component.onDragLeave(dragLeaveEvent);
    expect(component.isDragging()).toBe(false);

    const gpxFile = new File(['<gpx></gpx>'], 'route.gpx', { type: 'application/gpx+xml' });
    const dropEvent = {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
      dataTransfer: {
        files: [gpxFile],
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    expect(component.isDragging()).toBe(false);
    expect(component.selectedFile()).toBe(gpxFile);
  });

  it('should render loading spinner state and loadingText when loading=true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.upload-btn') as HTMLButtonElement;
    expect(btn.classList.contains('loading')).toBe(true);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Parsing GPS streams...');
    expect(btn.querySelector('.spinner-icon')).toBeTruthy();
  });

  it('should disable submit button when no file is selected and enable with ready style once file is selected', () => {
    component.openModal();
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('.modal-btn-submit') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.classList.contains('ready')).toBe(false);

    const testFile = new File(['1,2,3'], 'garmin_activity.csv', { type: 'text/csv' });
    component.selectedFile.set(testFile);
    fixture.detectChanges();

    expect(submitBtn.disabled).toBe(false);
    expect(submitBtn.classList.contains('ready')).toBe(true);
  });

  it('should display file preview badge with file name, separator, and size', () => {
    component.openModal();
    const testFile = new File(['a'.repeat(1024 * 1024 * 2)], 'garmin_activity_2026_09_22.csv', { type: 'text/csv' });
    component.selectedFile.set(testFile);
    fixture.detectChanges();

    const fileName = fixture.nativeElement.querySelector('.file-name');
    const fileSize = fixture.nativeElement.querySelector('.file-size');
    const separator = fixture.nativeElement.querySelector('.meta-separator');
    const removeBtn = fixture.nativeElement.querySelector('.remove-file-btn');

    expect(fileName?.textContent).toContain('garmin_activity_2026_09_22.csv');
    expect(fileSize?.textContent).toContain('2 MB');
    expect(separator?.textContent).toBe('·');
    expect(removeBtn).toBeTruthy();

    removeBtn.click();
    fixture.detectChanges();
    expect(component.selectedFile()).toBeNull();
  });

  it('should not open modal when disabled or loading', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.openModal();
    expect(component.isModalOpen()).toBe(false);
  });
});
