[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34.svg)](https://opensource.org/licenses/MIT)

# Overview

This is a [Remarkable](https://github.com/jonschlinkert/remarkable) plugin that converts
[Mermaid](https://mermaid.js.org/) diagram code blocks between ````mermaid...``` delimiters into HTML. It supports both **server-side SVG generation** (when dependencies are available) and **client-side rendering** as fallback. The plugin should not interfere with any other Markdown processing and supports all Mermaid diagram types including flowcharts, sequence diagrams, class diagrams, and more.

**Features:**
- 🖥️ **Server-side rendering**: Generates actual SVG diagrams when `mermaid` and `jsdom` are available
- 🌐 **Client-side fallback**: Automatically falls back to client-side rendering when server-side isn't available  
- 🎨 **Customizable styling**: Add custom CSS classes and inline styles
- 🔒 **Safe by default**: HTML escaping and security measures built-in
- ⚡ **Performance optimized**: Fast processing with intelligent fallback mechanisms

# To Use

## Installation

Install this package using `npm`:

```bash
# Basic installation (client-side rendering only)
npm install remarkable-mermaid-plus

# For server-side SVG generation, also install:
npm install mermaid jsdom
```

## Dependencies

- **Required**: None (works with client-side rendering fallback)
- **Optional for server-side rendering**: 
  - `mermaid` - For server-side SVG generation
  - `jsdom` - Provides DOM environment for server-side rendering
- **Client-side**: [Mermaid.js](https://mermaid.js.org/) library (only needed if using client-side rendering)

Assuming you already have `Remarkable` installed, one way to use would be like so:

**CommonJS**

```javascript
const {Remarkable} = require('remarkable');
const plugin = require('remarkable-mermaid-plus');
const md = new Remarkable();

// Basic usage with default settings
md.use(plugin);

// With custom configuration
md.use(plugin, {
  includeScript: true,
  mermaidCustomClass: 'my-mermaid-class',
  mermaidCustomStyle: 'border: 1px solid #ccc;'
});
```

**ES6**

```javascript
import {Remarkable} from 'remarkable';
import rmermaid from 'remarkable-mermaid-plus';

const md = new Remarkable();

// Basic usage with default settings
md.use(rmermaid);

// With custom styling
md.use(rmermaid, {
  mermaidCustomClass: 'diagram',
  mermaidCustomStyle: 'max-width: 100%;'
});
```

If you use TypeScript, you can import the plugin with the correct types by steps as follows:

```typescript
// remarkable-mermaid-plus.d.ts
// create this file in any directory you want, such as "types/remarkable-mermaid-plus.d.ts"
declare module 'remarkable-mermaid-plus' {
  interface MermaidOptions {
    includeScript?: boolean;
    mermaidCustomClass?: string;
    mermaidCustomStyle?: string;
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
  // Rendering mode
  clientSide: false,                    // Force client-side rendering (default: false)
  fallbackToClientSide: true,          // Fall back to client-side if server-side fails (default: true)
  
  // Server-side rendering options
  theme: 'default',                     // Mermaid theme: default, dark, forest, etc.
  fontFamily: 'arial',                  // Font family for diagrams
  fontSize: 16,                         // Font size for diagrams
  
  // Styling options
  mermaidCustomClass: '',               // Additional CSS classes (default: '')
  mermaidCustomStyle: '',               // Inline styles (default: '')
  
  // Legacy client-side options
  includeScript: false,                 // Include mermaid.init() script tag (default: false)
  
  // Advanced configuration
  mermaidConfig: {}                     // Additional mermaid configuration options
}
```

### Options

#### Rendering Control
- **`clientSide`** (boolean): When `true`, forces client-side rendering even if server-side dependencies are available. Default is `false`.
- **`fallbackToClientSide`** (boolean): When `true`, automatically falls back to client-side rendering if server-side rendering fails. Default is `true`.

#### Server-side Rendering Options
- **`theme`** (string): Mermaid theme for server-side rendering. Options: `default`, `dark`, `forest`, `neutral`. Default is `default`.
- **`fontFamily`** (string): Font family for server-side rendered diagrams. Default is `arial`.
- **`fontSize`** (number): Font size for server-side rendered diagrams. Default is `16`.

#### Styling Options
- **`mermaidCustomClass`** (string): Additional CSS class names to add to the diagram container div. Default is empty string.
- **`mermaidCustomStyle`** (string): Inline CSS styles to apply to the diagram container div. Default is empty string.

#### Legacy Options
- **`includeScript`** (boolean): When `true`, includes a `<script>` tag that calls `mermaid.init()` for each diagram (client-side only). Default is `false`.

#### Advanced Options
- **`mermaidConfig`** (object): Additional configuration options passed directly to Mermaid.js. Default is `{}`.

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

### Basic Usage (Automatic Mode)
```javascript
const md = new Remarkable();
md.use(rmermaid);

const result = md.render(`
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
`);
// Will try server-side rendering first, fall back to client-side if needed
```

### Force Server-side Rendering
```javascript  
const md = new Remarkable();
md.use(rmermaid, {
  fallbackToClientSide: false,  // Don't fall back, show error if server-side fails
  theme: 'dark',
  fontFamily: 'monospace'
});
```

### Force Client-side Rendering
```javascript
const md = new Remarkable();
md.use(rmermaid, {
  clientSide: true,           // Always use client-side rendering
  includeScript: true         // Include initialization script
});
```

### With Custom Styling
```javascript  
const md = new Remarkable();
md.use(rmermaid, {
  mermaidCustomClass: 'my-diagram bordered',
  mermaidCustomStyle: 'border: 2px solid #333; padding: 20px; border-radius: 8px;'
});
```

### Advanced Configuration

The plugin supports extensive customization through advanced configuration options:

```javascript
const md = new Remarkable();
md.use(rmermaid, {
  // === Rendering Control ===
  clientSide: false,                    // Force client-side rendering
  fallbackToClientSide: true,          // Enable automatic fallback
  
  // === Server-side Rendering Options ===
  theme: 'forest',                      // Mermaid theme
  fontFamily: 'Helvetica, sans-serif', // Font for diagrams
  fontSize: 14,                         // Base font size
  
  // === Styling & Layout ===
  mermaidCustomClass: 'diagram-container shadow-lg',
  mermaidCustomStyle: 'max-width: 100%; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
  
  // === Client-side Legacy Support ===
  includeScript: true,                  // Include mermaid.init() calls
  
  // === Advanced Mermaid Configuration ===
  mermaidConfig: {
    // Security and rendering settings
    securityLevel: 'loose',             // 'strict', 'loose', 'antiscript', 'sandbox'
    startOnLoad: false,                 // Don't auto-initialize
    htmlLabels: true,                   // Enable HTML in labels
    
    // Theme customization
    theme: 'base',                      // Override global theme
    themeVariables: {
      primaryColor: '#ff6b6b',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#ff5252',
      lineColor: '#333333',
      sectionBkgColor: '#f8f9fa',
      altSectionBkgColor: '#e9ecef',
      gridColor: '#cccccc',
      secondaryColor: '#4ecdc4',
      tertiaryColor: '#45b7d1'
    },
    
    // Diagram-specific configurations
    flowchart: {
      useMaxWidth: true,                // Responsive width
      htmlLabels: true,                 // HTML in flowchart labels
      curve: 'cardinal',                // Line curve style: 'basis', 'cardinal', 'catmullRom', 'linear', 'monotoneX', 'monotoneY', 'natural', 'step', 'stepAfter', 'stepBefore'
      diagramPadding: 20,               // Padding around diagram
      nodeSpacing: 50,                  // Space between nodes
      rankSpacing: 50,                  // Space between ranks
      defaultRenderer: 'dagre-d3'      // Rendering engine
    },
    
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,               // Horizontal margin
      diagramMarginY: 10,               // Vertical margin
      actorMargin: 50,                  // Space around actors
      width: 150,                       // Actor box width
      height: 65,                       // Actor box height
      boxMargin: 10,                    // Message box margin
      boxTextMargin: 5,                 // Text margin in boxes
      noteMargin: 10,                   // Note margin
      messageMargin: 35,                // Space between messages
      mirrorActors: true,               // Show actors on both sides
      bottomMarginAdj: 1,               // Bottom margin adjustment
      rightAngles: false,               // Use right angles for arrows
      showSequenceNumbers: false,       // Show sequence numbers
      actorFontSize: 14,               // Actor label font size
      actorFontFamily: '"Open Sans", sans-serif',
      actorFontWeight: 400,
      noteFontSize: 14,                 // Note font size
      noteFontFamily: '"trebuchet ms", verdana, arial, sans-serif',
      noteFontWeight: 400,
      noteAlign: 'center',              // Note alignment
      messageFontSize: 16,              // Message font size
      messageFontFamily: '"trebuchet ms", verdana, arial, sans-serif',
      messageFontWeight: 400
    },
    
    gantt: {
      useMaxWidth: true,
      titleTopMargin: 25,               // Title top margin
      barHeight: 20,                    // Bar height
      fontFamily: '"Open Sans", sans-serif',
      fontSize: 11,
      fontWeight: 'normal',
      gridLineStartPadding: 35,         // Grid line padding
      bottomPadding: 25,                // Bottom padding
      leftPadding: 75,                  // Left padding
      sectionFontSize: 24,              // Section title font size
      numberSectionStyles: 4            // Number of section styles
    },
    
    journey: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
      leftMargin: 150,                  // Left margin for labels
      width: 150,                       // Section width
      height: 50,                       // Section height
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      messageAlign: 'center',
      bottomMarginAdj: 1,
      rightAngles: false,
      taskFontSize: 14,
      taskFontFamily: '"Open Sans", sans-serif',
      taskMargin: 50,
      activationWidth: 10,              // Activation box width
      textPlacement: 'fo',              // Text placement method
      actorColours: ['#8085e9', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
    },
    
    class: {
      useMaxWidth: true,
      titleTopMargin: 25,
      arrowMarkerAbsolute: false,       // Use absolute arrow markers
      dividerMargin: 10,                // Class divider margin
      padding: 5,                       // Class box padding
      textHeight: 14,                   // Text height
      defaultRenderer: 'dagre-wrapper'  // Rendering engine
    },
    
    state: {
      useMaxWidth: true,
      titleTopMargin: 25,
      dividerMargin: 10,
      sizeUnit: 5,                      // Size unit for state boxes
      stateFillColor: '#f0f0f0',        // State fill color
      startLabelColor: '#000000',       // Start label color
      stateLabelColor: '#000000',       // State label color
      endLabelColor: '#000000',         // End label color
      labelBackgroundColor: '#e8e8e8',  // Label background
      nodeColours: ['#fff', '#f0f', '#0f0', '#00f'], // Node colors
      defaultRenderer: 'dagre-wrapper'
    },
    
    er: {
      useMaxWidth: true,
      titleTopMargin: 25,
      diagramPadding: 20,
      layoutDirection: 'TB',            // Layout direction: 'TB', 'BT', 'RL', 'LR'
      minEntityWidth: 100,              // Minimum entity width
      minEntityHeight: 75,              // Minimum entity height
      entityPadding: 15,                // Entity padding
      stroke: '#333333',                // Border color
      fill: '#f9f9f9',                  // Fill color
      fontSize: 12                      // Font size
    },
    
    pie: {
      useMaxWidth: true,
      textPosition: 0.75,               // Text position (0-1)
      outerStrokeWidth: 2,              // Outer stroke width
      innerStrokeColor: '#fff',         // Inner stroke color
      outerStrokeColor: '#333',         // Outer stroke color
      legendTextColor: '#333',          // Legend text color
      legendTitleColor: '#333',         // Legend title color
      pieOuterStrokeWidth: 2,           // Pie outer stroke
      pieSectionTextColor: '#fff',      // Section text color
      pieSectionTextSize: '19px',       // Section text size
      pieLegendTextSize: '17px',        // Legend text size
      pieLegendTextColor: '#222',       // Legend text color
      pieTitleTextSize: '20px',         // Title text size
      pieTitleTextColor: '#222'         // Title text color
    }
  }
});
```

## HTML Output

The plugin generates different HTML output depending on the rendering mode:

### Server-side Rendering Output
When server-side rendering is successful, the plugin generates an SVG diagram wrapped in a container:

```html
<div class="mermaid-diagram my-custom-class" id="mermaid-1234567890-abc123-container" style="border: 1px solid #ccc;">
  <svg id="mermaid-1234567890-abc123" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
    <!-- Actual SVG diagram content -->
    <g>
      <rect x="10" y="10" width="60" height="30" fill="#f9f9f9" stroke="#333"/>
      <text x="40" y="30">Start</text>
      <!-- More SVG elements... -->
    </g>
  </svg>
</div>
```

### Client-side Rendering Output  
When using client-side rendering, the plugin generates a div with Mermaid source code:

```html
<div class="mermaid my-custom-class" id="mermaid-1234567890-abc123" style="border: 1px solid #ccc;">
graph TD
    A[Start] --&gt; B[Process]
    B --&gt; C[End]
</div>
```

### Error Output
When rendering fails and fallback is disabled:

```html
<div class="mermaid-error">
  <strong>Mermaid Render Error:</strong> Invalid syntax
  <details style="margin-top: 10px;">
    <summary>Source Code</summary>
    <pre style="background: #f5f5f5; padding: 10px; margin: 5px 0;">
graph TD
    A[Start] --&gt; B[Process]
    B --&gt; C[End]
    </pre>
  </details>
</div>
```

# Dependencies

## Required
- None (the plugin works with client-side rendering fallback by default)

## Optional (for server-side rendering)
- **[Mermaid.js](https://mermaid.js.org/)** -- Server-side diagram generation
- **[jsdom](https://github.com/jsdom/jsdom)** -- DOM environment for server-side rendering

## Client-side (if using client-side rendering)
- **[Mermaid.js](https://mermaid.js.org/)** -- Client-side diagram rendering (include in your web page)

# Tests

There are a set of [Vows](http://vowsjs.org) tests in [index.test.js](index.test.js). To run:

```bash
% npm test
```

The test suite includes comprehensive tests for:
- **Diagram Types**: All major Mermaid diagram types (flowcharts, sequence, class, etc.)
- **Real-world Scenarios**: Complex diagrams from actual documentation
- **HTML Security**: HTML escaping and XSS prevention
- **Configuration**: Custom styling, themes, and configuration options
- **Error Handling**: Malformed syntax and graceful fallbacks
- **Performance**: Large diagrams and rendering speed
- **Cross-platform**: Works on different Node.js versions and operating systems

> **NOTE**: if this fails, there may be a path issue with `vows` executable. See [package.json](package.json).
