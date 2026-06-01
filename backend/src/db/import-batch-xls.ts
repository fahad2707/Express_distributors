import mongoose from 'mongoose';
import path from 'path';
import { importCategoryXlsFiles } from './xlsCategoryImport';

const filesToImport = process.argv.slice(2);

async function main() {
  if (filesToImport.length === 0) {
    console.error('Please provide at least one XLS file path.');
    process.exit(1);
  }

  const absolute = filesToImport.map((p) => path.resolve(p));
  try {
    await importCategoryXlsFiles(absolute);
  } catch (e) {
    console.error('Fatal error during import:', e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
  process.exit(0);
}

main();
