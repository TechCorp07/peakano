/**
 * Empty polyfill for Node.js modules that aren't available in the browser
 * Used by Cornerstone's codec libraries which check for Node.js environment
 */

// Export empty object as default
export default {};

// Export common fs methods as no-ops
export const readFileSync = () => null;
export const writeFileSync = () => {};
export const existsSync = () => false;
export const readFile = (path, callback) => callback(new Error('fs not available'));
export const writeFile = (path, data, callback) => callback(new Error('fs not available'));

// Export common path methods
export const join = (...args) => args.join('/');
export const resolve = (...args) => args.join('/');
export const dirname = (p) => p.split('/').slice(0, -1).join('/');
export const basename = (p) => p.split('/').pop();
export const normalize = (p) => p;

// Export crypto methods
export const randomBytes = (size) => new Uint8Array(size);
export const createHash = () => ({
  update: () => ({ digest: () => '' }),
});
