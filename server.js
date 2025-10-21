const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'null', 'https://fooh-linkedin.snekmedia.com', 'http://fooh-linkedin.snekmedia.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));
app.use(express.json());

// Session middleware
app.use(session({
    name: 'fooh.sid',
    secret: process.env.SESSION_SECRET || 'fooh-default-secret',
    resave: false,
    saveUninitialized: true, // Changed to true for cross-domain compatibility
    proxy: true, // Trust the reverse proxy
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
        domain: process.env.NODE_ENV === 'production' ? '.up.railway.app' : undefined // Use Railway domain for cookies
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
}

// Serve static HTML file for local testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication endpoints
app.post('/api/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // For simplicity, using plain text comparison
        // In production, you'd use hashed passwords
        if (password === process.env.AUTH_PASSWORD) {
            req.session.authenticated = true;
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Session save failed' });
                }
                res.json({ success: true, message: 'Login successful' });
            });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

app.get('/api/auth-status', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'FOOH LinkedIn Post Generator API is running' });
});

// Generate LinkedIn post endpoint
app.post('/api/generate', requireAuth, async (req, res) => {
    try {
        const { description, metrics, fact, creator, systemPrompt, outputStructure } = req.body;

        // Validation
        if (!description || !metrics || !fact) {
            return res.status(400).json({
                error: 'All fields are required: description, metrics, and fact'
            });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({
                error: 'OpenAI API key not configured'
            });
        }

        // Use custom system prompt or default
        const finalSystemPrompt = systemPrompt || `You write short, high-signal LinkedIn posts about FOOH (Fake Out Of Home) videos.
Rules:
- Start with a varied HOOK that includes "FOOH".
- Include one-line performance indicator (views & likes).
- Relate directly to what happens in the video.
- Mention the creator(s) or "🎬 Created by [add creator]".
- Add one compact insight about why it worked.
- End with: "Explore more examples in the FOOH Library → fooh.com/library".
- Keep it 4–7 short lines, no hashtags.
- Vary hooks and rhythm so posts never feel repetitive.
When writing the hook, make sure to keep it short, consider mentioning the brand and use best practice on linkedin.
Use at most 1 emoji in the hook.`;

        // Append output structure if provided
        const fullSystemPrompt = outputStructure ?
            `${finalSystemPrompt}\n\nOUTPUT STRUCTURE:\n${outputStructure}` :
            finalSystemPrompt;

        // User prompt
        const userPrompt = `Description:
${description}

Metrics:
${metrics}

FOOH fact/insight:
${fact}${creator ? `\n\nCreator:\n${creator}` : ''}`;

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: fullSystemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);

            if (response.status === 429) {
                return res.status(503).json({
                    error: 'Rate limit exceeded. Please try again later.'
                });
            }

            return res.status(503).json({
                error: 'Failed to generate post. Please try again.'
            });
        }

        const data = await response.json();
        const post = data.choices[0]?.message?.content?.trim();

        if (!post) {
            return res.status(503).json({
                error: 'No content generated. Please try again.'
            });
        }

        res.json({ post });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(503).json({
            error: 'Internal server error. Please try again.'
        });
    }
});

// Preset management endpoints

// Get all presets
app.get('/api/presets', requireAuth, async (req, res) => {
    try {
        const presets = await db.getAllPresets();
        res.json(presets);
    } catch (error) {
        console.error('Error fetching presets:', error);
        res.status(500).json({ error: 'Failed to fetch presets' });
    }
});

// Get specific preset
app.get('/api/presets/:id', requireAuth, async (req, res) => {
    try {
        const preset = await db.getPreset(parseInt(req.params.id));
        if (!preset) {
            return res.status(404).json({ error: 'Preset not found' });
        }
        res.json(preset);
    } catch (error) {
        console.error('Error fetching preset:', error);
        res.status(500).json({ error: 'Failed to fetch preset' });
    }
});

// Create new preset
app.post('/api/presets', requireAuth, async (req, res) => {
    try {
        const { name, systemPrompt, outputStructure } = req.body;

        if (!name || !systemPrompt) {
            return res.status(400).json({ error: 'Name and system prompt are required' });
        }

        const preset = await db.createPreset(name, systemPrompt, outputStructure || '');
        res.status(201).json(preset);
    } catch (error) {
        console.error('Error creating preset:', error);
        if (error.message.includes('Maximum of 5 presets')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to create preset' });
        }
    }
});

// Update preset
app.put('/api/presets/:id', requireAuth, async (req, res) => {
    try {
        const { name, systemPrompt, outputStructure } = req.body;
        const id = parseInt(req.params.id);

        if (!name || !systemPrompt) {
            return res.status(400).json({ error: 'Name and system prompt are required' });
        }

        const preset = await db.updatePreset(id, name, systemPrompt, outputStructure || '');
        res.json(preset);
    } catch (error) {
        console.error('Error updating preset:', error);
        if (error.message === 'Preset not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update preset' });
        }
    }
});

// Delete preset
app.delete('/api/presets/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.deletePreset(id);
        res.json({ message: 'Preset deleted successfully' });
    } catch (error) {
        console.error('Error deleting preset:', error);
        if (error.message === 'Preset not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('Cannot delete the last remaining preset')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete preset' });
        }
    }
});

// Facts management endpoints

// Get all facts
app.get('/api/facts', requireAuth, async (req, res) => {
    try {
        const facts = await db.getAllFacts();
        res.json(facts);
    } catch (error) {
        console.error('Error fetching facts:', error);
        res.status(500).json({ error: 'Failed to fetch facts' });
    }
});

// Get specific fact
app.get('/api/facts/:id', requireAuth, async (req, res) => {
    try {
        const fact = await db.getFact(parseInt(req.params.id));
        if (!fact) {
            return res.status(404).json({ error: 'Fact not found' });
        }
        res.json(fact);
    } catch (error) {
        console.error('Error fetching fact:', error);
        res.status(500).json({ error: 'Failed to fetch fact' });
    }
});

// Create new fact
app.post('/api/facts', requireAuth, async (req, res) => {
    try {
        const { factText, category } = req.body;

        if (!factText || !factText.trim()) {
            return res.status(400).json({ error: 'Fact text is required' });
        }

        const fact = await db.createFact(factText.trim(), category || '');
        res.status(201).json(fact);
    } catch (error) {
        console.error('Error creating fact:', error);
        res.status(500).json({ error: 'Failed to create fact' });
    }
});

// Update fact
app.put('/api/facts/:id', requireAuth, async (req, res) => {
    try {
        const { factText, category } = req.body;
        const id = parseInt(req.params.id);

        if (!factText || !factText.trim()) {
            return res.status(400).json({ error: 'Fact text is required' });
        }

        const fact = await db.updateFact(id, factText.trim(), category || '');
        res.json(fact);
    } catch (error) {
        console.error('Error updating fact:', error);
        if (error.message === 'Fact not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update fact' });
        }
    }
});

// Delete fact
app.delete('/api/facts/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.deleteFact(id);
        res.json({ message: 'Fact deleted successfully' });
    } catch (error) {
        console.error('Error deleting fact:', error);
        if (error.message === 'Fact not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete fact' });
        }
    }
});

// Increment fact usage
app.post('/api/facts/:id/use', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.incrementFactUsage(id);
        res.json({ message: 'Usage count updated' });
    } catch (error) {
        console.error('Error updating fact usage:', error);
        res.status(500).json({ error: 'Failed to update usage count' });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        await db.initialize();
        app.listen(PORT, () => {
            console.log(`FOOH LinkedIn Post Generator API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    db.close();
    process.exit(0);
});

startServer();