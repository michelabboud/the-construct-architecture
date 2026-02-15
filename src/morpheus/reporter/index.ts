/**
 * Morpheus Reporter Module
 *
 * "The Matrix is a system, Neo. That system is our enemy." — Morpheus
 *
 * Exports reporting functionality for migration documentation.
 */

export {
  Reporter,
  createReporter,
} from './reporter.js';
export type {
  ReportFormat,
  ReportSection,
  ReportOptions,
  ReportData,
  ProgressData,
  GeneratedReport,
} from './reporter.js';
