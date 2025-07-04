/**
 * Utility functions for processing Mermaid diagrams in Remarkable
 */

let mermaidObject = require('mermaid');

/**
 * Wrap Mermaid mermaidCode code with a div element
 * @param {string} mermaidCode - The Mermaid mermaidCode code
 * @returns {string} - HTML div for client-side rendering
 */
async function renderMermaid(mermaidCode) {
    if (typeof mermaidCode !== 'string') {
        return '<div class="mermaid-error">Invalid Mermaid Code</div>';
    }

    // Generate a unique ID for this diagram
    const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (!mermaidObject) {
        return `<div class="mermaid" id="${diagramId}">${mermaidCode}</div>`;
    }

    // Generate unique ID for this diagram
    const id = `mermaid-render-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const {svg} = await mermaidObject.render(id, mermaidCode);

    return `<div class="mermaid" id="${diagramId}">${svg}</div>`;
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

    return processedContent;
}

/**
 * Process HTML content to transform mermaid code blocks into mermaid divs
 * @param {string} htmlContent - The HTML content to process
 * @param {Object} options - Processing options
 * @returns {string} - Processed HTML content
 */
function processMermaidInHTML(htmlContent, options = {}) {
    if (typeof htmlContent !== 'string') {
        return htmlContent;
    }

    if (typeof mermaidObject.initialize !== 'function') {
        if (options.mermaid) {
            mermaidObject = options.mermaid
            console.error('options.mermaid: ' + JSON.stringify(options.mermaid))
        } else {
            console.error("mermaid is not found, please check whether mermaid is installed or imported correctly.")
            return htmlContent;
        }
    }

    const mermaidConfiguration = {
        startOnLoad: options.startOnLoad || false,
        theme: options.theme || 'light',
        securityLevel: options.securityLevel || 'loose',
        fontFamily: options.fontFamily || 'arial',
        fontSize: options.fontSize || 16,
        flowchart: options.flowchart || {
            useMaxWidth: true,
            htmlLabels: true,
        },
        sequence: options.sequence || {
            useMaxWidth: true,
            wrap: true,
        },
        class: options.class || {
            useMaxWidth: true,
        },
        gitGraph: options.gitGraph || {
            useMaxWidth: true,
        },
    };
    console.error('mermaid: ', mermaid)
    mermaidObject.initialize(mermaidConfiguration);

    // Find all mermaid code blocks in the HTML
    // Pattern matches: <pre><code class="language-mermaid">...</code></pre>
    const mermaidCodeBlockRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi;

    return htmlContent.replace(mermaidCodeBlockRegex, (match, content) => {
        // Check if content has been syntax highlighted by hljs
        let cleanContent;
        if (content.includes('<span class="hljs-')) {
            // Extract text content from syntax-highlighted spans
            cleanContent = content
                .replace(/<span[^>]*class="hljs-[^"]*"[^>]*>(.*?)<\/span>/gi, '$1')
                .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'")
                .trim();
        } else {
            // Decode HTML entities in the content (no syntax highlighting)
            cleanContent = content
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'")
                .trim();
        }

        // Transform into mermaid div
        renderMermaid(cleanContent, mermaid).then(mermaidHtml => {
            return applyMermaidStyling(mermaidHtml, options);
        });
    });
}

module.exports = {
    processMermaidInHTML
};
