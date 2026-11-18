import girosCSV from './Giros.csv?raw';
import tasasCSV from './Tasas.csv?raw';
import { parseDeposits, parseRates } from '../lib/finance';
export { girosCSV, tasasCSV };
export const originalDeposits = parseDeposits(girosCSV);
export const rates = parseRates(tasasCSV);
