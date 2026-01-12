/**
 * Core Engine - Renders templates and manages instance content
 * v1.0.1
 * 
 * Changes in v1.0.1:
 * - Added improved error handling
 * - Fixed template variable replacement edge cases
 * - Performance optimizations
 */

class CoreEngine {
  constructor(config = {}) {
    this.config = config;
    this.templates = {};
    this.data = {};
  }

  /**
   * Load a template
   */
  loadTemplate(name, template) {
    this.templates[name] = template;
  }

  /**
   * Render a template with data
   */
  render(templateName, data = {}) {
    if (!this.templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let template = this.templates[templateName];
    
    // Replace variables with data
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{ ${key} }}`, 'g');
      template = template.replace(regex, data[key]);
    });

    return template;
  }

  /**
   * Get instance data
   */
  getData(key) {
    return this.data[key];
  }

  /**
   * Set instance data
   */
  setData(key, value) {
    this.data[key] = value;
  }

  /**
   * Initialize engine with core configuration
   */
  init(config) {
    this.config = { ...this.config, ...config };
    console.log('Core Engine initialized', this.config);
  }

  /**
   * Get version
   */
  getVersion() {
    return 'v1.0';
  }
}

// Export for use in instances
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreEngine;
}
