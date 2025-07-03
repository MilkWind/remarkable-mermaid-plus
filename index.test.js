"use strict";

const vows = require('vows');
const assert = require('assert');
const { Remarkable } = require('remarkable');

const plugin = require('./index.js');

const md = new Remarkable();
md.use(plugin);

vows.describe('MermaidPlugin').addBatch({
  'Render simple Mermaid diagram': {
    topic: md.render('```mermaid\ngraph TD\n    A-->B\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains diagram content': function(topic) {
      assert.notEqual(topic.indexOf('graph TD'), -1);
      assert.notEqual(topic.indexOf('A--&gt;B'), -1);
    },
    'Has unique id': function(topic) {
      assert.notEqual(topic.indexOf('id="mermaid-'), -1);
    }
  },
  'Render Mermaid flowchart': {
    topic: md.render('```mermaid\nflowchart LR\n    Start --> End\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains flowchart content': function(topic) {
      assert.notEqual(topic.indexOf('flowchart LR'), -1);
      assert.notEqual(topic.indexOf('Start --&gt; End'), -1);
    }
  },
  'Render Mermaid sequence diagram': {
    topic: md.render('```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains sequence diagram content': function(topic) {
      assert.notEqual(topic.indexOf('sequenceDiagram'), -1);
      assert.notEqual(topic.indexOf('Alice-&gt;&gt;Bob: Hello'), -1);
    }
  },
  'Ignore non-mermaid code blocks': {
    topic: md.render('```javascript\nconst x = 1;\n```'),
    'No mermaid div': function(topic) {
      assert.equal(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Regular code block': function(topic) {
      assert.notEqual(topic.indexOf('<pre><code class="language-javascript">'), -1);
    }
  },
  'Incomplete mermaid block (no closing)': {
    topic: md.render('```mermaid\ngraph TD\n    A-->B'),
    'No mermaid div': function(topic) {
      assert.equal(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Falls back to code block': function(topic) {
      assert.notEqual(topic.indexOf('<pre><code class="language-mermaid">'), -1);
    }
  },
  'Empty mermaid block': {
    topic: md.render('```mermaid\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Empty content': function(topic) {
      assert.notEqual(topic.indexOf('></div>'), -1);
    }
  },
  'Mermaid with custom options': {
    topic() {
      const md = new Remarkable();
      md.use(plugin, {
        mermaidCustomClass: 'custom-class',
        mermaidCustomStyle: 'border: 1px solid red;'
      });
      return md.render('```mermaid\ngraph TD\n    A-->B\n```');
    },
    'Contains custom class': function(topic) {
      assert.notEqual(topic.indexOf('class="mermaid custom-class"'), -1);
    },
    'Contains custom style': function(topic) {
      assert.notEqual(topic.indexOf('style="border: 1px solid red;"'), -1);
    }
  },
  'Mermaid with script inclusion': {
    topic() {
      const md = new Remarkable();
      md.use(plugin, {
        includeScript: true
      });
      return md.render('```mermaid\ngraph TD\n    A-->B\n```');
    },
    'Contains initialization script': function(topic) {
      assert.notEqual(topic.indexOf('<script>'), -1);
      assert.notEqual(topic.indexOf('mermaid.init'), -1);
    }
  },
  'HTML escaping in Mermaid': {
    topic: md.render('```mermaid\ngraph TD\n    A[\"Hello <world>\"]\n```'),
    'HTML characters escaped': function(topic) {
      assert.notEqual(topic.indexOf('&lt;world&gt;'), -1);
    },
    'No unescaped HTML': function(topic) {
      assert.equal(topic.indexOf('<world>'), -1);
    }
  },
  'Case insensitive mermaid': {
    topic: md.render('```MERMAID\ngraph TD\n    A-->B\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains diagram content': function(topic) {
      assert.notEqual(topic.indexOf('graph TD'), -1);
    }
  },
  
  // ==================== JSON Parsing MDX File Specific Tests ====================
  
  'Render UserConfigDO classDiagram from json-parsing.mdx': {
    topic: md.render(`\`\`\`mermaid
classDiagram
    class UserConfigDO {
        +Long id
        +Boolean isAvailable
        +String name
        +String apiUrl
        +String apiKey
        
        +String apiKeyPlacement
        +String apiKeyHeader
        +String apiKeyBodyPath
        
        +Map requestTemplate
        +Map responseTemplate
        +Map headers
        
        +String requestMessageGroupPath
        +String requestRolePathFromGroup
        +String requestTextPathFromGroup
        +String responseTextPath
        +String responseThinkingTextPath
        
        +String requestUserRoleField
        +String requestAssistantField
        +String requestSystemField
        
        +LocalDateTime lastUsedTime
        +String secretKey
    }
\`\`\``),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains classDiagram keyword': function(topic) {
      assert.notEqual(topic.indexOf('classDiagram'), -1);
    },
    'Contains UserConfigDO class': function(topic) {
      assert.notEqual(topic.indexOf('class UserConfigDO'), -1);
    },
    'Contains class properties': function(topic) {
      assert.notEqual(topic.indexOf('+Long id'), -1);
      assert.notEqual(topic.indexOf('+String apiUrl'), -1);
      assert.notEqual(topic.indexOf('+Map requestTemplate'), -1);
      assert.notEqual(topic.indexOf('+LocalDateTime lastUsedTime'), -1);
    },
    'Properties are correctly rendered': function(topic) {
      // Check that property names are correctly rendered (no HTML escaping needed for class properties)
      assert.notEqual(topic.indexOf('+Long id'), -1);
      assert.notEqual(topic.indexOf('+String'), -1);
    }
  },
  
  'Render Encryption Flow flowchart from json-parsing.mdx': {
    topic: md.render(`\`\`\`mermaid
flowchart TD
    A[Frontend CryptoJS Encryption] --> B[Base64 Encoding for Transmission]
    B --> C[Backend Base64 Decoding]
    C --> D[Extract Salted__ Prefix]
    D --> E[Extract 8-byte Salt]
    E --> F[Extract Actual Ciphertext]
    F --> G[EVP_BytesToKey Key Derivation]
    G --> H[AES/CBC Decryption]
    H --> I[PKCS5 Padding Removal]
    I --> J[Original API Key]
\`\`\``),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains flowchart keyword': function(topic) {
      assert.notEqual(topic.indexOf('flowchart TD'), -1);
    },
    'Contains encryption nodes': function(topic) {
      assert.notEqual(topic.indexOf('Frontend CryptoJS Encryption'), -1);
      assert.notEqual(topic.indexOf('Base64 Encoding for Transmission'), -1);
      assert.notEqual(topic.indexOf('AES/CBC Decryption'), -1);
      assert.notEqual(topic.indexOf('Original API Key'), -1);
    },
    'Contains flow arrows': function(topic) {
      assert.notEqual(topic.indexOf('--&gt;'), -1); // --> should be escaped as --&gt;
    },
    'Contains complex node labels': function(topic) {
      assert.notEqual(topic.indexOf('Extract Salted__ Prefix'), -1);
      assert.notEqual(topic.indexOf('EVP_BytesToKey Key Derivation'), -1);
    }
  },
  
  'Render HTTP Requests sequenceDiagram from json-parsing.mdx': {
    topic: md.render(`\`\`\`mermaid
sequenceDiagram
    participant Service as ConversationService
    participant Utils as HttpUtils
    participant API as AI_API
    participant Parser as JsonUtils

    Service->>Utils: prepareRequestData(config, message, history)
    Utils->>Utils: Decrypt API key
    Utils->>Utils: Build request headers
    Utils->>Utils: Build request body
    Utils-->>Service: {headers, requestBody}
    
    Service->>Parser: toJsonString(requestBody)
    Parser-->>Service: requestBodyStr
    
    Service->>Utils: post(url, headers, body)
    Utils->>API: HTTP POST
    API-->>Utils: JSON Response
    Utils-->>Service: responseStr
    
    Service->>Parser: parseObject(responseStr)
    Parser-->>Service: responseMap
    
    Service->>Parser: extractValueFromPath(responseMap, textPath)
    Parser-->>Service: content
\`\`\``),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains sequenceDiagram keyword': function(topic) {
      assert.notEqual(topic.indexOf('sequenceDiagram'), -1);
    },
    'Contains participant declarations': function(topic) {
      assert.notEqual(topic.indexOf('participant Service as ConversationService'), -1);
      assert.notEqual(topic.indexOf('participant Utils as HttpUtils'), -1);
      assert.notEqual(topic.indexOf('participant API as AI_API'), -1);
      assert.notEqual(topic.indexOf('participant Parser as JsonUtils'), -1);
    },
    'Contains sequence interactions': function(topic) {
      assert.notEqual(topic.indexOf('Service-&gt;&gt;Utils: prepareRequestData'), -1);
      assert.notEqual(topic.indexOf('Utils-&gt;&gt;API: HTTP POST'), -1);
      assert.notEqual(topic.indexOf('API--&gt;&gt;Utils: JSON Response'), -1);
    },
    'Contains complex method calls': function(topic) {
      assert.notEqual(topic.indexOf('prepareRequestData(config, message, history)'), -1);
      assert.notEqual(topic.indexOf('extractValueFromPath(responseMap, textPath)'), -1);
    }
  },
  
  'Render System Architecture graph from json-parsing.mdx': {
    topic: md.render(`\`\`\`mermaid
graph TB
    A[User Request] --> B[sendMessage Method]
    B --> C[Permission Verification]
    C --> D[Configuration Retrieval]
    D --> E[Message History Query]
    E --> F[prepareRequestData]
    
    F --> G[API Key Decryption]
    G --> H[Request Header Construction]
    H --> I[Request Body Construction]
    I --> J[Message Group Assembly]
    
    J --> K[HTTP POST Call]
    K --> L[Response Parsing]
    L --> M[Content Extraction]
    M --> N[Message Saving]
    N --> O[Cache Update]
    O --> P[Configuration Marking]
    P --> Q[Return Result]
    
    subgraph "Configuration System"
        D1[UserConfigDO]
        D2[Flexible Key Placement]
        D3[JSON Templating]
        D4[Path Configuration]
    end
    
    subgraph "Encryption System"  
        G1[CryptoJS Compatible]
        G2[EVP_BytesToKey]
        G3[AES/CBC Decryption]
    end
    
    subgraph "Data Processing"
        F1[Simple prepareRequestData]
        F2[Complete prepareRequestData]
        F3[Message History Processing]
        F4[Role Mapping]
    end
\`\`\``),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains graph TB keyword': function(topic) {
      assert.notEqual(topic.indexOf('graph TB'), -1);
    },
    'Contains main flow nodes': function(topic) {
      assert.notEqual(topic.indexOf('A[User Request]'), -1);
      assert.notEqual(topic.indexOf('B[sendMessage Method]'), -1);
      assert.notEqual(topic.indexOf('Q[Return Result]'), -1);
    },
    'Contains subgraph definitions': function(topic) {
      assert.notEqual(topic.indexOf('subgraph &quot;Configuration System&quot;'), -1);
      assert.notEqual(topic.indexOf('subgraph &quot;Encryption System&quot;'), -1);
      assert.notEqual(topic.indexOf('subgraph &quot;Data Processing&quot;'), -1);
    },
    'Contains subgraph nodes': function(topic) {
      assert.notEqual(topic.indexOf('D1[UserConfigDO]'), -1);
      assert.notEqual(topic.indexOf('G2[EVP_BytesToKey]'), -1);
      assert.notEqual(topic.indexOf('F3[Message History Processing]'), -1);
    },
    'Contains complex node connections': function(topic) {
      assert.notEqual(topic.indexOf('A[User Request] --&gt; B[sendMessage Method]'), -1);
      assert.notEqual(topic.indexOf('P --&gt; Q[Return Result]'), -1);
    },
    'Properly escapes quotes in subgraph names': function(topic) {
      // Subgraph names with spaces should be quoted and escaped
      assert.notEqual(topic.indexOf('&quot;Configuration System&quot;'), -1);
      assert.notEqual(topic.indexOf('&quot;Encryption System&quot;'), -1);
      assert.notEqual(topic.indexOf('&quot;Data Processing&quot;'), -1);
    }
  },
  
  'Complex mermaid with special characters and formatting': {
    topic: md.render(`\`\`\`mermaid
graph LR
    A["Node with <brackets>"] --> B["Node with 'quotes'"]
    B --> C["Node with &amp; symbols"]
    C --> D["Multi-line<br/>Node"]
    D --> E["Node with (parentheses)"]
\`\`\``),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Escapes HTML entities': function(topic) {
      assert.notEqual(topic.indexOf('&lt;brackets&gt;'), -1);
      assert.notEqual(topic.indexOf('&amp;amp; symbols'), -1);
    },
    'Preserves quotes properly': function(topic) {
      assert.notEqual(topic.indexOf("&#39;quotes&#39;"), -1);
    },
    'Preserves special formatting': function(topic) {
      assert.notEqual(topic.indexOf('Multi-line&lt;br/&gt;Node'), -1);
      assert.notEqual(topic.indexOf('(parentheses)'), -1);
    }
  },
  
  'Large complex mermaid diagram performance test': {
    topic() {
      const largeDiagram = `\`\`\`mermaid
graph TB
    ${Array.from({length: 50}, (_, i) => `    Node${i}[Node ${i}] --> Node${i+1}[Node ${i+1}]`).join('\n')}
\`\`\``;
      const startTime = Date.now();
      const result = md.render(largeDiagram);
      const endTime = Date.now();
      return { result, renderTime: endTime - startTime };
    },
    'Renders successfully': function(topic) {
      assert.notEqual(topic.result.indexOf('<div class="mermaid"'), -1);
    },
    'Contains all nodes': function(topic) {
      assert.notEqual(topic.result.indexOf('Node0[Node 0]'), -1);
      assert.notEqual(topic.result.indexOf('Node49[Node 49]'), -1);
    },
    'Renders in reasonable time': function(topic) {
      // Should render in less than 1 second for 50 nodes
      assert.isTrue(topic.renderTime < 1000);
    }
  },
  
  'Error handling for malformed mermaid syntax': {
    topic: md.render(`\`\`\`mermaid
graph TD
    A --> 
    --> B
    C[Incomplete node
\`\`\``),
    'Contains mermaid div': function(topic) {
      // Even malformed syntax should still create a mermaid div
      // mermaid.js will handle the error rendering on client side
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains the malformed content': function(topic) {
      assert.notEqual(topic.indexOf('A --&gt;'), -1);
      assert.notEqual(topic.indexOf('--&gt; B'), -1);
      assert.notEqual(topic.indexOf('C[Incomplete node'), -1);
    }
  }
}).export(module);
