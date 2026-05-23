/**
 * Portal Champions - Backend Server
 * Express + Claude API + Google Drive integration
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
const XLSX = require('xlsx');

// ============================================================
// CONFIG
// ============================================================
const PORT = process.env.PORT || 80;
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Required env vars check
const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
for (const v of REQUIRED_ENV) {
    if (!process.env[v]) {
        console.error(`❌ Missing required env var: ${v}`);
    }
}

// ============================================================
// CLIENTS
// ============================================================
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    'http://tlnage6eg0u1m5wwc2u33z9r.157.230.18.66.sslip.io/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
];

// ============================================================
// TOKEN STORAGE
// ============================================================
function loadTokens() {
    try {
        if (fs.existsSync(TOKENS_FILE)) {
            return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading tokens:', err);
    }
    return null;
}

function saveTokens(tokens) {
    try {
        fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
        console.log('✅ Tokens saved');
    } catch (err) {
        console.error('Error saving tokens:', err);
    }
}

// Load existing tokens on startup
const existingTokens = loadTokens();
if (existingTokens) {
    oauth2Client.setCredentials(existingTokens);
    console.log('✅ Loaded existing Google tokens from disk');
}

// Auto-save refreshed tokens
oauth2Client.on('tokens', (newTokens) => {
    const current = loadTokens() || {};
    saveTokens({ ...current, ...newTokens });
});

// ============================================================
// GOOGLE DRIVE HELPERS
// ============================================================
function getDrive() {
    return google.drive({ version: 'v3', auth: oauth2Client });
}

async function findFolderId(folderName, parentId = null) {
    const drive = getDrive();
    const query = [
        `name='${folderName.replace(/'/g, "\\'")}'`,
        `mimeType='application/vnd.google-apps.folder'`,
        `trashed=false`,
    ];
    if (parentId) query.push(`'${parentId}' in parents`);

    const res = await drive.files.list({
        q: query.join(' and '),
        fields: 'files(id, name)',
        pageSize: 10,
    });
    return res.data.files[0]?.id || null;
}

async function listFolder(folderId) {
    const drive = getDrive();
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, modifiedTime, size)',
        pageSize: 100,
        orderBy: 'name',
    });
    return res.data.files;
}

async function downloadFile(fileId) {
    const drive = getDrive();
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );
    return Buffer.from(res.data);
}

async function getFileMetadata(fileId) {
    const drive = getDrive();
    const res = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, modifiedTime, size, parents',
    });
    return res.data;
}

async function renameFile(fileId, newName) {
    const drive = getDrive();
    const res = await drive.files.update({
        fileId,
        requestBody: { name: newName },
        fields: 'id, name',
    });
    return res.data;
}

async function uploadFile(fileId, buffer, mimeType) {
    const drive = getDrive();
    const { Readable } = require('stream');
    const stream = Readable.from(buffer);

    const res = await drive.files.update({
        fileId,
        media: {
            mimeType,
            body: stream,
        },
        fields: 'id, name',
    });
    return res.data;
}

// ============================================================
// AGENT TOOLS
// ============================================================
const AGENT_TOOLS = [
    {
        name: 'find_folder',
        description:
            'Find a folder in Google Drive by its name. Returns the folder ID. Use this first when you need to access a specific folder.',
        input_schema: {
            type: 'object',
            properties: {
                folder_name: {
                    type: 'string',
                    description:
                        'Exact name of the folder, e.g. "06 יוני" or "חשבונאות - רון אוחנה אחזקות בע״מ"',
                },
            },
            required: ['folder_name'],
        },
    },
    {
        name: 'list_folder_contents',
        description:
            'List all files and subfolders inside a Google Drive folder, given its ID.',
        input_schema: {
            type: 'object',
            properties: {
                folder_id: { type: 'string' },
            },
            required: ['folder_id'],
        },
    },
    {
        name: 'read_pdf_invoice',
        description:
            'Read an invoice PDF file from Google Drive and extract its text content. Use this to read invoice details.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string' },
            },
            required: ['file_id'],
        },
    },
    {
        name: 'read_xlsx',
        description:
            'Read the contents of an Excel (.xlsx) file from Google Drive. Returns all sheets and their data.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string' },
                sheet_name: {
                    type: 'string',
                    description: 'Optional: specific sheet to read. If omitted, returns all sheets.',
                },
            },
            required: ['file_id'],
        },
    },
    {
        name: 'write_xlsx_row',
        description:
            'Add or update a row in an Excel sheet. Useful for adding new invoice records.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string' },
                sheet_name: { type: 'string' },
                row_number: {
                    type: 'number',
                    description: 'The 1-indexed row number to write to',
                },
                values: {
                    type: 'object',
                    description:
                        'Map of column letter (e.g. "B", "C") to cell value',
                    additionalProperties: true,
                },
            },
            required: ['file_id', 'sheet_name', 'row_number', 'values'],
        },
    },
    {
        name: 'rename_file',
        description:
            'Rename a file in Google Drive. Useful for adding ✅ prefix to processed invoices.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string' },
                new_name: { type: 'string' },
            },
            required: ['file_id', 'new_name'],
        },
    },
    {
        name: 'ask_user',
        description:
            'Ask the user a question and wait for their response. Use this when you need clarification or approval before doing a destructive action.',
        input_schema: {
            type: 'object',
            properties: {
                question: { type: 'string' },
            },
            required: ['question'],
        },
    },
];

// ============================================================
// TOOL IMPLEMENTATIONS
// ============================================================
async function executeToolCall(toolName, input) {
    console.log(`🔧 Tool call: ${toolName}`, JSON.stringify(input).slice(0, 200));

    try {
        switch (toolName) {
            case 'find_folder': {
                const id = await findFolderId(input.folder_name);
                return id
                    ? { folder_id: id, name: input.folder_name }
                    : { error: `Folder not found: ${input.folder_name}` };
            }

            case 'list_folder_contents': {
                const files = await listFolder(input.folder_id);
                return {
                    files: files.map((f) => ({
                        id: f.id,
                        name: f.name,
                        type: f.mimeType,
                        modified: f.modifiedTime,
                        size_bytes: f.size,
                    })),
                };
            }

            case 'read_pdf_invoice': {
                const buffer = await downloadFile(input.file_id);
                const metadata = await getFileMetadata(input.file_id);

                // For PDFs and images, return as base64 for Claude vision
                const base64 = buffer.toString('base64');
                return {
                    file_name: metadata.name,
                    mime_type: metadata.mimeType,
                    base64_content: base64,
                    size_bytes: buffer.length,
                    note: 'Use vision to extract invoice details from this content.',
                };
            }

            case 'read_xlsx': {
                const buffer = await downloadFile(input.file_id);
                const wb = XLSX.read(buffer, { type: 'buffer' });

                if (input.sheet_name) {
                    if (!wb.SheetNames.includes(input.sheet_name)) {
                        return {
                            error: `Sheet "${input.sheet_name}" not found. Available sheets: ${wb.SheetNames.join(', ')}`,
                        };
                    }
                    const sheet = wb.Sheets[input.sheet_name];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
                    return {
                        sheet_name: input.sheet_name,
                        rows: json.slice(0, 50), // limit to first 50 rows for token efficiency
                        total_rows: json.length,
                    };
                }

                // Return all sheets summary
                return {
                    sheet_names: wb.SheetNames,
                    sheets: wb.SheetNames.map((name) => {
                        const sheet = wb.Sheets[name];
                        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
                        return {
                            name,
                            row_count: json.length,
                            preview: json.slice(0, 10),
                        };
                    }),
                };
            }

            case 'write_xlsx_row': {
                const metadata = await getFileMetadata(input.file_id);
                const buffer = await downloadFile(input.file_id);
                const wb = XLSX.read(buffer, { type: 'buffer' });

                if (!wb.SheetNames.includes(input.sheet_name)) {
                    return { error: `Sheet "${input.sheet_name}" not found.` };
                }

                const sheet = wb.Sheets[input.sheet_name];
                for (const [col, value] of Object.entries(input.values)) {
                    const cellRef = `${col}${input.row_number}`;
                    XLSX.utils.sheet_add_aoa(sheet, [[value]], { origin: cellRef });
                }

                // Update sheet range if needed
                const newBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
                await uploadFile(
                    input.file_id,
                    newBuffer,
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );

                return {
                    success: true,
                    file_name: metadata.name,
                    sheet: input.sheet_name,
                    row: input.row_number,
                    values_written: input.values,
                };
            }

            case 'rename_file': {
                const result = await renameFile(input.file_id, input.new_name);
                return { success: true, new_name: result.name };
            }

            case 'ask_user': {
                // Special tool - just returns the question for the user to answer
                return { question: input.question, awaiting_user_response: true };
            }

            default:
                return { error: `Unknown tool: ${toolName}` };
        }
    } catch (err) {
        console.error(`Tool error (${toolName}):`, err.message);
        return { error: err.message };
    }
}

// ============================================================
// AGENT SYSTEM PROMPT
// ============================================================
const FALLBACK_SYSTEM_PROMPT = `You are the accounting agent for Ron Ohana Holdings Ltd (רון אוחנה אחזקות בע"מ).

You help Ron process invoices and maintain his accounting Excel spreadsheet stored in Google Drive.

Key workflow:
1. Invoices arrive as PDFs in monthly folders (e.g. "06 יוני" in the 2026 folder)
2. You extract invoice details: date, vendor, amount excluding VAT, total amount
3. You add new rows to the relevant month's sheet in the Excel file
4. You add ✅ prefix to processed invoice file names

Important rules:
- ALWAYS show the user a confirmation table before writing to the spreadsheet
- File belongs to the month FOLDER it's in, even if invoice date is from a different month
- For receipts without VAT breakdown: full amount goes in "no VAT" column, leave "with VAT" empty
- Hebrew is the working language. Respond in Hebrew naturally and warmly.
- If unsure, use the ask_user tool

Excel structure:
- One sheet per month (ינואר, פברואר, etc.)
- Column B: date (DD/MM/YYYY)
- Column C: expense name (file name without ✅ and .pdf)
- Column D: amount excluding VAT
- Column E: total amount including VAT
- Data starts at row 7

You have tools to: find_folder, list_folder_contents, read_pdf_invoice, read_xlsx, write_xlsx_row, rename_file, ask_user.

Always think step by step and explain what you're doing to the user.`;

async function loadSystemPrompt() {
    // Try to load _AGENT-INSTRUCTIONS.md from Drive
    try {
        const tokens = loadTokens();
        if (!tokens) return FALLBACK_SYSTEM_PROMPT;

        const drive = getDrive();
        const res = await drive.files.list({
            q: `name='_AGENT-INSTRUCTIONS.md' and trashed=false`,
            fields: 'files(id, name)',
            pageSize: 1,
        });

        if (res.data.files.length > 0) {
            const buffer = await downloadFile(res.data.files[0].id);
            const customPrompt = buffer.toString('utf8');
            console.log('✅ Loaded custom system prompt from Drive');
            return customPrompt + '\n\n' + FALLBACK_SYSTEM_PROMPT;
        }
    } catch (err) {
        console.warn('Could not load custom prompt from Drive:', err.message);
    }
    return FALLBACK_SYSTEM_PROMPT;
}

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();
app.use(express.json({ limit: '50mb' }));

// Serve static HTML files
app.use(express.static(__dirname, { extensions: ['html'] }));

// ----- OAuth Routes -----
app.get('/api/google/connect', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) {
        return res.status(400).send(`OAuth error: ${error}`);
    }
    if (!code) {
        return res.status(400).send('Missing code parameter');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        saveTokens(tokens);
        console.log('✅ Google OAuth completed, tokens saved');
        res.redirect('/dashboard.html?connected=true');
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('OAuth failed: ' + err.message);
    }
});

app.get('/api/google/status', (req, res) => {
    const tokens = loadTokens();
    res.json({
        connected: !!tokens,
        has_refresh_token: !!(tokens && tokens.refresh_token),
    });
});

// ----- Chat Endpoint -----
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array is required' });
    }

    try {
        const systemPrompt = await loadSystemPrompt();

        // Run agent loop
        let conversation = [...messages];
        let iterations = 0;
        const MAX_ITERATIONS = 10;

        while (iterations < MAX_ITERATIONS) {
            iterations++;

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: systemPrompt,
                tools: AGENT_TOOLS,
                messages: conversation,
            });

            // Add assistant response to conversation
            conversation.push({ role: 'assistant', content: response.content });

            // Check stop reason
            if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') {
                const text = response.content
                    .filter((c) => c.type === 'text')
                    .map((c) => c.text)
                    .join('\n');
                return res.json({
                    message: text,
                    iterations,
                    conversation,
                });
            }

            // Execute tool calls
            const toolUses = response.content.filter((c) => c.type === 'tool_use');
            if (toolUses.length === 0) {
                // No tools and not end_turn - return what we have
                const text = response.content
                    .filter((c) => c.type === 'text')
                    .map((c) => c.text)
                    .join('\n');
                return res.json({
                    message: text || '(אין תוכן)',
                    iterations,
                    conversation,
                });
            }

            const toolResults = [];
            for (const tu of toolUses) {
                const result = await executeToolCall(tu.name, tu.input);
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: tu.id,
                    content: JSON.stringify(result).slice(0, 50000), // safety limit
                });
            }
            conversation.push({ role: 'user', content: toolResults });
        }

        return res.json({
            message: '(הסוכן הגיע למקסימום שלבים - נסה לחלק את הבקשה למשימות קטנות יותר)',
            iterations,
            conversation,
        });
    } catch (err) {
        console.error('Chat error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ----- Health -----
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        version: '1.0.0',
        google_connected: !!loadTokens(),
        anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
    });
});

// ----- 404 / Fallback to index.html for SPA-like behavior -----
app.use((req, res) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        const indexPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    res.status(404).json({ error: 'Not found' });
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Portal Champions backend running on port ${PORT}`);
    console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'}`);
    console.log(`   Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'}`);
    console.log(`   Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌'}`);
    console.log(`   Drive tokens: ${loadTokens() ? '✅' : '⚠️  not connected yet'}`);
    console.log(`   Redirect URI: ${GOOGLE_REDIRECT_URI}\n`);
});
