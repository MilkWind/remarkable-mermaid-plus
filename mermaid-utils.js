/**
 * Utility functions for processing Mermaid diagrams in Remarkable
 */

const themes = ['default', 'neutral', 'dark', 'forest', 'base']

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
                // Only proceed if we're in the browser
                if (typeof window === 'undefined') {
                    return;
                }

                // Check if mermaid is available
                if (typeof mermaid === 'undefined') {
                    console.warn('Mermaid library is not loaded yet.');
                    return;
                }

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

                // Find all mermaid divs that haven't been processed yet
                const mermaidDivs = document.querySelectorAll('.mermaid:not([data-processed])');
                
                if (mermaidDivs.length === 0) {
                    return;
                }

                // Process each mermaid div
                for (let i = 0; i < mermaidDivs.length; i++) {
                    const div = mermaidDivs[i];
                    
                    try {
                        // Get mermaid content from the div
                        let mermaidContent = div.textContent || div.innerText || '';
                        mermaidContent = mermaidContent.trim();

                        // Skip if no content
                        if (!mermaidContent) {
                            continue;
                        }

                        // Skip if already contains SVG (already rendered)
                        if (mermaidContent.includes('<svg') || div.querySelector('svg')) {
                            div.setAttribute('data-processed', 'true');
                            continue;
                        }

                        // Validate mermaid content
                        const validMermaidTypes = [
                            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
                            'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 
                            'gitgraph', 'mindmap', 'timeline', 'requirement', 'journey'
                        ];
                        
                        const isValidMermaid = validMermaidTypes.some(function(type) {
                            return mermaidContent.toLowerCase().includes(type.toLowerCase());
                        });

                        if (!isValidMermaid) {
                            console.warn('Invalid mermaid content detected:', mermaidContent.substring(0, 100));
                            div.setAttribute('data-processed', 'true');
                            continue;
                        }

                        // Generate unique ID for this diagram
                        const diagramId = 'mermaid-' + Date.now() + '-' + i;
                        
                        // Render the mermaid diagram
                        const result = await mermaid.render(diagramId, mermaidContent);
                        const svg = result.svg;
                        
                        // Replace content with rendered SVG
                        div.innerHTML = svg;
                        div.setAttribute('data-processed', 'true');
                        
                        // Add some styling to the container
                        div.style.textAlign = 'center';
                        div.style.margin = '1rem 0';
                        
                    } catch (error) {
                        console.error('Error processing individual mermaid diagram:', error);
                        div.setAttribute('data-processed', 'true');
                        // Add error styling
                        div.innerHTML = '<div style="color: red; border: 1px solid red; padding: 1rem; margin: 1rem 0; border-radius: 4px;">' +
                            '<strong>Mermaid Diagram Error:</strong><br>' +
                            'Failed to render diagram. Please check the syntax.' +
                            '</div>';
                    }
                }
            } catch (error) {
                console.error('Error initializing mermaid:', error);
            }
        };

        // Use a more reliable approach for SSG
        // Wait for both DOM ready and a short delay to ensure proper hydration
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initializeMermaid, 1000);
            });
        } else {
            // DOM is already loaded
            setTimeout(initializeMermaid, 1000);
        }
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
        theme: themes.includes(options.theme) ? options.theme : 'default',
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

    // Only add rendering script if includeScript is true (default: true)
    if (options.includeScript !== false) {
        return addRenderingScript(htmlContent, mermaidConfiguration);
    }

    return htmlContent;
}

module.exports = {
    processMermaidInHTML
};
