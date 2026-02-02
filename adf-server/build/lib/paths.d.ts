export declare function normalizePath(p: string): string;
export declare const ADF_ROOT: string;
export declare const REGISTRY_ROOT: string;
/**
 * Validates that a candidate path is within a base directory.
 * Uses path.relative() check — rejects if result starts with ".." or is absolute.
 * For existing paths, also verifies via fs.realpath() to resolve symlinks.
 * Returns { valid: true, resolved } or { valid: false, error }.
 */
export declare function validatePathWithinBase(candidate: string, base: string): Promise<{
    valid: true;
    resolved: string;
} | {
    valid: false;
    error: string;
}>;
