[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34.svg)](https://opensource.org/licenses/MIT)

This is a [Remarkable](https://github.com/jonschlinkert/remarkable) plugin that converts
[Mermaid](https://mermaid.js.org/) diagram code blocks between ````mermaid...``` delimiters into HTML for client-side rendering. It should not interfere with any other Markdown processing and supports all Mermaid diagram types including flowcharts, sequence diagrams, class diagrams, and more.

# Overview

This plugin works as a post-processor on HTML content when `html: true` is enabled in Remarkable. It transforms mermaid code blocks in the rendered HTML into mermaid divs and adds the necessary client-side rendering script.

**Features:**
- 🌐 **Client-side rendering**: Converts mermaid code blocks to client-side renderable divs
- 🎨 **Customizable styling**: Add custom CSS classes and configure themes
- 🔧 **Easy integration**: Works as a simple post-processor on HTML content
- ⚡ **Performance optimized**: Lightweight processing with automatic script injection
- 🔒 **Re-rendering prevention**: Automatically marks rendered diagrams to prevent duplicate rendering
- 📋 **Flexible script inclusion**: Option to include or exclude client-side rendering script

# To Use

## Installation

Install this package using `npm`:

```bash
npm install remarkable-mermaid-plus
```

## Dependencies

- **Required**: None (works with client-side rendering)
- **Client-side**: [Mermaid.js](https://mermaid.js.org/) library (automatically included via CDN)

Assuming you already have `Remarkable` installed, one way to use would be like so:

**CommonJS**

```javascript
const {Remarkable} = require('remarkable');
const plugin = require('remarkable-mermaid-plus');
const md = new Remarkable({
  html: true  // Required for post-processing
});

// Basic usage with default settings
md.use(plugin);

// With custom configuration
md.use(plugin, {
  theme: 'dark',
  customClass: 'my-mermaid-class'
});
```

**ES6**

```javascript
import {Remarkable} from 'remarkable';
import rmermaid from 'remarkable-mermaid-plus';

const md = new Remarkable({
  html: true  // Required for post-processing
});

// Basic usage with default settings
md.use(rmermaid);

// With custom styling
md.use(rmermaid, {
  theme: 'default',
  customClass: 'diagram w-full'
});
```

If you use TypeScript, you can import the plugin with the correct types by steps as follows:

```typescript
// remarkable-mermaid-plus.d.ts
// create this file in any directory you want, such as "types/remarkable-mermaid-plus.d.ts"
declare module 'remarkable-mermaid-plus' {
  interface MermaidOptions {
    theme?: 'default' | 'neutral' | 'dark' | 'forest' | 'base';
    customClass?: string;
    securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
    fontFamily?: string;
    fontSize?: number;
    includeScript?: boolean;
    flowchart?: object;
    sequence?: object;
    class?: object;
    gitGraph?: object;
  }
  const rmermaid: (md: any, options?: MermaidOptions) => void;
  export = rmermaid;
}
```

Then add `"types": ["types/remarkable-mermaid-plus.d.ts"]` to your `tsconfig.json`

```json
{
  "compilerOptions": {
    "include": [
      "types/remarkable-mermaid-plus.d.ts"
    ]
  }
}
```

# Configuration

The plugin accepts several configuration options:

## Basic Configuration

```javascript
{
  theme: 'default',           // Mermaid theme (default: 'default')
  customClass: '',          // Additional CSS classes (default: '')
  securityLevel: 'loose',   // Security level (default: 'loose')
  fontFamily: 'arial',      // Font family (default: 'arial')
  fontSize: 16,             // Font size (default: 16)
  includeScript: true,      // Include rendering script (default: true)
  flowchart: {},            // Flowchart configuration (default: {})
  sequence: {},             // Sequence diagram configuration (default: {})
  class: {},                // Class diagram configuration (default: {})
  gitGraph: {}              // Git graph configuration (default: {})
}
```

## Manual Configuration for SSG (Static Site Generation)

**⚠️ Important**: When using SSG (Static Site Generation) with frameworks like Next.js, you may encounter rendering failures due to hydration mismatches and timing issues. For SSG scenarios, it's recommended to use manual configuration.

### Setup for SSG

#### Step 1: Install Dependencies

```bash
npm install remarkable-mermaid-plus mermaid@10.9.3
```

#### Step 2: Server-Side Configuration

Disable automatic script inclusion on the server:

```javascript
// Server-side (e.g., Next.js)
import { Remarkable } from 'remarkable';
import rmermaid from 'remarkable-mermaid-plus';

const md = new Remarkable({
  html: true,
  breaks: true,
  typographer: true,
  // ... other options
});

md.use(rmermaid, {
  includeScript: false  // Disable automatic script inclusion
});

const htmlContent = md.render(content);
```

#### Step 3: Client-Side Configuration

Handle mermaid initialization manually on the client:

```javascript
// Client-side (e.g., React component)
import { useEffect } from 'react';
import mermaid from 'mermaid';

function DocumentComponent({ htmlContent, theme }) {
  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        // Only proceed if we're in the browser
        if (typeof window === 'undefined') {
          return;
        }

        // Configure mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default', // Or others
          securityLevel: 'loose',
          fontFamily: 'arial',
          fontSize: 16,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
          },
          class: {
            useMaxWidth: true,
          },
          gitGraph: {
            useMaxWidth: true,
          },
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
              'gitgraph', 'mindmap', 'timeline', 'requirement'
            ];
            
            const isValidMermaid = validMermaidTypes.some(type => 
              mermaidContent.toLowerCase().includes(type.toLowerCase())
            );

            if (!isValidMermaid) {
              console.warn('Invalid mermaid content detected:', mermaidContent.substring(0, 100));
              div.setAttribute('data-processed', 'true');
              continue;
            }

            // Generate unique ID for this diagram
            const diagramId = `mermaid-${Date.now()}-${i}`;
            
            // Render the mermaid diagram
            const { svg } = await mermaid.render(diagramId, mermaidContent);
            
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
            div.innerHTML = `<div style="color: red; border: 1px solid red; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
              <strong>Mermaid Diagram Error:</strong><br>
              Failed to render diagram. Please check the syntax.
            </div>`;
          }
        }
      } catch (error) {
        console.error('Error initializing mermaid:', error);
      }
    };

    // Use a more reliable approach for SSG
    // Wait for both DOM ready and a short delay to ensure proper hydration
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeMermaid, 1000);
      });
    } else {
      // DOM is already loaded
      setTimeout(initializeMermaid, 1000);
    }
  }, [htmlContent, theme]); // Re-run when content or theme changes

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
```

#### Step 4: Package.json Dependencies

Make sure your package.json includes the required dependencies:

```json
{
  "dependencies": {
    "mermaid": "^10.9.3",
    "remarkable": "^2.0.1",
    "remarkable-mermaid-plus": "^1.1.0"
  }
}
```

### Options

- **`theme`** (string): Mermaid theme. Options: `'default'`, `'neutral'`, `'dark'`, `'forest'`, `'base'`. Default is `'default'`.
- **`customClass`** (string): Additional CSS class names to add to the diagram container div. Default is empty string.
- **`securityLevel`** (string): Security level for mermaid rendering. Options: `'strict'`, `'loose'`, `'antiscript'`, `'sandbox'`. Default is `'loose'`.
- **`fontFamily`** (string): Font family for diagrams. Default is `'arial'`.
- **`fontSize`** (number): Font size for diagrams. Default is `16`.
- **`includeScript`** (boolean): Whether to include the client-side rendering script. Set to `false` if you want to handle script loading separately. Default is `true`.
- **`flowchart`** (object): Flowchart-specific configuration options. Default is `{}`.
- **`sequence`** (object): Sequence diagram-specific configuration options. Default is `{}`.
- **`class`** (object): Class diagram-specific configuration options. Default is `{}`.
- **`gitGraph`** (object): Git graph-specific configuration options. Default is `{}`.

## Supported Diagram Types

This plugin supports all Mermaid diagram types:

- **Flowcharts**: `graph TD`, `graph LR`, `flowchart TD`, etc.
- **Sequence Diagrams**: `sequenceDiagram`
- **Class Diagrams**: `classDiagram`
- **State Diagrams**: `stateDiagram`
- **Entity Relationship Diagrams**: `erDiagram`
- **User Journey**: `journey`
- **Gantt Charts**: `gantt`
- **Pie Charts**: `pie`
- **Git Graphs**: `gitgraph`

## Configuration Examples

### Basic Usage
```javascript
const md = new Remarkable({ html: true });
md.use(rmermaid);

const result = md.render(`
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
`);
```

### With Custom Styling
```javascript
const md = new Remarkable({ html: true });
md.use(rmermaid, {
  theme: 'dark',
  customClass: 'diagram bordered shadow'
});
```

### With Advanced Configuration
```javascript
const md = new Remarkable({ html: true });
md.use(rmermaid, {
  theme: 'light',
  customClass: 'my-diagram',
  securityLevel: 'strict',
  fontFamily: 'Helvetica, sans-serif',
  fontSize: 14,
  includeScript: true,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  },
  sequence: {
    useMaxWidth: true,
    wrap: true
  }
});
```

### Without Script Inclusion
```javascript
const md = new Remarkable({ html: true });
md.use(rmermaid, {
  theme: 'dark',
  customClass: 'diagram',
  includeScript: false  // Handle script loading separately
});
```

## HTML Output

The plugin transforms mermaid code blocks into client-side renderable divs:

### Input Markdown
```markdown
```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```
```

### Output HTML
```html
<div class="mermaid my-custom-class" id="mermaid-1234567890-abc123">
graph TD
    A[Start] --&gt; B[Process]
    B --&gt; C[End]
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.3/mermaid.min.js"></script>
<script>
// Mermaid initialization and rendering script
</script>
```

After client-side rendering, the diagram element gets a `data-mermaid-rendered="true"` attribute to prevent re-rendering:

```html
<div class="mermaid my-custom-class" id="mermaid-1234567890-abc123" data-mermaid-rendered="true">
  <svg><!-- Rendered SVG content --></svg>
</div>
```

# Dependencies

## Required
- **[Remarkable](https://github.com/jonschlinkert/remarkable)** with `html: true` option enabled

## Client-side (automatically included)
- **[Mermaid.js](https://mermaid.js.org/)** -- Client-side diagram rendering (loaded via CDN)

# Tests

There are a set of [Vows](http://vowsjs.org) tests in [index.test.js](index.test.js). To run:

```bash
% npm test
```

> **NOTE**: if this fails, there may be a path issue with `vows` executable. See [package.json](package.json).
