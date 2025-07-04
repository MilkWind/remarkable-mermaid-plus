/**
 * Utility functions for processing Mermaid diagrams in Remarkable
 */

/**
 * Wrap Mermaid mermaidCode code with a div element
 * @param {string} mermaidCode - The Mermaid mermaidCode code
 * @returns {string} - HTML div for client-side rendering
 */
function wrapWithDiv(mermaidCode) {
    if (typeof mermaidCode !== 'string') {
        return '<div class="mermaid-error">Invalid Mermaid Code</div>';
    }

    // Generate a unique ID for this diagram
    const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return `<div class="mermaid" id="${diagramId}">${mermaidCode}</div>`;
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

function addRenderingScript(htmlContent, config) {
    return htmlContent + `
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.3/mermaid.min.js" integrity="sha512-HvxxeyPSnbU7/x0g15v3OMxTFeADyCUnCN3iCam3BDTxgFPKxa+ujRCbFuwjE8PASDwOH5LpzFfGGNWks7tuJQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>
(function() {
        const initializeMermaid = async function() {
            try {
                // Configure mermaid with provided config
                mermaid.initialize({
                    startOnLoad: ${config.startOnLoad || false},
                    theme: '${config.theme}',
                    securityLevel: '${config.securityLevel}',
                    fontFamily: '${config.fontFamily}',
                    fontSize: ${config.fontSize},
                    flowchart: ${JSON.stringify(config.flowchart)},
                    sequence: ${JSON.stringify(config.sequence)},
                    class: ${JSON.stringify(config.class)},
                    gitGraph: ${JSON.stringify(config.gitGraph)}
                });

                // Find all mermaid divs and render them
                const mermaidDivs = document.querySelectorAll('.mermaid');

                for (let i = 0; i < mermaidDivs.length; i++) {
                    const div = mermaidDivs[i];

                    // Get clean text content, avoiding any HTML that might be mixed in
                    let mermaidContent = div.textContent || div.innerText || '';

                    // Clean up the content - remove any extra whitespace and HTML artifacts
                    mermaidContent = mermaidContent.trim();

                    // Skip if content is empty or contains HTML tags (already processed)
                    if (!mermaidContent || mermaidContent.includes('<svg') || mermaidContent.includes('<path')) {
                        continue;
                    }

                    // Validate that this is actually mermaid content
                    const validMermaidTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline'];
                    const isValidMermaid = validMermaidTypes.some(function(type) {
                        return mermaidContent.toLowerCase().includes(type.toLowerCase());
                    });

                    if (!isValidMermaid) {
                        console.warn('Skipping non-mermaid content:', mermaidContent.substring(0, 50) + '...');
                        continue;
                    }

                    try {
                        // Ensure the div is properly mounted and visible
                        if (!div.offsetParent && div.style.display !== 'none') {
                            div.style.display = 'block';
                        }

                        // Create a temporary container to avoid DOM issues
                        const tempContainer = document.createElement('div');
                        tempContainer.style.width = '100%';
                        tempContainer.style.height = 'auto';
                        tempContainer.style.visibility = 'hidden';
                        tempContainer.style.position = 'absolute';
                        tempContainer.style.top = '-9999px';
                        document.body.appendChild(tempContainer);

                        // Generate unique ID for this diagram
                        const id = 'mermaid-render-' + Date.now() + '-' + i;

                        // Use mermaid v10+ async API with proper DOM context
                        const result = await mermaid.render(id, mermaidContent, tempContainer);
                        const svg = result.svg;

                        // Remove temporary container
                        document.body.removeChild(tempContainer);

                        // Replace the div content with the SVG
                        div.innerHTML = svg;

                    } catch (renderError) {
                        console.error('Error rendering mermaid diagram:', renderError);
                        console.error('Content that failed:', mermaidContent);
                        // Keep the original content if rendering fails
                        const errorMessage = renderError instanceof Error ? renderError.message : String(renderError);
                        div.innerHTML = '<pre style="color: red; background: #fee; padding: 10px; border-radius: 4px;">' +
                            'Error rendering mermaid diagram: ' + errorMessage + '\\n\\n' +
                            'Original content:\\n' + mermaidContent + '</pre>';
                    }
                }
            } catch (error) {
                console.error('Error initializing mermaid:', error);
            }
        };

        // Wait for DOM to be fully ready and ensure proper mounting
        const timeoutId = setInterval(function() {
            // Check if mermaid is available
            if (typeof mermaid === 'undefined') {
                console.warn('Mermaid library is not loaded yet.');
                return;
            }
            // Double-check that we're in a browser environment
            if (typeof window !== 'undefined' && document.body) {
                initializeMermaid();
                clearInterval(timeoutId)
            }
        }, 1000);
    })();
    </script>
    `;
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

    const mermaidConfiguration = {
        startOnLoad: options.startOnLoad || false,
        theme: options.theme === 'light' ? 'default' : 'dark',
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

    // Find all mermaid code blocks in the HTML
    // Pattern matches: <pre><code class="language-mermaid">...</code></pre>
    const mermaidCodeBlockRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi;

    htmlContent = htmlContent.replace(mermaidCodeBlockRegex, (match, content) => {
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
        cleanContent = wrapWithDiv(cleanContent);
        return applyMermaidStyling(cleanContent, options);
    });

    return addRenderingScript(htmlContent, mermaidConfiguration);
}

module.exports = {
    processMermaidInHTML
};
