"use strict";

/**
 * Plugin for Remarkable Markdown processor which transforms mermaid code blocks into Mermaid diagrams.
 * Works as a post-processor on HTML content when html: true is enabled.
 */
const rmermaid = (md, options) => {
  // Import HTML processing utilities
  const { processMermaidInHTML } = require('./mermaid-utils');

  // Override the render method to post-process HTML content
  const originalRender = md.render;
  md.render = function(src, env) {
    // First, let Remarkable do its normal rendering
    let htmlContent = originalRender.call(this, src, env);
    
    // Then, post-process the HTML to transform mermaid code blocks
    htmlContent = processMermaidInHTML(htmlContent, options);
    
    return htmlContent;
  };
};

module.exports = rmermaid;
