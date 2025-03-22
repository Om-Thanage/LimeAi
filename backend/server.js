const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios'); // We'll use axios for HTTP requests to DeepSeek API

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Track API usage to avoid hitting rate limits - MODIFIED FOR BETTER RELIABILITY
const apiUsageTracker = {
  usageCount: 0,
  resetTime: Date.now() + 60000, // Reset after a minute
  requestsPerMinuteLimit: 20, // Increased from 1 to 20 for better usability
  cooldownPeriod: 60000, // Reduced from 5 minutes to 1 minute
  lastRateLimitHit: 0,
  isInCooldown: false,
  consecutiveErrors: 0, // Track consecutive errors
  
  shouldUseApi: function() {
    const now = Date.now();
    
    // Check if we're in a cooldown period after a rate limit error
    if (this.isInCooldown) {
      if (now - this.lastRateLimitHit > this.cooldownPeriod) {
        console.log('Cooldown period ended. Resetting usage tracker.');
        this.isInCooldown = false;
        this.usageCount = 0;
        this.resetTime = now + 60000;
        this.consecutiveErrors = 0; // Reset error count
        return true; // Try API again after cooldown
      } else {
        console.log('Still in cooldown period. Using fallback.');
        return false;
      }
    }
    
    // Reset counter if the minute has passed
    if (now > this.resetTime) {
      this.usageCount = 0;
      this.resetTime = now + 60000;
    }
    
    // Always try API if we have quota available
    return this.usageCount < this.requestsPerMinuteLimit;
  },
  
  recordUsage: function() {
    this.usageCount++;
    console.log(`API request recorded. Current count: ${this.usageCount}/${this.requestsPerMinuteLimit}`);
  },
  
  recordSuccess: function() {
    // Reset consecutive errors on success
    this.consecutiveErrors = 0;
  },
  
  recordRateLimit: function() {
    this.lastRateLimitHit = Date.now();
    this.isInCooldown = true;
    this.consecutiveErrors++;
    
    // Only increase cooldown period if we keep hitting limits repeatedly
    if (this.consecutiveErrors > 3) {
      // More gentle increase
      this.cooldownPeriod = Math.min(this.cooldownPeriod * 1.5, 600000); // Max 10 minutes cooldown
    }
    
    console.log(`Rate limit hit. Entering cooldown for ${this.cooldownPeriod/1000} seconds.`);
  }
};

// Simple in-memory cache for previously generated flowcharts
const flowchartCache = new Map();

// Sample flowcharts for common concepts as fallback
const sampleFlowcharts = {
  default: `graph TD
    A[Start] --> B{Do you understand the concept?}
    B -->|Yes| C[Great! You're ready to proceed]
    B -->|No| D[Break it down into smaller parts]
    D --> E[Study each part separately]
    E --> F[Connect the concepts together]
    F --> B`,
  
  // Sample flowcharts remain the same
  'computer boot': `graph TD
    A[Power On] --> B[BIOS/UEFI Loads]
    B --> C[POST Process Checks Hardware]
    C --> D[Boot Device Located]
    D --> E[Boot Loader Runs]
    E --> F[Operating System Kernel Loads]
    F --> G[System Initialization]
    G --> H[User Login Screen]`,
  
  'http request': `graph TD
    A[User Enters URL] --> B[Browser Looks Up DNS]
    B --> C[Browser Establishes TCP Connection]
    C --> D[Browser Sends HTTP Request]
    D --> E[Server Processes Request]
    E --> F[Server Sends Response]
    F --> G[Browser Renders Page]`,
  
  'react rendering': `graph TD
    A[Component Rendered] --> B{State or Props Changed?}
    B -->|Yes| C[Virtual DOM Updated]
    B -->|No| D[No Re-render Needed]
    C --> E[Diff Algorithm Compares with Real DOM]
    E --> F[Only Changed Elements Updated in Real DOM]`,
  
  'algorithm': `graph TD
    A[Problem Definition] --> B[Design Algorithm]
    B --> C[Implement Code]
    C --> D[Test with Sample Data]
    D --> E{Passes All Tests?}
    E -->|No| F[Debug and Fix]
    F --> C
    E -->|Yes| G[Optimize if Needed]
    G --> H[Final Solution]`,
    
  'javascript': `graph TD
    A[JavaScript Code] --> B[JavaScript Engine]
    B --> C[Parser]
    C --> D[Abstract Syntax Tree]
    D --> E[Interpreter]
    E --> F[Bytecode]
    F --> G[Execution]
    G --> H{Performance Critical?}
    H -->|Yes| I[JIT Compiler]
    I --> J[Optimized Machine Code]
    H -->|No| K[Continue Interpreting]`,
    
  'machine learning': `graph TD
    A[Collect Data] --> B[Preprocess Data]
    B --> C[Split into Training/Testing Sets]
    C --> D[Choose Model]
    D --> E[Train Model]
    E --> F[Evaluate Model]
    F --> G{Performance Satisfactory?}
    G -->|No| H[Tune Hyperparameters]
    H --> E
    G -->|Yes| I[Deploy Model]`,
    
  'git': `graph TD
    A[Working Directory] -->|git add| B[Staging Area]
    B -->|git commit| C[Local Repository]
    C -->|git push| D[Remote Repository]
    D -->|git fetch| E[Track Remote]
    E -->|git merge| C
    D -->|git pull| C`,
    
  'database': `graph TD
    A[User Request] --> B[Application Server]
    B --> C[Database Connection Pool]
    C --> D[Execute Query]
    D --> E{Query Type?}
    E -->|SELECT| F[Retrieve Data]
    E -->|INSERT/UPDATE/DELETE| G[Modify Data]
    F --> H[Return Result Set]
    G --> I[Return Status]`
};

// Additional keywords remain the same
const additionalKeywords = {
  'python': `graph TD
    A[Python Code] --> B[Python Interpreter]
    B --> C[Bytecode Compilation]
    C --> D[Python Virtual Machine]
    D --> E[Execution]`,
    
  'web': `graph TD
    A[User Opens Browser] --> B[User Enters URL]
    B --> C[DNS Lookup]
    C --> D[HTTP Request]
    D --> E[Server Processing]
    E --> F[Response]
    F --> G[Browser Rendering]`,
    
  'cloud': `graph TD
    A[Application] --> B[Cloud Provider]
    B --> C{Service Type}
    C -->|Infrastructure| D[Virtual Machines/Storage]
    C -->|Platform| E[Managed Services]
    C -->|Software| F[Ready-to-use Applications]`,
    
  'security': `graph TD
    A[Data] --> B{Security Controls}
    B --> C[Authentication]
    B --> D[Authorization]
    B --> E[Encryption]
    B --> F[Monitoring]
    B --> G[Backup]`
};

// Add additional keywords to sample flowcharts
Object.entries(additionalKeywords).forEach(([key, value]) => {
  sampleFlowcharts[key] = value;
});

// IMPROVED: Get the best matching sample flowchart with better matching algorithm
function getBestMatchingSample(concept) {
  if (!concept || concept.trim() === '') return sampleFlowcharts.default;
  
  concept = concept.toLowerCase().trim();
  
  // For very short concepts (1-2 words), try direct matching first
  if (concept.split(/\s+/).length <= 2) {
    // Direct match check
    if (sampleFlowcharts[concept]) {
      return sampleFlowcharts[concept];
    }
    
    // Check if any sample key contains the whole concept
    for (const [key, flowchart] of Object.entries(sampleFlowcharts)) {
      if (key !== 'default' && 
          (key.includes(concept) || concept.includes(key))) {
        return flowchart;
      }
    }
  }
  
  // Score-based matching for longer concepts
  let bestMatch = null;
  let highestScore = 0;
  
  const conceptWords = concept.split(/\s+/);
  
  for (const [key, flowchart] of Object.entries(sampleFlowcharts)) {
    if (key === 'default') continue;
    
    let score = 0;
    const keyWords = key.split(/\s+/);
    
    // Calculate match score
    for (const word of conceptWords) {
      if (word.length < 3) continue; // Skip very short words
      
      if (key.includes(word)) {
        score += word.length; // Longer word matches get higher scores
      }
      
      for (const keyWord of keyWords) {
        if (keyWord.includes(word) || word.includes(keyWord)) {
          score += Math.min(word.length, keyWord.length) / 2;
        }
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = flowchart;
    }
  }
  
  // Return the best match or default if no good match found
  return bestMatch || sampleFlowcharts.default;
}

// Function to call the DeepSeek API
async function generateWithDeepSeek(prompt) {
  try {
    console.log('Calling DeepSeek API with API key:', DEEPSEEK_API_KEY.substring(0, 10) + '...');
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-coder', // Use deepseek-coder model which is good for structured outputs
        messages: [
          { 
            role: 'system', 
            content: 'You are a flowchart expert. You will generate Mermaid.js flowchart code to explain concepts. Always respond with only valid Mermaid.js code without any explanations.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2, // Lower temperature for more consistent outputs
        max_tokens: 1024
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    console.log('DeepSeek API response status:', response.status);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error('Invalid response structure:', JSON.stringify(response.data));
      throw new Error('Invalid response from DeepSeek API');
    }
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// API endpoint to generate flowchart from concept
app.post('/api/generate-flowchart', async (req, res) => {
  try {
    const { concept } = req.body;
    
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    console.log(`Received request for concept: "${concept}"`);
    
    // Check cache first
    const cacheKey = concept.toLowerCase().trim();
    if (flowchartCache.has(cacheKey)) {
      console.log('Cache hit! Returning cached flowchart');
      return res.json({
        mermaidCode: flowchartCache.get(cacheKey),
        isGeneratedByApi: true,
        message: "Using cached result for faster response."
      });
    }

    // Get the matching fallback
    const fallbackCode = getBestMatchingSample(concept);

    // Decide whether to use the API based on usage tracker
    const useApi = apiUsageTracker.shouldUseApi();
    
    if (!useApi) {
      console.log('API usage limit reached or in cooldown. Using fallback immediately');
      return res.json({ 
        mermaidCode: fallbackCode, 
        isGeneratedByApi: false,
        message: "Using a pre-built flowchart template. API quota will reset shortly."
      });
    }

    // Try the API with proper error handling
    try {
      // Record that we're attempting to use the API
      apiUsageTracker.recordUsage();
      
      // Construct the prompt for DeepSeek
      const prompt = `
        Create a flowchart using Mermaid.js syntax that explains: "${concept}"
        
        The flowchart should:
        1. Use graph TD syntax (top-down)
        2. Include 5-10 nodes with clear relationships
        3. Use simple language
        4. Cover the key aspects of "${concept}"
        
        Format requirements:
        - Start with 'graph TD'
        - Use proper Mermaid syntax with nodes [in brackets]
        - Include connections with arrows (-->)
        - Use clear branch labels for decision points using the |label| syntax
        
        IMPORTANT: Return ONLY valid Mermaid.js code. No explanations, no text outside the code, no markdown formatting.
      `;
      
      // Call DeepSeek API
      const mermaidCode = await generateWithDeepSeek(prompt);
      
      // Validate and clean the generated code
      let cleanCode = mermaidCode;
      
      // Handle cases where the response contains Markdown code blocks
      if (cleanCode.includes('```mermaid')) {
        cleanCode = cleanCode.split('```mermaid')[1].split('```')[0].trim();
      } else if (cleanCode.includes('```')) {
        cleanCode = cleanCode.split('```')[1].split('```')[0].trim();
      }
      
      // Validate that the mermaid code is properly formatted
      if (cleanCode && cleanCode.includes('graph')) {
        console.log('Successfully generated flowchart from DeepSeek API');
        
        // Record successful API call
        apiUsageTracker.recordSuccess();
        
        // Cache the result
        flowchartCache.set(cacheKey, cleanCode);
        
        // Limit cache size to 100 entries
        if (flowchartCache.size > 100) {
          const oldestKey = flowchartCache.keys().next().value;
          flowchartCache.delete(oldestKey);
        }
        
        // Return the successful API response
        return res.json({ 
          mermaidCode: cleanCode,
          isGeneratedByApi: true,
          message: "Custom flowchart generated for your concept."
        });
      } else {
        throw new Error('Invalid mermaid code received');
      }
    } catch (error) {
      console.error('API Error:', error.message);
      
      // Improved rate limit detection for DeepSeek API
      if (
        error.message.includes('rate limit') || 
        error.message.includes('rate_limit') ||
        error.message.includes('429') ||
        error.message.includes('too many requests') ||
        (error.response && error.response.status === 429)
      ) {
        console.log('Rate limit exceeded, using fallback');
        apiUsageTracker.recordRateLimit();
      } else if (
        error.message.includes('authentication') || 
        error.message.includes('auth') ||
        error.message.includes('api key') ||
        error.message.includes('unauthorized') ||
        (error.response && error.response.status === 401)
      ) {
        console.log('API authentication error - check your DeepSeek API key');
        // Mark as in cooldown to prevent repeated auth failures
        apiUsageTracker.recordRateLimit();
      }
      
      // Return fallback for any error with appropriate message
      return res.json({ 
        mermaidCode: fallbackCode, 
        isGeneratedByApi: false,
        message: "Using a template flowchart. We'll try the API again soon."
      });
    }
  } catch (error) {
    console.error('Error in request handler:', error);
    
    // Use fallback on any error
    const fallbackCode = getBestMatchingSample(req.body.concept || '');
    return res.json({ 
      mermaidCode: fallbackCode,
      isGeneratedByApi: false,
      message: "Using a pre-built flowchart. Please try again in a moment."
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({ 
    status: 'ok',
    apiInCooldown: apiUsageTracker.isInCooldown,
    nextAvailable: apiUsageTracker.isInCooldown ? 
      new Date(apiUsageTracker.lastRateLimitHit + apiUsageTracker.cooldownPeriod).toISOString() : 
      'now',
    cacheSize: flowchartCache.size
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});