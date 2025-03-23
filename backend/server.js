const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({
  path: '.env'
});

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// PlayDialog API configuration
const PLAYDIALOG_USER_ID = process.env.PLAYDIALOG_USER_ID;
const PLAYDIALOG_SECRET_KEY = process.env.PLAYDIALOG_SECRET_KEY;

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
    // Check if API key exists and has the correct format
    if (!DEEPSEEK_API_KEY || !DEEPSEEK_API_KEY.startsWith('sk-')) {
      console.error('Invalid DeepSeek API key format - must start with "sk-"');
      throw new Error('Invalid API key format');
    }
    
    console.log('Calling DeepSeek API...');
    
    // Ensure the API key is properly formatted with Bearer prefix
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
          'Authorization': `Bearer ${DEEPSEEK_API_KEY.trim()}` // Properly formatted with Bearer prefix
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
        
        IMPORTANT: Return ONLY valid Mermaid.js code. No explanations, no text outside the code, no markdown formatting. Ensure the code does not produce syntax error in Mermaid.js
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

// Text-to-Speech endpoint updated to use PlayDialog API
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, style = 'conversational' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!PLAYDIALOG_USER_ID || !PLAYDIALOG_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'PlayDialog API credentials not configured',
        message: "Text-to-speech functionality is not available. Please configure the PLAYDIALOG_USER_ID and PLAYDIALOG_SECRET_KEY in the .env file."
      });
    }
    
    console.log(`Generating podcast with PlayDialog API, style: ${style}`);

    try {
      // Configure voices based on style
      let voice1, voice2;
      let turnPrefix = 'HOST:';
      let turnPrefix2 = 'GUEST:';
      
      switch (style) {
        case 'educational':
          voice1 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'; // Male professor
          voice2 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'; // Female student
          break;
        case 'storytelling':
          voice1 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'; // Female narrator
          voice2 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'; // Male character
          break;
        case 'interview':
          voice1 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'; // Male interviewer
          voice2 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'; // Female expert
          break;
        case 'conversational':
        default:
          voice1 = 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json'; // Default male
          voice2 = 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json'; // Default female
          break;
      }

      // Make API call to PlayDialog to initiate podcast generation
      const response = await axios.post(
        'https://api.play.ai/api/v1/tts/',
        {
          model: 'PlayDialog',
          text: text,
          voice: voice1,
          voice2: voice2,
          turnPrefix: turnPrefix,
          turnPrefix2: turnPrefix2,
          outputFormat: 'mp3'
        },
        {
          headers: {
            'X-USER-ID': PLAYDIALOG_USER_ID,
            'Authorization': PLAYDIALOG_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.id) {
        const jobId = response.data.id;
        console.log(`PlayDialog job initiated with ID: ${jobId}`);
        
        // Return job ID to client for polling
        return res.json({
          jobId: jobId,
          message: "Podcast generation initiated successfully. Use the jobId to check status.",
          status: "processing"
        });
      } else {
        console.error("Unexpected API response format:", response.data);
        throw new Error("Invalid response from PlayDialog API");
      }
    } catch (apiError) {
      console.error("PlayDialog API error:", apiError.message);
      
      if (apiError.response) {
        console.error("API Response Status:", apiError.response.status);
        console.error("API Response Headers:", apiError.response.headers);
        
        if (apiError.response.data) {
          console.error("API Response Body:", JSON.stringify(apiError.response.data));
        }
      }
      
      // Handle authentication errors
      if (apiError.message.includes('401') || apiError.message.includes('authentication') || apiError.message.includes('unauthorized')) {
        return res.status(401).json({
          error: 'Invalid PlayDialog API credentials',
          message: "The PlayDialog credentials are invalid or have expired. Please check your configuration and try again."
        });
      }
      
      throw apiError;
    }
    
  } catch (error) {
    console.error('Error in podcast generation:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to generate podcast audio',
      message: error.message
    });
  }
});

// Endpoint to check PlayDialog job status
app.get('/api/podcast-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    if (!PLAYDIALOG_USER_ID || !PLAYDIALOG_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'PlayDialog API credentials not configured',
        message: "Text-to-speech functionality is not available. Please configure the PLAYDIALOG_USER_ID and PLAYDIALOG_SECRET_KEY in the .env file."
      });
    }
    
    console.log(`Checking PlayDialog job status for ID: ${jobId}`);
    
    try {
      // Make API call to check job status
      const response = await axios.get(
        `https://api.play.ai/api/v1/tts/${jobId}`,
        {
          headers: {
            'X-USER-ID': PLAYDIALOG_USER_ID,
            'Authorization': PLAYDIALOG_SECRET_KEY
          }
        }
      );
      
      if (response.data && response.data.output) {
        const status = response.data.output.status;
        
        if (status === 'COMPLETED' && response.data.output.url) {
          // Job is complete, return the audio URL
          return res.json({
            status: 'completed',
            audioUrl: response.data.output.url,
            message: "Podcast generation completed successfully."
          });
        } else if (status === 'FAILED') {
          // Job failed
          return res.status(500).json({
            status: 'failed',
            message: "Podcast generation failed. Please try again."
          });
        } else {
          // Job is still processing
          return res.json({
            status: 'processing',
            message: "Podcast is still being generated. Please check again later."
          });
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        throw new Error("Invalid response from PlayDialog API");
      }
    } catch (apiError) {
      console.error("PlayDialog Status API error:", apiError.message);
      
      if (apiError.response) {
        console.error("API Response Status:", apiError.response.status);
        
        if (apiError.response.status === 404) {
          return res.status(404).json({
            error: 'Job not found',
            message: "The specified job ID does not exist or has expired."
          });
        }
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error checking PlayDialog job status:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to check podcast status',
      message: error.message
    });
  }
});

// Endpoint to download audio from PlayDialog URL and stream to client
app.get('/api/podcast-audio', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Audio URL is required' });
    }
    
    console.log(`Downloading PlayDialog audio from URL: ${url}`);
    
    try {
      // Download the audio file
      const response = await axios.get(url, {
        responseType: 'stream'
      });
      
      // Set appropriate headers and stream the response to the client
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="podcast_${Date.now()}.mp3"`);
      
      response.data.pipe(res);
    } catch (apiError) {
      console.error("PlayDialog Audio Download error:", apiError.message);
      throw apiError;
    }
  } catch (error) {
    console.error('Error downloading PlayDialog audio:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to download podcast audio',
      message: error.message
    });
  }
});

// Improve the generate-podcast-content endpoint to format content for the podcast studio
app.post('/api/generate-podcast-content', async (req, res) => {
  try {
    const { text, style = 'conversational' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`Received request to generate podcast content in ${style} style`);
    
    // Get the appropriate style prompt
    let stylePrompt = '';
    switch (style) {
      case 'educational':
        stylePrompt = 'Create an educational podcast script with a host explaining concepts clearly and a guest asking clarifying questions.';
        break;
      case 'storytelling':
        stylePrompt = 'Transform this into a narrative storytelling podcast with a main narrator and a secondary voice for characters or commentary.';
        break;
      case 'interview':
        stylePrompt = 'Create an interview-style podcast with a clear host and guest roles. The host should ask questions and the guest should provide expertise.';
        break;
      case 'conversational':
      default:
        stylePrompt = 'Create a conversational podcast with two speakers discussing topics in a casual, friendly tone.';
        break;
    }

    const useApi = apiUsageTracker.shouldUseApi();
    
    if (!useApi) {
      console.log('API usage limit reached or in cooldown. Returning simplified content');
      const fallbackScript = createFallbackPodcastScript(text.slice(0, 1000), style);
      return res.json({ 
        podcastContent: fallbackScript, 
        message: "Using simplified content. API quota will reset shortly."
      });
    }

    try {
      apiUsageTracker.recordUsage();
      
      // Construct the prompt for DeepSeek
      const prompt = `
        ${stylePrompt}
        
        FORMAT REQUIREMENTS:
        Create a natural and engaging podcast script featuring two speakers: HOST and GUEST
        Each line of dialogue should begin with "HOST:" or "GUEST:"
        Keep dialogue concise (1-3 sentences per speaker)
        Maintain a conversational and dynamic back-and-forth exchange
        Total length: 500-800 words
        STRUCTURE & FLOW:
        Introduction:
        HOST welcomes listeners and introduces the topic in an engaging way
        GUEST responds, setting up the discussion naturally
        Main Discussion:
        Smooth transitions between subtopics
        A mix of insights, questions, and real-world examples to maintain engagement
        Occasional humor or rhetorical questions to keep it lively
        Pacing & Speech Intervals:
        The script should naturally flow with short pauses (for emphasis or dramatic effect)
        Use brackets for pacing suggestions: [Pause], [Short Beat], or [Emphasize]
        If necessary, include scene-setting cues (e.g., "[Background music fades]")
        Conclusion & Sign-Off:
        Summarize key takeaways in a clear and memorable way
        End with a friendly and engaging sign-off, inviting listeners to tune in again
    INPUT DOCUMENT:
    ${text}
    OUTPUT EXPECTATION:
A well-structured podcast conversation based on the provided content
Engaging, easy to follow, and enjoyable for listeners
Clear pacing and transitions to ensure a natural listening experience
      `;
      
      // Call DeepSeek API
      const podcastContent = await generateWithDeepSeek(prompt);
      
      if (podcastContent) {
        console.log('Successfully generated podcast content');
        
        // Record successful API call
        apiUsageTracker.recordSuccess();
        
        return res.json({ 
          podcastContent: podcastContent,
          message: "Custom podcast content generated."
        });
      } else {
        throw new Error('Invalid content received');
      }
    } catch (error) {
      console.error('API Error:', error.message);
      
      // Improved rate limit detection
      if (
        error.message.includes('rate limit') || 
        error.message.includes('rate_limit') ||
        error.message.includes('429') ||
        error.message.includes('too many requests') ||
        (error.response && error.response.status === 429)
      ) {
        console.log('Rate limit exceeded, using simplified content');
        apiUsageTracker.recordRateLimit();
      }
      
      // Return simplified content for any error
      const fallbackScript = createFallbackPodcastScript(text.slice(0, 1000), style);
      return res.json({ 
        podcastContent: fallbackScript, 
        message: "Using simplified content. We'll try the API again soon."
      });
    }
  } catch (error) {
    console.error('Error in request handler:', error);
    return res.status(500).json({ error: 'Failed to generate podcast content' });
  }
});

// Helper function to create a fallback podcast script
function createFallbackPodcastScript(text, style) {
  let hostName, guestName;
  
  switch (style) {
    case 'educational':
      hostName = "Professor";
      guestName = "Student";
      break;
    case 'storytelling':
      hostName = "Narrator";
      guestName = "Character";
      break;
    case 'interview':
      hostName = "Interviewer";
      guestName = "Expert";
      break;
    case 'conversational':
    default:
      hostName = "Host";
      guestName = "Guest";
      break;
  }

  const splitTextBySentences = (text, limit) => {
    let words = text.split(" ");
    let count = 0;
    let result = [];

    for (let word of words) {
        result.push(word);
        count += word.length + 1; // +1 for the space
        if (count >= limit && /[.!?]$/.test(word)) {
            break;
        }
    }

    return result.join(" ");
};
  
  // Create a simple script structure
  return `HOST: Welcome to today’s episode. We’re exploring an important topic that plays a crucial role in computing.  

  GUEST: Glad to be here. This is a topic that deserves attention.  
  
  HOST: Let’s get started with some background.  
  ${splitTextBySentences(text, 200)}  
  
  GUEST: That sets the stage well. Can you expand on the key aspects?  
  
  HOST: Certainly. Here’s a breakdown of the main concepts:  
  ${splitTextBySentences(text.slice(200), 200)}  
  
  GUEST: That’s insightful. How does this apply in real-world scenarios?  
  
  HOST: Good question. Here’s how it plays out in practice:  
  ${splitTextBySentences(text.slice(400), 200)}  
  
  GUEST: That makes sense. Are there any challenges or limitations?  
  
  HOST: Absolutely. One major consideration is:  
  ${splitTextBySentences(text.slice(600), 200)}  
  
  GUEST: That’s valuable to know. Thanks for the detailed explanation.  
  
  HOST: My pleasure. And thanks to our listeners for joining us. Stay tuned for the next discussion.`;
  }


// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file upload storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF or Word document.'), false);
    }
  }
});

// API endpoint to extract text from PDF
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if it's a PDF
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      
      // Clean up file after extraction
      fs.unlinkSync(req.file.path);
      
      return res.json({ text: data.text });
    } else {
      // For non-PDF files (Word docs would be handled client-side)
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type. Server can only extract text from PDFs.' });
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: `Failed to extract text: ${error.message}` });
  }
});

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});