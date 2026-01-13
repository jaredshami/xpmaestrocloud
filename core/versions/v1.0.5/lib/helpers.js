/**
 * Helper functions for core engine
 * v1.0.1
 * 
 * Updated utilities with better validation
 */

const CoreHelpers = {
  /**
   * Sanitize HTML
   */
  sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Format date
   */
  formatDate(date, format = 'MM/DD/YYYY') {
    const d = new Date(date);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const y = d.getFullYear();
    
    return format
      .replace('MM', m)
      .replace('DD', day)
      .replace('YYYY', y);
  },

  /**
   * Merge objects
   */
  mergeObjects(...objects) {
    return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {});
  },

  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreHelpers;
}
