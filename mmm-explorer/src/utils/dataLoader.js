import Papa from 'papaparse';

export const loadData = () => {
  return new Promise((resolve, reject) => {
    const csvUrl = new URL('/conjura_mmm_data.csv', window.location.origin).href;
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV Parsing errors:", results.errors);
        }
        resolve(results.data);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};
