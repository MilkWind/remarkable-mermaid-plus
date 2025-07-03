/**
 * Utility functions for processing Mermaid diagrams in Remarkable
 */

/**
 * Parse Mermaid code blocks (```mermaid ... ```)
 * @param {Object} state - Parser state
 * @param {number} startLine - Starting line number
 * @param {number} endLine - Ending line number
 * @returns {boolean} - Whether parsing was successful
 */
function parseBlockMermaid(state, startLine, endLine) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // Check if line starts with ```
  if (pos + 3 > max) { return false; }
  
  const marker = state.src.slice(pos, pos + 3);
  if (marker !== '```') { return false; }

  pos += 3;
  
  // Skip whitespace
  while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }
  
  // Check if it's a mermaid block
  const langStart = pos;
  while (pos < max && state.src.charCodeAt(pos) !== 0x20 && state.src.charCodeAt(pos) !== 0x0A) { pos++; }
  
  const lang = state.src.slice(langStart, pos).toLowerCase();
  if (lang !== 'mermaid') { return false; }

  // Find the closing ```
  let nextLine = startLine;
  let haveEndMarker = false;

  for (;;) {
    ++nextLine;
    if (nextLine >= endLine) { break; }

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.tShift[nextLine] < state.blkIndent) { break; }

    if (state.src.slice(pos, pos + 3) === '```') {
      haveEndMarker = true;
      break;
    }
  }

  if (!haveEndMarker) { return false; }

  // Extract the content between the markers
  const content = state.getLines(startLine + 1, nextLine, 0, true).trim();
  
  state.line = nextLine + 1;
  state.tokens.push({
    type: 'mermaid',
    content: content,
    lines: [startLine, state.line],
    level: state.level,
    block: true
  });

  return true;
}

/**
 * Alternative approach: Hook into the fence (code block) parser
 * @param {Object} state - Parser state  
 * @param {number} startLine - Starting line number
 * @param {number} endLine - Ending line number
 * @returns {boolean} - Whether parsing was successful
 */
function parseFenceMermaid(state, startLine, endLine) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // Check if line starts with ```
  if (pos + 3 > max) { return false; }
  
  const marker = state.src.slice(pos, pos + 3);
  if (marker !== '```') { return false; }

  pos += 3;
  
  // Skip whitespace
  while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }
  
  // Get the language identifier
  const langStart = pos;
  while (pos < max && state.src.charCodeAt(pos) !== 0x20 && state.src.charCodeAt(pos) !== 0x0A) { pos++; }
  
  const lang = state.src.slice(langStart, pos).toLowerCase();
  if (lang !== 'mermaid') { return false; }

  // Find the closing ```
  let nextLine = startLine;
  let haveEndMarker = false;

  for (;;) {
    ++nextLine;
    if (nextLine >= endLine) { break; }

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.tShift[nextLine] < state.blkIndent) { break; }

    if (state.src.slice(pos, pos + 3) === '```') {
      haveEndMarker = true;
      break;
    }
  }

  if (!haveEndMarker) { return false; }

  // Extract the content between the markers
  const content = state.getLines(startLine + 1, nextLine, 0, true).trim();
  
  state.line = nextLine + 1;
  state.tokens.push({
    type: 'mermaid',
    content: content,
    lines: [startLine, state.line],
    level: state.level,
    block: true
  });

  return true;
}

/**
 * Render Mermaid diagram to HTML/SVG
 * @param {string} source - The Mermaid source code
 * @param {Object} options - Rendering options
 * @returns {string} - Rendered HTML/SVG
 */
function renderMermaid(source, options = {}) {
  if (typeof source !== 'string') {
    return '<div class="mermaid-error">Invalid Mermaid source</div>';
  }

  // If client-side rendering is explicitly requested
  if (options.clientSide === true) {
    return renderMermaidClientSide(source, options);
  }

  try {
    // Attempt server-side rendering using mermaid
    let mermaid;
    try {
      mermaid = require('mermaid');
    } catch (mermaidError) {
      // Mermaid not available, fall back to client-side rendering
      if (options.fallbackToClientSide !== false) {
        return renderMermaidClientSide(source, options);
      }
      throw new Error('Server-side rendering requires mermaid dependency. Install with: npm install mermaid');
    }
    
    // For server-side rendering, we need a DOM environment
    // Try to use jsdom if available
    let JSDOM;
    try {
      const jsdom = require('jsdom');
      JSDOM = jsdom.JSDOM;
    } catch (jsdomError) {
      // jsdom not available, fall back to client-side rendering
      if (options.fallbackToClientSide !== false) {
        return renderMermaidClientSide(source, options);
      }
      throw new Error('Server-side rendering requires jsdom dependency. Install with: npm install jsdom');
    }

    // Create a DOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="graphDiv"></div></body></html>', {
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;

    // Generate a unique ID for this diagram
    const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize mermaid configuration
    const mermaidConfig = {
      startOnLoad: false,
      theme: options.theme || 'default',
      securityLevel: 'loose',
      fontFamily: options.fontFamily || 'arial',
      fontSize: options.fontSize || 16,
      htmlLabels: true,
      ...options.mermaidConfig
    };

    // Use mermaid.render for server-side rendering
    try {
      let svg;
      
      // Modern Mermaid API approach
      if (typeof mermaid.render === 'function') {
        // Try the render function with proper configuration
        if (typeof mermaid.initialize === 'function') {
          mermaid.initialize(mermaidConfig);
        }
        
        // The render function signature: mermaid.render(id, definition, config)
        const result = mermaid.render(diagramId, source, mermaidConfig);
        
        // Handle different return types
        if (typeof result === 'string') {
          svg = result;
        } else if (result && result.svg) {
          svg = result.svg;
        } else if (result && typeof result.then === 'function') {
          // Async result - we can't handle this in synchronous context
          throw new Error('Async rendering detected, falling back to client-side');
        } else {
          throw new Error('Unexpected render result format');
        }
      } else {
        throw new Error('mermaid.render function not available');
      }
      
      // Clean up DOM globals
      delete global.window;
      delete global.document;
      delete global.navigator;
      
      // Wrap the SVG in a container div with optional styling
      let containerClass = 'mermaid-diagram';
      if (options.customClass) {
        containerClass += ` ${options.customClass}`;
      }
      
      let containerStyle = '';
      if (options.customStyle) {
        containerStyle = ` style="${options.customStyle}"`;
      }
      
      return `<div class="${containerClass}" id="${diagramId}-container"${containerStyle}>${svg}</div>`;
      
    } catch (renderError) {
      // Clean up DOM globals
      delete global.window;
      delete global.document;
      delete global.navigator;
      
      throw renderError;
    }
    
  } catch (error) {
    console.error('Mermaid server-side rendering error:', error.message);
    
    // Fallback to client-side rendering if server-side fails
    if (options.fallbackToClientSide !== false) {
      return renderMermaidClientSide(source, options);
    }
    
    return `<div class="mermaid-error">
      <strong>Mermaid Render Error:</strong> ${escapeHtml(error.message)}
      <details style="margin-top: 10px;">
        <summary>Source Code</summary>
        <pre style="background: #f5f5f5; padding: 10px; margin: 5px 0;">${escapeHtml(source)}</pre>
      </details>
    </div>`;
  }
}

/**
 * Render Mermaid diagram for client-side processing (fallback)
 * @param {string} source - The Mermaid source code
 * @param {Object} options - Rendering options
 * @returns {string} - HTML div for client-side rendering
 */
function renderMermaidClientSide(source, options = {}) {
  // Generate a unique ID for this diagram
  const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a container div with the mermaid class and unique ID
  const htmlContent = `<div class="mermaid" id="${diagramId}">${escapeHtml(source)}</div>`;
  
  // Add initialization script if requested
  if (options.includeScript) {
    return htmlContent + `
<script>
if (typeof mermaid !== 'undefined') {
  mermaid.init(undefined, '#${diagramId}');
}
</script>`;
  }
  
  return htmlContent;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * Apply custom styling to Mermaid containers
 * @param {string} htmlContent - The HTML content to process
 * @param {Object} config - Configuration object
 * @returns {string} - Processed HTML content
 */
function applyMermaidStyling(htmlContent, config = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  let processedContent = htmlContent;

  // Add custom CSS classes if specified
  if (config.customClass) {
    processedContent = processedContent.replace(
      /class="mermaid"/g,
      `class="mermaid ${config.customClass}"`
    );
  }

  // Add custom styles if specified
  if (config.customStyle) {
    processedContent = processedContent.replace(
      /(<div[^>]*class="[^"]*mermaid[^"]*"[^>]*)/g,
      `$1 style="${config.customStyle}"`
    );
  }

  return processedContent;
}

/**
 * Validate Mermaid syntax (basic validation)
 * @param {string} source - The Mermaid source code
 * @returns {Object} - Validation result with isValid and errors
 */
function validateMermaidSyntax(source) {
  if (!source || typeof source !== 'string') {
    return { isValid: false, errors: ['Empty or invalid source'] };
  }

  const errors = [];
  const trimmedSource = source.trim();

  // Basic syntax checks
  if (trimmedSource.length === 0) {
    errors.push('Empty diagram content');
  }

  // Check for common diagram types
  const diagramTypes = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
    'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
    'gitgraph', 'mindmap', 'timeline'
  ];

  const hasValidType = diagramTypes.some(type => 
    trimmedSource.toLowerCase().startsWith(type.toLowerCase())
  );

  if (!hasValidType) {
    errors.push('Unknown or missing diagram type');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  parseBlockMermaid,
  parseFenceMermaid,
  renderMermaid,
  renderMermaidClientSide,
  escapeHtml,
  applyMermaidStyling,
  validateMermaidSyntax
};
