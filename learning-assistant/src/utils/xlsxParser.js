/**
 * XLSX file parsing utility
 */
import * as XLSX from 'xlsx';
import { parseXLSXData } from './dataManager';
import { logger } from './logger';

export const parseXLSXFile = async (file) => {
  try {
    logger.info('Parsing XLSX file', { filename: file.name });

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays (no headers)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Parse to our topic structure
    const topics = parseXLSXData(jsonData);

    logger.success('XLSX parsed successfully', { topicsCount: topics.length });
    return topics;
  } catch (err) {
    logger.error('Error parsing XLSX', err);
    throw err;
  }
};

export const parseXLSXFromPath = async (fileHandle) => {
  try {
    logger.info('Parsing XLSX from file handle');
    const file = await fileHandle.getFile();
    return await parseXLSXFile(file);
  } catch (err) {
    logger.error('Error parsing XLSX from path', err);
    throw err;
  }
};
