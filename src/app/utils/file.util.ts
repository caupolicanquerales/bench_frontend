export function convertFileToFormData(file: File | File[]): FormData {
  const files = Array.isArray(file) ? file : [file];
  const formData = new FormData();

  files.forEach((item) => {
    formData.append('files', item, item.name);
  });

  return formData;
}