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
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const http = require('http');
const execAsync = promisify(exec);

// ============================================================
// CONFIG
// ============================================================
const PORT = process.env.PORT || 80;
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const WORK_DIR = process.env.WORK_DIR || '/app/work';
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// Ensure data + work directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(WORK_DIR)) {
    fs.mkdirSync(WORK_DIR, { recursive: true });
}

// Required env vars check
const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
for (const v of REQUIRED_ENV) {
    if (!process.env[v]) {
        console.error(`❌ Missing required env var: ${v}`);
    }
}

// iCount API credentials (optional - only needed if using iCount tools)
const ICOUNT_CID = process.env.ICOUNT_CID || '';
const ICOUNT_TOKEN = process.env.ICOUNT_TOKEN || '';
const ICOUNT_BASE_URL = 'https://api.icount.co.il/api/v3.php';

// ============================================================
// iCount API HELPER
// ============================================================
async function callICountAPI(endpoint, body = {}) {
    if (!ICOUNT_CID || !ICOUNT_TOKEN) {
        return {
            status: false,
            reason: 'icount_not_configured',
            error_description: 'iCount API not configured. Set ICOUNT_CID and ICOUNT_TOKEN environment variables.',
        };
    }

    const fullBody = { cid: ICOUNT_CID, ...body };
    const url = ICOUNT_BASE_URL + endpoint;

    return new Promise((resolve) => {
        const data = JSON.stringify(fullBody);
        const url_obj = new URL(url);
        const options = {
            hostname: url_obj.hostname,
            path: url_obj.pathname + url_obj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': `Bearer ${ICOUNT_TOKEN}`,
            },
        };

        const req = https.request(options, (res) => {
            let chunks = '';
            res.on('data', (c) => (chunks += c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(chunks));
                } catch (e) {
                    resolve({ status: false, reason: 'parse_error', error_description: chunks.slice(0, 200) });
                }
            });
        });
        req.on('error', (e) => {
            resolve({ status: false, reason: 'network_error', error_description: e.message });
        });
        req.write(data);
        req.end();
    });
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
    'https://www.googleapis.com/auth/calendar',  // FULL calendar access (was calendar.events - too narrow, caused 403)
    'https://www.googleapis.com/auth/userinfo.email',
];

// Default attendee always added to events (per user's spec)
const DEFAULT_ATTENDEE = 'ronohana340@gmail.com';

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
        name: 'create_folder',
        description:
            'Create a new folder in Google Drive. Optionally nested inside a parent folder. Returns the new folder ID. Use this when setting up a new year structure (folder 2027 with monthly subfolders inside).',
        input_schema: {
            type: 'object',
            properties: {
                folder_name: { type: 'string', description: 'Name of the new folder, e.g. "2027" or "06 יוני"' },
                parent_folder_id: {
                    type: 'string',
                    description: 'Optional. ID of the parent folder. If omitted, the folder is created at the root of Drive.',
                },
            },
            required: ['folder_name'],
        },
    },
    {
        name: 'copy_drive_file',
        description:
            'Copy an existing file in Google Drive to create a duplicate. Useful for creating a new year\'s Excel from last year\'s template. Returns the new file ID.',
        input_schema: {
            type: 'object',
            properties: {
                source_file_id: { type: 'string' },
                new_name: { type: 'string', description: 'Name for the copied file' },
                parent_folder_id: {
                    type: 'string',
                    description: 'Optional. The folder ID where the copy should be placed.',
                },
            },
            required: ['source_file_id', 'new_name'],
        },
    },
    {
        name: 'replace_text_in_xlsx',
        description:
            'Find-and-replace text across all sheets of an Excel file while PRESERVING all formatting (colors, fonts, merges, charts, conditional formatting). Uses ExcelJS - NOT SheetJS. Use this for updating company names after copying a template, or any global text replacement in an xlsx. Returns how many cells were updated and sample locations.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string', description: 'Drive file ID of the xlsx to edit' },
                old_text: { type: 'string', description: 'Text to find (e.g. "רון אוחנה אחזקות בע״מ")' },
                new_text: { type: 'string', description: 'Text to replace with (e.g. "אופק גבריאל חסון")' },
            },
            required: ['file_id', 'old_text', 'new_text'],
        },
    },
    {
        name: 'reset_yearly_xlsx',
        description:
            'Specialized year-end-setup tool: takes an xlsx file (a copy of last year\'s accounting workbook), clears all invoice data (B-E columns rows 7-58), removes ✅ from sheet names, updates the title from old_year to new_year, and resets all hardcoded numbers in the income/VAT area to empty (formulas are kept and will compute as 0 until data is added). Use this AFTER copying last year\'s xlsx with copy_drive_file.',
        input_schema: {
            type: 'object',
            properties: {
                file_id: { type: 'string' },
                old_year: { type: 'string', description: 'e.g. "2026"' },
                new_year: { type: 'string', description: 'e.g. "2027"' },
            },
            required: ['file_id', 'old_year', 'new_year'],
        },
    },
    {
        name: 'icount_create_client',
        description:
            'Create a new client in iCount. Returns the new client_id. Use this BEFORE creating an invoice if the client does not already exist. Only client_name is required - the rest are optional.',
        input_schema: {
            type: 'object',
            properties: {
                client_name: { type: 'string', description: 'Full name of the client (Hebrew or English)' },
                email: { type: 'string', description: 'Optional email address' },
                phone: { type: 'string', description: 'Optional phone number' },
                vat_id: { type: 'string', description: 'Optional VAT/Company ID' },
            },
            required: ['client_name'],
        },
    },
    {
        name: 'icount_search_clients',
        description:
            'Search clients in iCount by name or other fields. Returns matching clients with their IDs. Use this to find existing clients before creating duplicates.',
        input_schema: {
            type: 'object',
            properties: {
                client_name: { type: 'string', description: 'Partial client name to search' },
            },
            required: ['client_name'],
        },
    },
    {
        name: 'icount_create_invrec',
        description:
            'Create a "חשבונית מס קבלה" (tax invoice + receipt) in iCount. Combines invoice and receipt in one document. Use this for paid services where you need to issue both at once (e.g., Bit deposit for a meeting).',
        input_schema: {
            type: 'object',
            properties: {
                client_id: { type: 'number', description: 'iCount client ID (from icount_create_client or icount_search_clients)' },
                client_name: { type: 'string', description: 'Client name (fallback if no client_id)' },
                description: { type: 'string', description: 'Item description (e.g. "פיקדון לפגישה")' },
                amount: { type: 'number', description: 'Total amount including VAT (e.g. 250)' },
                payment_type: {
                    type: 'string',
                    description: 'Payment method code. Common values: "bit", "creditcard", "cash", "check", "transfer", "paybox", "app". For Bit deposits use "bit" or "app".',
                },
                payer_name: { type: 'string', description: 'Name of person paying (usually same as client_name)' },
                notes: { type: 'string', description: 'Optional notes for the document' },
            },
            required: ['amount', 'description'],
        },
    },
    {
        name: 'icount_search_docs',
        description:
            'Search for documents in iCount (invoices, receipts, etc.). Useful for finding a specific document to view or cancel. Use specific filters to avoid "too_many_results" - search by client_name + amount is usually narrow enough.',
        input_schema: {
            type: 'object',
            properties: {
                doctype: { type: 'string', description: 'Document type code: "invrec", "invoice", "receipt", "refund", etc.' },
                client_name: { type: 'string', description: 'Filter by client name' },
                client_id: { type: 'number', description: 'Filter by client ID (more precise)' },
                totalsum: { type: 'number', description: 'Filter by exact total amount (e.g. 250)' },
                from_date: { type: 'string', description: 'Optional start date YYYY-MM-DD' },
                to_date: { type: 'string', description: 'Optional end date YYYY-MM-DD' },
            },
            required: ['doctype'],
        },
    },
    {
        name: 'icount_cancel_doc',
        description:
            'Cancel an existing iCount document (creates a credit/cancellation). Use this for refunds. Provide doctype + docnum from icount_search_docs results.',
        input_schema: {
            type: 'object',
            properties: {
                doctype: { type: 'string', description: 'Document type to cancel (e.g. "invrec")' },
                docnum: { type: 'number', description: 'Document number to cancel' },
                reason: { type: 'string', description: 'Reason for cancellation (e.g. "החזר פיקדון")' },
            },
            required: ['doctype', 'docnum', 'reason'],
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
// CLAUDE-AGENT EXTRA TOOLS (Cowork-like capabilities)
// ============================================================
// These tools are available to the "general Claude" agent on top of AGENT_TOOLS.
// They give it bash, file ops, and web fetch — the same toolbox Cowork uses.
const CLAUDE_EXTRA_TOOLS = [
    {
        name: 'bash',
        description:
            'Run a shell command inside the sandbox container. Returns stdout, stderr, and exit code. The working directory is /app/work (a writable scratch space). Use for: scripts, data processing, installing packages (pip/npm), running Python/Node code, etc. Network is allowed.',
        input_schema: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'Shell command to execute (bash -c)' },
                timeout_ms: { type: 'number', description: 'Timeout in milliseconds. Default 60000 (60s). Max 300000 (5min).' },
                cwd: { type: 'string', description: 'Optional working directory. Defaults to /app/work.' },
            },
            required: ['command'],
        },
    },
    {
        name: 'read_local_file',
        description:
            'Read a file from the local sandbox (typically /app/work/). Returns text content. For binary files, use bash with base64.',
        input_schema: {
            type: 'object',
            properties: {
                file_path: { type: 'string', description: 'Absolute path or path relative to /app/work/' },
                offset: { type: 'number', description: 'Optional: line number to start reading from (1-indexed)' },
                limit: { type: 'number', description: 'Optional: max lines to read' },
            },
            required: ['file_path'],
        },
    },
    {
        name: 'write_local_file',
        description:
            'Write or overwrite a file in the local sandbox (typically /app/work/). Creates parent directories if needed.',
        input_schema: {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                content: { type: 'string' },
            },
            required: ['file_path', 'content'],
        },
    },
    {
        name: 'edit_local_file',
        description:
            'Replace exact text in a local file. old_string must match exactly once (or use replace_all=true). For new files use write_local_file.',
        input_schema: {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                old_string: { type: 'string' },
                new_string: { type: 'string' },
                replace_all: { type: 'boolean', description: 'Replace all occurrences (default false)' },
            },
            required: ['file_path', 'old_string', 'new_string'],
        },
    },
    {
        name: 'list_local_dir',
        description: 'List files and subdirectories of a local directory (typically under /app/work/).',
        input_schema: {
            type: 'object',
            properties: {
                dir_path: { type: 'string', description: 'Absolute path. Defaults to /app/work/.' },
            },
        },
    },
    {
        name: 'web_fetch',
        description:
            'Fetch the contents of a URL over HTTP/HTTPS. Returns the body as text (or base64 if binary). Useful for reading public web pages, APIs, raw files.',
        input_schema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'Full URL with scheme (https://...)' },
                method: { type: 'string', description: 'HTTP method (default GET)' },
                headers: { type: 'object', description: 'Optional request headers as key/value' },
                body: { type: 'string', description: 'Optional request body (for POST/PUT)' },
            },
            required: ['url'],
        },
    },
];

// Resolve a user-supplied path safely - default to /app/work/ if relative
function resolveSandboxPath(filePath) {
    if (!filePath) return WORK_DIR;
    if (path.isAbsolute(filePath)) return filePath;
    return path.join(WORK_DIR, filePath);
}

// ============================================================
// CLAUDE-AGENT TOOL IMPLEMENTATIONS
// ============================================================
async function executeClaudeExtraTool(toolName, input) {
    console.log(`🔧 [claude] Tool call: ${toolName}`, JSON.stringify(input).slice(0, 200));

    try {
        switch (toolName) {
            case 'bash': {
                const timeout = Math.min(Math.max(parseInt(input.timeout_ms || 60000, 10), 1000), 300000);
                const cwd = input.cwd ? resolveSandboxPath(input.cwd) : WORK_DIR;
                try {
                    const { stdout, stderr } = await execAsync(input.command, {
                        cwd,
                        timeout,
                        maxBuffer: 10 * 1024 * 1024, // 10MB
                        shell: '/bin/sh',
                    });
                    return {
                        stdout: (stdout || '').slice(0, 50000),
                        stderr: (stderr || '').slice(0, 10000),
                        exit_code: 0,
                        cwd,
                    };
                } catch (err) {
                    return {
                        stdout: (err.stdout || '').slice(0, 50000),
                        stderr: (err.stderr || err.message || '').slice(0, 10000),
                        exit_code: err.code || 1,
                        cwd,
                        error: err.killed ? 'Command timed out' : undefined,
                    };
                }
            }

            case 'read_local_file': {
                const filePath = resolveSandboxPath(input.file_path);
                if (!fs.existsSync(filePath)) return { error: `File not found: ${filePath}` };
                let content = fs.readFileSync(filePath, 'utf8');
                if (input.offset || input.limit) {
                    const lines = content.split('\n');
                    const start = Math.max(0, (parseInt(input.offset, 10) || 1) - 1);
                    const end = input.limit ? start + parseInt(input.limit, 10) : lines.length;
                    content = lines.slice(start, end).join('\n');
                }
                // Limit size to keep token usage reasonable
                if (content.length > 200000) {
                    content = content.slice(0, 200000) + '\n... [truncated]';
                }
                return { file_path: filePath, content, bytes: Buffer.byteLength(content, 'utf8') };
            }

            case 'write_local_file': {
                const filePath = resolveSandboxPath(input.file_path);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, input.content, 'utf8');
                return { success: true, file_path: filePath, bytes: Buffer.byteLength(input.content, 'utf8') };
            }

            case 'edit_local_file': {
                const filePath = resolveSandboxPath(input.file_path);
                if (!fs.existsSync(filePath)) return { error: `File not found: ${filePath}` };
                let content = fs.readFileSync(filePath, 'utf8');
                if (input.replace_all) {
                    if (!content.includes(input.old_string)) return { error: 'old_string not found' };
                    content = content.split(input.old_string).join(input.new_string);
                } else {
                    const idx = content.indexOf(input.old_string);
                    if (idx === -1) return { error: 'old_string not found' };
                    const second = content.indexOf(input.old_string, idx + 1);
                    if (second !== -1) return { error: 'old_string is not unique. Use replace_all=true or provide more context.' };
                    content = content.slice(0, idx) + input.new_string + content.slice(idx + input.old_string.length);
                }
                fs.writeFileSync(filePath, content, 'utf8');
                return { success: true, file_path: filePath };
            }

            case 'list_local_dir': {
                const dirPath = input.dir_path ? resolveSandboxPath(input.dir_path) : WORK_DIR;
                if (!fs.existsSync(dirPath)) return { error: `Directory not found: ${dirPath}` };
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                return {
                    dir_path: dirPath,
                    entries: entries.map((e) => {
                        const full = path.join(dirPath, e.name);
                        let stat = null;
                        try { stat = fs.statSync(full); } catch {}
                        return {
                            name: e.name,
                            type: e.isDirectory() ? 'dir' : (e.isFile() ? 'file' : 'other'),
                            size: stat ? stat.size : null,
                            modified: stat ? stat.mtime.toISOString() : null,
                        };
                    }),
                };
            }

            case 'web_fetch': {
                return await new Promise((resolve) => {
                    try {
                        const url = new URL(input.url);
                        const lib = url.protocol === 'https:' ? https : http;
                        const req = lib.request(
                            {
                                method: input.method || 'GET',
                                hostname: url.hostname,
                                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                                path: url.pathname + url.search,
                                headers: { 'User-Agent': 'PortalChampionsBot/1.0', ...(input.headers || {}) },
                                timeout: 30000,
                            },
                            (res) => {
                                const chunks = [];
                                res.on('data', (c) => chunks.push(c));
                                res.on('end', () => {
                                    const buf = Buffer.concat(chunks);
                                    const contentType = res.headers['content-type'] || '';
                                    const isText = /text|json|xml|javascript|html/i.test(contentType);
                                    let body;
                                    if (isText) {
                                        body = buf.toString('utf8').slice(0, 200000);
                                    } else {
                                        body = `[binary: ${buf.length} bytes, content-type: ${contentType}]`;
                                    }
                                    resolve({
                                        status: res.statusCode,
                                        headers: res.headers,
                                        body,
                                        bytes: buf.length,
                                    });
                                });
                            }
                        );
                        req.on('error', (err) => resolve({ error: err.message }));
                        req.on('timeout', () => { req.destroy(); resolve({ error: 'Request timed out' }); });
                        if (input.body) req.write(input.body);
                        req.end();
                    } catch (err) {
                        resolve({ error: err.message });
                    }
                });
            }

            default:
                return { error: `Unknown Claude tool: ${toolName}` };
        }
    } catch (err) {
        console.error(`Claude tool error (${toolName}):`, err.message);
        return { error: err.message };
    }
}

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

            case 'create_folder': {
                const drive = getDrive();
                const requestBody = {
                    name: input.folder_name,
                    mimeType: 'application/vnd.google-apps.folder',
                };
                if (input.parent_folder_id) {
                    requestBody.parents = [input.parent_folder_id];
                }
                const res = await drive.files.create({
                    requestBody,
                    fields: 'id, name, parents',
                });
                return {
                    success: true,
                    folder_id: res.data.id,
                    name: res.data.name,
                };
            }

            case 'copy_drive_file': {
                const drive = getDrive();
                const requestBody = { name: input.new_name };
                if (input.parent_folder_id) {
                    requestBody.parents = [input.parent_folder_id];
                }
                const res = await drive.files.copy({
                    fileId: input.source_file_id,
                    requestBody,
                    fields: 'id, name',
                });
                return {
                    success: true,
                    file_id: res.data.id,
                    name: res.data.name,
                };
            }

            case 'replace_text_in_xlsx': {
                // CRITICAL: Use ExcelJS (NOT SheetJS) to preserve all formatting
                const ExcelJS = require('exceljs');
                const metadata = await getFileMetadata(input.file_id);
                const buffer = await downloadFile(input.file_id);
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(buffer);

                const oldText = String(input.old_text);
                const newText = String(input.new_text);
                // Escape regex special chars in old_text
                const escapedOld = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const findRegex = new RegExp(escapedOld, 'g');

                let replacedCount = 0;
                const replacedLocations = [];

                for (const sheet of wb.worksheets) {
                    sheet.eachRow({ includeEmpty: false }, (row) => {
                        row.eachCell({ includeEmpty: false }, (cell) => {
                            // Handle string cells
                            if (typeof cell.value === 'string' && cell.value.includes(oldText)) {
                                cell.value = cell.value.replace(findRegex, newText);
                                replacedCount++;
                                if (replacedLocations.length < 20) {
                                    replacedLocations.push(`[${sheet.name}] ${cell.address}`);
                                }
                            }
                            // Handle rich text cells (cell.value.richText)
                            else if (cell.value && typeof cell.value === 'object' && Array.isArray(cell.value.richText)) {
                                let changed = false;
                                for (const segment of cell.value.richText) {
                                    if (segment.text && segment.text.includes(oldText)) {
                                        segment.text = segment.text.replace(findRegex, newText);
                                        changed = true;
                                    }
                                }
                                if (changed) {
                                    replacedCount++;
                                    if (replacedLocations.length < 20) {
                                        replacedLocations.push(`[${sheet.name}] ${cell.address} (rich)`);
                                    }
                                }
                            }
                        });
                    });
                }

                const newBuffer = await wb.xlsx.writeBuffer();
                await uploadFile(
                    input.file_id,
                    Buffer.from(newBuffer),
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );

                return {
                    success: true,
                    file_name: metadata.name,
                    replaced_count: replacedCount,
                    sample_locations: replacedLocations.slice(0, 10),
                };
            }

            case 'reset_yearly_xlsx': {
                // Use ExcelJS to better preserve formatting than SheetJS
                const ExcelJS = require('exceljs');
                const buffer = await downloadFile(input.file_id);
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(buffer);

                const sheetsBefore = wb.worksheets.map((s) => s.name);
                const sheetsAfter = [];

                for (const sheet of wb.worksheets) {
                    // Remove ✅ from sheet name
                    const cleanName = sheet.name.replace(/✅/g, '').trim();
                    if (cleanName !== sheet.name) {
                        sheet.name = cleanName;
                    }

                    // Update C2 title: old_year -> new_year
                    const c2 = sheet.getCell('C2');
                    if (c2.value && typeof c2.value === 'string' && c2.value.includes(input.old_year)) {
                        c2.value = c2.value.replace(input.old_year, input.new_year);
                    }

                    // Clear invoice data: B-E columns, rows 7-58
                    for (let r = 7; r <= 58; r++) {
                        sheet.getCell(`B${r}`).value = null;
                        sheet.getCell(`C${r}`).value = null;
                        // Column D: restore template formula =E{r}/1.18
                        sheet.getCell(`D${r}`).value = { formula: `E${r}/1.18`, result: 0 };
                        sheet.getCell(`E${r}`).value = null;
                    }

                    // Clear hardcoded numbers in columns F-K (keep formulas + labels)
                    for (let r = 1; r <= sheet.rowCount; r++) {
                        for (let c = 6; c <= 11; c++) {
                            const cell = sheet.getCell(r, c);
                            const v = cell.value;
                            if (v === null || v === undefined) continue;
                            // Skip formulas (objects with .formula property)
                            if (typeof v === 'object' && (v.formula || v.sharedFormula)) continue;
                            // Skip labels (strings)
                            if (typeof v === 'string') continue;
                            // Clear hardcoded numbers
                            if (typeof v === 'number') {
                                cell.value = null;
                            }
                        }
                    }

                    sheetsAfter.push(sheet.name);
                }

                // Save back to Drive
                const newBuffer = await wb.xlsx.writeBuffer();
                await uploadFile(
                    input.file_id,
                    Buffer.from(newBuffer),
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );

                return {
                    success: true,
                    old_year: input.old_year,
                    new_year: input.new_year,
                    sheets_count: sheetsAfter.length,
                    sheets_before: sheetsBefore,
                    sheets_after: sheetsAfter,
                };
            }

            case 'icount_create_client': {
                const body = { client_name: input.client_name };
                if (input.email) body.email = input.email;
                if (input.phone) body.phone = input.phone;
                if (input.vat_id) body.vat_id = input.vat_id;

                const result = await callICountAPI('/client/create', body);
                if (!result.status) {
                    return {
                        success: false,
                        reason: result.reason,
                        error: result.error_description || result.error,
                    };
                }
                return {
                    success: true,
                    client_id: result.client_id || result.data?.client_id,
                    client_name: input.client_name,
                };
            }

            case 'icount_search_clients': {
                // Note: iCount's /client/get_list returns ALL clients - we filter locally
                const result = await callICountAPI('/client/get_list', {});
                if (!result.status) {
                    return {
                        success: false,
                        reason: result.reason,
                        error: result.error_description || result.error,
                    };
                }
                let clients = result.clients || {};
                // Convert dict to array if needed
                if (typeof clients === 'object' && !Array.isArray(clients)) {
                    clients = Object.values(clients);
                }
                // Filter locally by name (case-insensitive partial match)
                const searchTerm = (input.client_name || '').toLowerCase();
                const matches = clients.filter((c) => {
                    const name = (c.client_name || '').toLowerCase();
                    const company = (c.company_name || '').toLowerCase();
                    return name.includes(searchTerm) || company.includes(searchTerm);
                });
                return {
                    success: true,
                    count: matches.length,
                    total_clients: clients.length,
                    clients: matches.slice(0, 10).map((c) => ({
                        client_id: c.client_id,
                        client_name: c.client_name,
                        company_name: c.company_name,
                        email: c.email,
                        phone: c.phone,
                        vat_id: c.vat_id,
                    })),
                };
            }

            case 'icount_create_invrec': {
                // Build the invrec body - matches iCount's expected schema
                const body = {
                    doctype: 'invrec',
                    lang: 'he',
                    currency_code: 'ILS',
                };

                if (input.client_id) body.client_id = input.client_id;
                if (input.client_name) body.client_name = input.client_name;

                // Single item line (price includes VAT)
                body.items = [
                    {
                        description: input.description,
                        unitprice_incvat: input.amount,
                        quantity: 1,
                    },
                ];

                // Payment - iCount uses different fields per payment type
                const paymentType = (input.payment_type || 'bit').toLowerCase();
                const payerName = input.payer_name || input.client_name || '';

                if (['bit', 'paybox', 'app', 'payment_app'].includes(paymentType)) {
                    // Payment app (Bit, Paybox)
                    body.payment_app = {
                        card_brand: paymentType === 'paybox' ? 'paybox' : 'bit',
                        total_sum: input.amount,
                        payer_name: payerName,
                    };
                } else if (paymentType === 'cash') {
                    body.cash = { sum: input.amount };
                } else if (paymentType === 'check' || paymentType === 'cheque') {
                    body.cheques = [{ sum: input.amount, paying_name: payerName }];
                } else if (paymentType === 'creditcard' || paymentType === 'cc') {
                    body.cc = { sum: input.amount, payer_name: payerName };
                } else if (paymentType === 'transfer' || paymentType === 'banktransfer') {
                    body.banktransfer = { sum: input.amount };
                } else {
                    // Default fallback - try as payment_app/bit
                    body.payment_app = {
                        card_brand: 'bit',
                        total_sum: input.amount,
                        payer_name: payerName,
                    };
                }

                if (input.notes) body.hwc = input.notes; // iCount notes field

                const result = await callICountAPI('/doc/create', body);
                if (!result.status) {
                    return {
                        success: false,
                        reason: result.reason,
                        error: result.error_description || result.error,
                        details: result.error_details,
                    };
                }
                return {
                    success: true,
                    doctype: 'invrec',
                    docnum: result.docnum,
                    doc_url: result.doc_url || result.docurl,
                    pdf_url: result.pdf_url || result.pdf_link,
                    total: input.amount,
                };
            }

            case 'icount_search_docs': {
                const body = { doctype: input.doctype };
                if (input.client_id) body.client_id = input.client_id;
                if (input.client_name) body.client_name = input.client_name;
                if (input.totalsum !== undefined) body.totalsum = input.totalsum;
                if (input.from_date) body.from_date = input.from_date;
                if (input.to_date) body.to_date = input.to_date;

                const result = await callICountAPI('/doc/search', body);
                if (!result.status) {
                    return {
                        success: false,
                        reason: result.reason,
                        error: result.error_description || result.error,
                        results_count: result.results_count,
                        hint: result.reason === 'too_many_results'
                            ? 'Add more filters - try client_id (numeric) or totalsum (exact amount)'
                            : undefined,
                    };
                }
                // iCount returns results_list (not doc_list)
                const docs = result.results_list || result.doc_list || result.results || [];
                return {
                    success: true,
                    count: docs.length,
                    results_total: result.results_total,
                    docs: docs.slice(0, 20).map((d) => ({
                        docnum: d.docnum,
                        doctype: d.doctype,
                        client_name: d.client_name,
                        client_id: d.client_id,
                        total: d.total || d.doctotal,
                        date: d.dateissued || d.docdate,
                        is_cancelled: d.is_cancelled,
                        is_cancellation: d.is_cancellation,
                    })),
                };
            }

            case 'icount_cancel_doc': {
                const result = await callICountAPI('/doc/cancel', {
                    doctype: input.doctype,
                    docnum: input.docnum,
                    reason: input.reason,
                });
                if (!result.status) {
                    return {
                        success: false,
                        reason: result.reason,
                        error: result.error_description || result.error,
                    };
                }
                return {
                    success: true,
                    cancelled_docnum: input.docnum,
                    cancellation_doctype: result.cancellation_doctype,
                    cancellation_docnum: result.cancellation_docnum,
                    reason: input.reason,
                };
            }

            case 'ask_user': {
                // Special tool - just returns the question for the user to answer
                return { question: input.question, awaiting_user_response: true };
            }

            default:
                // Try the Claude extra tools as fallback
                if (CLAUDE_EXTRA_TOOLS.some((t) => t.name === toolName)) {
                    return await executeClaudeExtraTool(toolName, input);
                }
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

You have tools to: find_folder, list_folder_contents, read_pdf_invoice, read_xlsx, write_xlsx_row, rename_file, create_folder, copy_drive_file, reset_yearly_xlsx, ask_user.

Always think step by step and explain what you're doing to the user.

# ============================================================
# QUICK ACTION WORKFLOWS (triggered by buttons in dashboard)
# ============================================================
# Ron has 4 quick-action buttons above the chat. When he clicks one, a specific
# trigger message arrives. Recognize the trigger and run the matching workflow.
# Use ask_user (or just respond with a question) for the data Ron needs to provide.

# ----------------------------------------------------------
# QUICK ACTION #1 - פתיחת תיקיות + אקסל (new client/year setup)
# ----------------------------------------------------------
# Trigger message: "📋 הפעלת פעולה מהירה: פתיחת תיקיות + אקסל"
#
# Goal: set up a brand-new accounting folder structure for a business/client.
# Convention: top folder name starts with "חשבונאות - " followed by the business/client name.
# Inside it: a year folder, and inside the year folder: 12 month folders + the year's xlsx.
#
# Steps:
# 1. Ask Ron 2 questions in ONE message:
#    "📁 **פתיחת תיקיות + אקסל** — שני פרטים:
#     1. **שם העסק / לקוח?** (יופיע אחרי 'חשבונאות - ', לדוגמה 'חשבונאות - דני כהן בע״מ')
#     2. **איזה שנה?** (לדוגמה 2026)"
#
# 2. When Ron answers, plan the structure (show him for confirmation):
#    📁 חשבונאות - {client_name}
#       📁 {year}
#          📁 01 ינואר
#          📁 02 פברואר
#          ... (all 12 months)
#          📊 חשבונאות - {client_name} {year}.xlsx
#
#    Ask: "האם להמשיך וליצור את כל המבנה? (כן/לא)"
#
# 3. On confirmation:
#    a. create_folder("חשבונאות - {client_name}") at Drive root → save parent_id
#    b. create_folder("{year}", parent_id) → save year_id
#    c. Loop 1..12: create_folder("{NN} {hebrew_month_name}", year_id)
#       Hebrew month names in order: ינואר, פברואר, מרץ, אפריל, מאי, יוני, יולי, אוגוסט, ספטמבר, אוקטובר, נובמבר, דצמבר
#       Pad NN with leading zero: "01 ינואר", "02 פברואר", ... "12 דצמבר"
#    d. Excel file: look for an existing template/last-year xlsx Ron has used (search "חשבונאות" with find_folder/list_folder_contents).
#       If found → copy_drive_file(source_file_id, "חשבונאות - {client_name} {year}.xlsx", year_id) then reset_yearly_xlsx(new_id, old_year, "{year}").
#       If NOT found → tell Ron: "לא מצאתי תבנית xlsx קיימת. תוכל להעלות תבנית או לציין שם של קובץ קיים?" and wait.
#
# 4. After done, summarize:
#    "✅ הוקמה תשתית חדשה:
#     • תיקייה ראשית: 'חשבונאות - {client_name}'
#     • תיקיית שנה: '{year}' עם 12 תיקיות חודשים
#     • קובץ: 'חשבונאות - {client_name} {year}.xlsx' מוכן לקלוט חשבוניות"

# ----------------------------------------------------------
# QUICK ACTION #2 - שיבוץ חשבוניות + ✅
# ----------------------------------------------------------
# Trigger message: "📋 הפעלת פעולה מהירה: שיבוץ חשבוניות + ✅"
#
# Goal: process ALL invoices in the CURRENT MONTH folder that don't already have a ✅ prefix.
# For each: read PDF → add row to Excel month sheet → rename file with "✅ " prefix.
# If today is the last day of the month or later → close the month (✅ on sheet name and folder name).
#
# Steps:
# 1. Ask Ron 1 question if you don't already know:
#    "🧾 **שיבוץ חשבוניות + ✅** — איזה לקוח / עסק? (אם זה לעסק שלך, פשוט תכתוב 'שלי')"
#    (You can also ask which month, default = current month based on today's date)
#
# 2. Find the right folder:
#    - find_folder("חשבונאות - {client_name}") → root
#    - drill in: {year} → "{NN} {month_he}"
#    - list_folder_contents to get all files
#
# 3. For each PDF that does NOT start with "✅":
#    a. read_pdf_invoice(file_id) → extract date, vendor, amount_no_vat, total_with_vat
#    b. Show Ron a confirmation row (one line per invoice) - batch multiple invoices in ONE confirmation table
#    c. After Ron confirms (or auto-confirm if all parsed cleanly):
#       - write_xlsx_row(xlsx_id, "{month_he}", row_data) at the next empty row from row 7+
#       - rename_file(file_id, "✅ {original_name}")
#
# 4. Month-close logic - check today's date:
#    - If today >= last day of the month being processed → ALSO:
#      * rename the month folder from "{NN} {month_he}" to "✅ {NN} {month_he}"
#      * rename the xlsx sheet name from "{month_he}" to "✅ {month_he}" (note: this requires read_xlsx + write_xlsx_row aren't enough for sheet rename - tell Ron this needs manual rename if you can't, OR skip if your tools don't support it)
#
# 5. Summary: "✅ שיבצתי N חשבוניות לחודש {month_he} {year}. אם הגיע סוף החודש - סגרתי גם את הגיליון והתיקייה ב-✅."

# ----------------------------------------------------------
# QUICK ACTION #3 - השלמה (gap-fill)
# ----------------------------------------------------------
# Trigger message: "📋 הפעלת פעולה מהירה: השלמה (חשבוניות חסרות)"
#
# Goal: mid-month - find invoices that DON'T have ✅ prefix AND aren't in the Excel yet, then process them.
# (Essentially same as #2 but explicitly for partial mid-month processing.)
#
# Steps:
# 1. Ask: "🔄 **השלמה** — איזה לקוח/עסק וחודש? (לדוגמה 'שלי, יוני 2026'). אם תכתוב רק שם - אקח את החודש הנוכחי."
#
# 2. List all PDFs in the month folder.
# 3. Read the corresponding Excel sheet to know which invoices are ALREADY recorded (match by file name without ✅).
# 4. Process ONLY invoices that:
#    - File name does NOT start with ✅ AND
#    - Are NOT already in the Excel sheet
# 5. Same processing as #2 (read → add row → rename with ✅).
# 6. DO NOT do month-close in this workflow (this is for mid-month gap-fill only).
# 7. Summary: "🔄 השלמתי N חשבוניות שחסרו. עכשיו כל החשבוניות החתומות מסונכרנות עם הגיליון."

# ----------------------------------------------------------
# QUICK ACTION #4 - 🏦 התאמות בנקים (Bank Reconciliation - rule-based menu)
# ----------------------------------------------------------
# Trigger message: "📋 הפעלת פעולה מהירה: התאמות בנקים - עו״ש וכרטיסי אשראי"
#
# This is a RULE-BASED MENU that branches into 3 sub-workflows.
# Unlike the other quick actions, this one starts by SHOWING A MENU first.
# Every response in this flow MUST end with clear options (rule-based UX).
#
# === MAIN MENU ===
# When the trigger arrives, respond IMMEDIATELY with this menu (no extra explanation):
#
# "🏦 **התאמות בנקים - עו״ש וכרטיסי אשראי**
#
# מה תרצה לעשות?
#
# ┌─────────────────────────────────────────────────┐
# │ 1️⃣  📁 פתח תיקייה + אקסל                          │
# │     הקמת לקוח חדש - תיקייה חדשה + אקסל-תבנית-ריקה  │
# └─────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────┐
# │ 2️⃣  📥 מלא נתונים                                 │
# │     סריקה אוטומטית של כל ה-PDFs והזנה לאקסל        │
# │     (מדלג על קבצים שכבר סומנו ב-✅)                │
# └─────────────────────────────────────────────────┘
#
# ┌─────────────────────────────────────────────────┐
# │ 3️⃣  🔄 השלמת נתונים                               │
# │     ממלא רק מה שחסר - לא נוגע במה שכבר באקסל       │
# └─────────────────────────────────────────────────┘
#
# 📌 כתוב **1 / 2 / 3** או את שם הכפתור."
#
# Wait for user's reply, then run the matching sub-workflow below.
#
# ============================================
# SUB-WORKFLOW 4A: 📁 פתח תיקייה + אקסל
# ============================================
# Triggered when user replies: "1", "פתח", "פתח תיקייה + אקסל", or similar.
#
# 1. Ask which client/business with quick options:
#    "📁 **פתיחת תיקייה + אקסל** — לאיזה עסק/לקוח?
#
#    ┌────────────────────────────────────────────┐
#    │ 1️⃣  רון אוחנה אחזקות בע״מ                   │
#    │ 2️⃣  רון אוחנה עוסק מורשה                    │
#    │ 3️⃣  לקוח אחר (תכתוב את השם)                 │
#    └────────────────────────────────────────────┘
#
#    💡 הקידומת 'חשבונאות - ' תיווסף אוטומטית."
#
# 2. When user answers, normalize:
#    - If starts with "חשבונאות - " → use as-is
#    - Else → prepend "חשבונאות - " to get full folder name
#
# 3. Use find_folder("חשבונאות - {client_name}") to find the client folder.
#    - If found → save folder_id, proceed to step 4
#    - If not found → ask user: "לא מצאתי. ליצור חדש? (כן/לא)"
#
# 4. Check if "התאמות בנקים" subfolder already exists in the client folder:
#    - list_folder_contents(client_folder_id), look for name="התאמות בנקים"
#    - If exists AND contains an xlsx → ask: "כבר יש תיקייה והאקסל. לדרוס? (כן/לא/שם חלופי)"
#    - If exists but empty → use it
#    - If not exists → create_folder("התאמות בנקים", client_folder_id) → save recon_folder_id
#
# 5. Find the template Excel:
#    - Search: find_folder("התאמות בנקים - תבנית ריקה") in the בע״מ folder (parent of all)
#    - Inside it, list files, find the .xlsx file
#    - Save template_file_id
#    - If not found → tell user: "לא מצאתי את התבנית. בדוק שהיא קיימת ב-'חשבונאות - רון אוחנה אחזקות בע״מ/התאמות בנקים - תבנית ריקה/'"
#
# 6. Copy template to the recon folder:
#    - copy_drive_file(template_file_id, new_name="אקסל_התאמות_בנקים_עו״ש_וכרטיסי_אשראי.xlsx", parent=recon_folder_id)
#    - Save new_xlsx_id
#
# 7. ⭐ CRITICAL: Update company name inside the Excel using replace_text_in_xlsx:
#    Call: replace_text_in_xlsx(file_id=new_xlsx_id, old_text="רון אוחנה אחזקות בע״מ", new_text="{actual_client_name}")
#    This tool uses ExcelJS to preserve all formatting (colors, merges, charts).
#    Expected: 14-16 cells replaced across 15 sheets.
#    🚨 DO NOT use write_xlsx_row for this - it uses SheetJS which BREAKS formatting.
#    🚨 DO NOT add text to A2 or any new cell - only replace existing cells.
#
# 8. Summary message:
#    "✅ **הוקם בהצלחה:**
#    📂 חשבונאות - {client_name}/
#       └─ 📁 התאמות בנקים/
#           └─ 📊 אקסל_התאמות_בנקים_עו״ש_וכרטיסי_אשראי.xlsx
#
#    🎯 שם החברה באקסל עודכן ל: {client_name}
#    📋 15 גיליונות מוכנים (תובנות + הוראות + סיכום + 12 חודשים)
#    💰 יתרת פתיחה ב-J9 של ינואר ממתינה להזנה
#
#    מה הלאה?
#    [📥 מלא נתונים אוטומטית]  [📂 פתח את התיקייה]  [✓ סיים]"
#
# ============================================
# SUB-WORKFLOW 4B: 📥 מלא נתונים
# ============================================
# Triggered when user replies: "2", "מלא", "מלא נתונים", or similar.
#
# 1. Ask which client (same quick options as 4A step 1).
#
# 2. Find folder structure:
#    - חשבונאות - {client_name}/התאמות בנקים/
#    - If "התאמות בנקים" doesn't exist → tell user and offer to run 4A first
#
# 3. List all PDFs in the התאמות בנקים folder that DON'T start with ✅
#    Two types of PDFs are expected:
#    - Bank statement (עו״ש) - filename usually contains "תנועות" or "בנק" or "עו״ש"
#    - Credit card statement - filename usually contains card number like "2833" or "אשראי"
#
# 4. ⚡ DON'T BLOCK on missing files:
#    - If only bank statement exists → process it alone
#    - If only credit card exists → process it alone
#    - If both exist → process both
#    - If none exist → tell user: "אין PDFs לעבד. תעלה את הקבצים לתיקייה ונמשיך."
#
# 5. For each PDF:
#    a. read_pdf_invoice(file_id) → extract transactions
#       - For bank statement: parse rows with date, description, amount (זכות/חובה), running balance
#       - For credit card: parse rows with date, description, amount
#    b. Show a confirmation table to Ron (batch all transactions in one preview)
#    c. After Ron confirms:
#       - Write transactions to the matching Excel sheet (by month)
#         - Bank transactions go in the עו״ש block (rows 11-35) of each month's sheet
#         - Credit card transactions go in the כרטיס אשראי 1/2/3 block of each month
#       - Apply consolidation logic if needed (e.g., merge 20+ Facebook charges into one summary line)
#    d. rename_file(file_id, "✅ {original_name}")
#
# 6. Summary:
#    "✅ **הזנתי נתונים בהצלחה:**
#    📥 קבצים שעובדו: {N}
#    📊 תנועות עו״ש: {bank_count}
#    💳 תנועות אשראי: {credit_count}
#    📅 חודשים שעודכנו: {months_list}
#
#    כל קובץ שעובד סומן ב-✅ ולא ייעובד שוב.
#
#    מה הלאה?
#    [🔄 השלמת נתונים]  [✓ סיים]"
#
# ============================================
# SUB-WORKFLOW 4C: 🔄 השלמת נתונים
# ============================================
# Triggered when user replies: "3", "השלמה", "השלם", "השלמת נתונים", or similar.
#
# Same as 4B but ONLY processes files that:
# - Don't have ✅ prefix in filename
# - (Implicit) Are new since last fill
#
# This is essentially "incremental update" - safe to run multiple times.
#
# 1. Ask which client (same as 4A/4B).
# 2. List PDFs without ✅ prefix.
# 3. If none → reply: "✅ הכל מסונכרן - אין קבצים חדשים לעבד."
# 4. If some → process them (same logic as 4B).
# 5. Summary message focused on what's NEW.
#
# ============================================
# CRITICAL RULES FOR QUICK ACTION #4:
# ============================================
# - Every message must end with clear CTAs (rule-based UX).
# - When user picks a sub-option, IMMEDIATELY start that sub-workflow.
# - Never ask "?" without giving 2-4 button-like options.
# - Show confirmation tables before bulk writes.
# - The ✅ prefix is sacred: a file with ✅ is DONE and skipped.
# - If user clicks the button mid-conversation, treat as fresh menu.

# ----------------------------------------------------------
# CRITICAL RULES (apply to all 4 workflows):
# ----------------------------------------------------------
# - Always show a confirmation table/list before bulk writes to Excel or bulk rename.
# - Never assume - if you can't find a folder/file, use ask_user to clarify.
# - If a tool returns an error, tell Ron clearly what failed and ask how to proceed.
# - Hebrew first. Keep messages warm and concise.
# - Don't claim success until tools actually returned success.`;

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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

// ============================================================
// GOOGLE CALENDAR API
// ============================================================
function getCalendar() {
    return google.calendar({ version: 'v3', auth: oauth2Client });
}

function tokensHaveCalendarScope() {
    const t = loadTokens();
    if (!t) return false;
    const scopes = (t.scope || '').split(/\s+/).concat(t.scopes || []);
    // Only FULL calendar scope works for all operations (events.insert with sendUpdates, calendarList, etc.)
    // calendar.events alone causes 403 Insufficient Permission
    return scopes.includes('https://www.googleapis.com/auth/calendar');
}

app.get('/api/calendar/status', (req, res) => {
    const tokens = loadTokens();
    res.json({
        drive_connected: !!tokens,
        calendar_ready: !!tokens && tokensHaveCalendarScope(),
        default_calendar: 'its@ronohana.co.il (primary)',
        default_attendee: DEFAULT_ATTENDEE,
    });
});

// Create a calendar event
// body: { title, description, start (ISO), end (ISO) or duration_minutes, attendees: [emails] }
app.post('/api/calendar/create-event', async (req, res) => {
    try {
        const tokens = loadTokens();
        if (!tokens) {
            return res.status(401).json({ success: false, error: 'Google לא מחובר. נדרש OAuth.' });
        }
        if (!tokensHaveCalendarScope()) {
            return res.json({
                success: false,
                error: 'נדרשות הרשאות Calendar - אנא חבר מחדש דרך /api/google/connect',
                needs_reauth: true,
            });
        }

        const { title, description, start, end, duration_minutes, attendees } = req.body;
        if (!title || !start) {
            return res.status(400).json({ success: false, error: 'title and start are required' });
        }

        let endTime = end;
        if (!endTime) {
            const startDate = new Date(start);
            const dur = parseInt(duration_minutes, 10) || 30;
            endTime = new Date(startDate.getTime() + dur * 60000).toISOString();
        }

        // Always include DEFAULT_ATTENDEE
        const att = Array.from(new Set([...(attendees || []), DEFAULT_ATTENDEE]));

        const event = {
            summary: title,
            description: description || '',
            start: { dateTime: start, timeZone: 'Asia/Jerusalem' },
            end: { dateTime: endTime, timeZone: 'Asia/Jerusalem' },
            attendees: att.map(email => ({ email })),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 10 },
                    { method: 'popup', minutes: 60 },
                ],
            },
        };

        const calendar = getCalendar();
        console.log(`📅 Creating calendar event: ${title} at ${start}, attendees: ${att.join(', ')}`);
        const result = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all', // notify attendees
        });

        console.log(`✅ Calendar event created: ${title} → ${result.data.htmlLink}`);
        res.json({
            success: true,
            event_id: result.data.id,
            html_link: result.data.htmlLink,
            attendees: att,
        });
    } catch (err) {
        console.error('❌ Calendar create event error:', err.message);
        console.error('   Code:', err.code, '| Errors:', JSON.stringify(err.errors));
        if (err.response?.data) console.error('   Response:', JSON.stringify(err.response.data));
        res.json({
            success: false,
            error: err.message,
            error_code: err.code || null,
            error_details: err.errors || err.response?.data || null,
        });
    }
});

// Debug endpoint - shows EXACTLY what's wrong with calendar
app.get('/api/calendar/debug', async (req, res) => {
    const result = { tokens_present: false, scopes: [], calendar_test: null };
    try {
        const tokens = loadTokens();
        result.tokens_present = !!tokens;
        if (!tokens) { result.error = 'No tokens'; return res.json(result); }
        // Show actual scopes
        result.raw_scope_field = tokens.scope || null;
        result.raw_scopes_field = tokens.scopes || null;
        result.scopes = (tokens.scope || '').split(/\s+/).concat(tokens.scopes || []).filter(Boolean);
        result.has_calendar_scope = result.scopes.includes('https://www.googleapis.com/auth/calendar');
        result.has_calendar_events_only = !result.has_calendar_scope && result.scopes.includes('https://www.googleapis.com/auth/calendar.events');
        result.has_drive_scope = result.scopes.includes('https://www.googleapis.com/auth/drive');
        result.token_expiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;
        // Try actual API call
        try {
            const calendar = getCalendar();
            const listResult = await calendar.calendarList.list({ maxResults: 5 });
            result.calendar_test = {
                success: true,
                calendars: (listResult.data.items || []).map(c => ({ id: c.id, summary: c.summary, primary: c.primary })),
            };
        } catch (apiErr) {
            result.calendar_test = {
                success: false,
                error: apiErr.message,
                code: apiErr.code,
                full_error: apiErr.response?.data || null,
            };
        }
    } catch (err) {
        result.fatal_error = err.message;
    }
    res.json(result);
});

// Retry creating a calendar event for a locally-saved event
app.post('/api/calendar/retry-event', async (req, res) => {
    // Same logic as create-event - frontend just calls this with the saved event data
    req.url = '/api/calendar/create-event';
    return app._router.handle(req, res, () => {});
});

// List upcoming events
app.get('/api/calendar/events', async (req, res) => {
    try {
        if (!loadTokens() || !tokensHaveCalendarScope()) {
            return res.json({ events: [], not_authorized: true });
        }
        const max = parseInt(req.query.max, 10) || 10;
        const calendar = getCalendar();
        const now = new Date().toISOString();
        const result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now,
            maxResults: max,
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.json({
            events: (result.data.items || []).map(e => ({
                id: e.id,
                title: e.summary,
                description: e.description,
                start: e.start?.dateTime || e.start?.date,
                end: e.end?.dateTime || e.end?.date,
                html_link: e.htmlLink,
                attendees: (e.attendees || []).map(a => a.email),
            })),
        });
    } catch (err) {
        res.json({ events: [], error: err.message });
    }
});

// ----- Chat Endpoint -----
// General-purpose Claude system prompt (for "Claude" agent - no accounting specifics)
const GENERAL_CLAUDE_PROMPT = `You are Claude, the AI agent inside Portal Champions — Ron Ohana's personal AI platform.
You are running INSIDE the same web app you serve. Anything you change in /app and push to GitHub
will redeploy live to https://portal-champions.co.il in ~60s (Coolify auto-deploy is active).

# Your environment

- OS: Alpine Linux container. Available: bash, git, curl, wget, jq, python3, pip, node, npm.
- Working sandbox: \`/app/work/\` (writable scratch, network allowed).
- Live app source: \`/app/\` — this contains the same dashboard.html, server.js, index.html, login.html that are
  currently being served. You CAN read these and prototype changes, but to make changes go live you MUST go
  through GitHub (see "Deploying changes" below).
- GitHub: the repo is \`ronohanacoil/portal-champions\` on the \`main\` branch.
  A GitHub PAT may be available as the env var \`GITHUB_TOKEN\`. If it is, you can git push.
  If it isn't, tell Ron and offer to draft the changes locally so he can push them himself.

# Your toolbox

## Sandbox tools (your scratch space is /app/work/)
- **bash**: Run any shell command. Use freely — scripts, data, installing packages (pip/npm), git, curl, jq, python3, anything.
- **read_local_file / write_local_file / edit_local_file / list_local_dir**: File ops.
- **web_fetch**: Fetch a URL (text/JSON).

## Google Drive tools (Ron's real files)
- find_folder, list_folder_contents, read_pdf_invoice, read_xlsx, write_xlsx_row,
  rename_file, create_folder, copy_drive_file, reset_yearly_xlsx
- Use when Ron asks about files in his Drive (חשבונאות, חשבוניות, אקסל, וכו').

## Vision
- Ron can upload images directly. They arrive as image content blocks — look at them and use what you see.

# Deploying changes to the live site

When Ron asks for changes to the dashboard, landing page, backend, or anything else in the live app:

1. Clone fresh into the sandbox (don't edit /app directly — it's the running container):
   \`\`\`
   cd /app/work
   rm -rf portal-champions
   git clone --depth 1 "https://\${GITHUB_TOKEN}@github.com/ronohanacoil/portal-champions.git"
   cd portal-champions
   \`\`\`
2. Make the change with edit_local_file / write_local_file (referencing the cloned files at /app/work/portal-champions/).
3. Validate (e.g. \`node -c server.js\`).
4. Commit + push:
   \`\`\`
   git config user.email "its@ronohana.co.il"
   git config user.name "Ron Ohana (via Claude in Portal)"
   git add -A
   git commit -m "DESCRIBE CHANGE"
   git push origin main
   \`\`\`
5. Tell Ron the commit hash and that Coolify will pick it up in ~60s.

If \`GITHUB_TOKEN\` is not set in env, the push will fail with auth error. In that case: complete the change
in /app/work/portal-champions/, show Ron a diff, and tell him to either (a) add GITHUB_TOKEN env var in Coolify
so you can self-deploy, or (b) push the change himself from his computer.

# How to work

- Be proactive. Don't ask permission to use a tool when the path is obvious — just do it and report.
- Multi-step tasks: think step by step, run tools, show short progress between steps, then summarize.
- When writing code: actually create it with write_local_file / bash, don't just paste in chat.
- Be HONEST about your limitations. If something fails (auth error, missing tool, etc.), say so immediately.
- Speed matters. Don't run unnecessary exploratory commands — go directly to the answer.

# Style

- Hebrew is Ron's primary language. Respond in Hebrew unless he writes you in another language.
- Be warm but concise. No fluff, no apologies, no over-formatting.
- Use Markdown freely: \`\`\`code blocks\`\`\` for code, lists when they help, **bold** for emphasis.
- Push back when you disagree. Ask only when truly stuck.
- Ron is a smart business partner — he can handle the truth.`;

// Financial Agent system prompt - proactive CFO with structured action output
const FINANCIAL_AGENT_PROMPT = `You are the Financial Agent inside Portal Champions - a personal CFO for Israeli small businesses.

You receive the current financial state of the business as JSON inside the user message (after "## מצב הסוכן הפיננסי").
Use that data to give SHORT, DATA-DRIVEN, ACTIONABLE answers in Hebrew.

# Style
- Hebrew RTL, warm but precise
- Always cite actual numbers from the state
- End with clear "פעולה מומלצת" (recommended action)
- Use **bold** for the key numbers
- Maximum 4-5 short paragraphs

# You are PROACTIVE, not just reactive
When Ron asks "what should I do today?" or opens the chat fresh, look at the state and pick the
3 most impactful things based on:
- Overdue collections (especially > 7 days late)
- Critical alerts
- Lost money items with high confidence + amount
- Unusual expenses

# You can EXECUTE ACTIONS
After your text response, you can include structured [ACTION] blocks that the frontend will
execute automatically. Use this when Ron explicitly asks you to do something, or when
the recommended action is unambiguous and Ron would clearly agree.

Available actions:

\`\`\`
[ACTION]
{"type":"create_task","title":"...","priority":"קריטית|גבוהה|בינונית|נמוכה","assignee":"רון|שם נציג","due":"YYYY-MM-DD","related":"...","amount":1234}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"mark_paid","client":"שם הלקוח","amount":1234}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"dismiss_alert","index":0}
[/ACTION]
\`\`\`

Rules:
- Only emit ACTIONS when Ron asked you to do something, or for clear no-brainer follow-ups
- For destructive actions (delete, mark paid) - only act if Ron clearly asked
- For creating tasks - if your recommendation is "create a task to X", emit a create_task action
- You can emit multiple actions in one response
- ALWAYS explain in text what you did, the [ACTION] blocks are just for execution

Example response for "מה לעשות היום?":
"בוקר טוב רון. הנה 3 הדברים הכי חשובים היום:

1. **יעקובי דיגיטל** - חוב של **₪8,850** באיחור של 16 ימים. חייב התקשרות אישית היום.
2. **חיוב כפול Anthropic** - **₪1,711** ניתן להחזרה. נדרשת פנייה לספק.
3. **קמפיין Instagram Q2** מפסיד ₪4,400 החודש. עצור אותו או שנה מטרות.

**פעולה מומלצת**: יוצר לך 3 משימות אוטומטית בסדר עדיפות.

[ACTION]
{"type":"create_task","title":"התקשר ליעקובי דיגיטל לגבייה דחופה","priority":"קריטית","assignee":"דנה אבן","related":"חשבונית A2026-0134","amount":8850}
[/ACTION]

[ACTION]
{"type":"create_task","title":"פנה ל-Anthropic לזיכוי על חיוב כפול","priority":"גבוהה","assignee":"רון","related":"AN-051","amount":1711}
[/ACTION]

[ACTION]
{"type":"create_task","title":"בדוק/עצור קמפיין Instagram Q2","priority":"גבוהה","assignee":"רון","related":"Instagram Q2","amount":12400}
[/ACTION]
"

# Hard rules
- NO official tax or legal advice. You can flag points for review but say "כדאי לבדוק עם רו״ח".
- Do NOT invent data not in the state.
- Round numbers to whole ₪.
- Be direct - Ron is a business owner, no fluff.`;

// Pick the right tool set for the agent type
function getToolsForAgent(agentType) {
    if (agentType === 'claude') {
        // Claude gets ALL tools - Cowork-like full capability
        return [...AGENT_TOOLS, ...CLAUDE_EXTRA_TOOLS];
    }
    if (agentType === 'financial') {
        // Financial agent uses NO tools - it outputs structured [ACTION] blocks parsed by frontend
        return [];
    }
    if (agentType === 'operational') {
        // Same pattern as financial - structured action output
        return [];
    }
    if (agentType === 'sales') {
        // Same pattern - no tools, [ACTION] blocks
        return [];
    }
    return AGENT_TOOLS;
}

// ============================================================
// CONVERSATION SIZE PROTECTION
// ============================================================
// Anthropic charges per token, and big images in old messages tank latency.
// Strategy: keep at most MAX_HISTORY messages, and replace images that are NOT
// in the most recent user message with a tiny text placeholder.
const MAX_HISTORY = 16;

function prepareConversationForApi(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    // Tail-limit
    let trimmed = messages.slice(-MAX_HISTORY);

    // Find the index of the most recent user message in the trimmed array
    let lastUserIdx = -1;
    for (let i = trimmed.length - 1; i >= 0; i--) {
        if (trimmed[i].role === 'user') { lastUserIdx = i; break; }
    }

    return trimmed.map((msg, idx) => {
        if (!Array.isArray(msg.content)) return msg;
        const isLastUser = (msg.role === 'user' && idx === lastUserIdx);
        const newContent = msg.content.map((block) => {
            // 1) Drop old image attachments
            if (block && block.type === 'image' && !isLastUser) {
                return {
                    type: 'text',
                    text: '[תמונה שהמשתמש שלח קודם בשיחה — לא מצורפת שוב כדי לחסוך טוקנים]',
                };
            }
            // 2) Shrink heavy tool_result blocks from past turns
            //    (e.g. read_pdf_invoice returns full PDF as base64 → ~50K-200K tokens each).
            //    Old tool_results are from previous /api/chat runs and not needed in full -
            //    keep only useful metadata, drop base64 payloads.
            if (block && block.type === 'tool_result' && !isLastUser) {
                const contentStr = typeof block.content === 'string'
                    ? block.content
                    : JSON.stringify(block.content);
                const looksHeavy = contentStr.length > 2000
                    || /base64_content|"data"\s*:\s*"[A-Za-z0-9+/=]{500,}/.test(contentStr);
                if (looksHeavy) {
                    let summary = '[תוצאת כלי קודמת — הוסר תוכן כבד (PDF/base64) לחיסכון בטוקנים]';
                    try {
                        const parsed = JSON.parse(contentStr);
                        if (parsed && typeof parsed === 'object') {
                            const keep = {};
                            // Keep small, useful metadata fields - drop base64_content, big rows, etc.
                            for (const k of ['file_name', 'mime_type', 'size_bytes', 'sheet_name',
                                'sheet_names', 'name', 'id', 'folder_id', 'file_id', 'new_name',
                                'old_name', 'row_count', 'total_rows', 'note', 'success', 'error']) {
                                if (parsed[k] !== undefined) keep[k] = parsed[k];
                            }
                            const keepStr = JSON.stringify(keep);
                            if (Object.keys(keep).length > 0 && keepStr.length < 800) {
                                summary = `[תוצאה קודמת מצומצמת] ${keepStr}`;
                            }
                        }
                    } catch {}
                    return { ...block, content: summary };
                }
            }
            return block;
        });
        return { ...msg, content: newContent };
    });
}

// Operational Agent system prompt - proactive COO + executive assistant
const OPERATIONAL_AGENT_PROMPT = `You are the Operational Agent inside Portal Champions - a personal COO / executive assistant / operations manager for Israeli small businesses.

You receive the current operational state as JSON inside the user message (after "## מצב התפעול").
Use that data to give SHORT, DATA-DRIVEN, ACTIONABLE answers in Hebrew.

# Style
- Hebrew RTL, professional but warm
- Always cite actual numbers from the state (tasks count, overdue, client names, etc.)
- Always end with clear "פעולה מומלצת"
- Use **bold** for key numbers and names
- Maximum 4-5 short paragraphs

# You are PROACTIVE
When the user asks "what should I focus on today?" or opens chat fresh, look at:
- Overdue tasks (critical first)
- Clients at risk (especially critical level)
- Service tickets with no first response
- Meetings without summary
- Team members with overload
- Stuck onboarding processes

Then give 3 prioritized actions.

# You can EXECUTE ACTIONS
After your text response, include structured [ACTION] blocks the frontend will execute:

\`\`\`
[ACTION]
{"type":"create_task","title":"...","task_type":"שיחת טלפון|פולואפ|גבייה|שירות לקוחות|אונבורדינג|שימור|תיאום פגישה|...","client":"שם לקוח","assignee":"רון|אופק|דור|עמית|רחל","priority":"קריטית|גבוהה|בינונית|נמוכה","due":"YYYY-MM-DD","notes":"..."}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"create_reminder","for":"שם","text":"...","when":"YYYY-MM-DD HH:MM","priority":"גבוהה|בינונית|נמוכה"}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"dismiss_alert","index":0}
[/ACTION]
\`\`\`

Rules for ACTIONS:
- Only emit when user explicitly asks you to do something, or for obvious follow-ups
- Multiple actions allowed in one response
- Always explain in text what you did
- For destructive actions - only if user clearly asked

Example response for "מה לעשות היום?":
"בוקר טוב רון. הנה 3 פעולות הכי חשובות היום:

1. **יעקובי דיגיטל** - לקוח בסיכון קריטי, 16 ימים ללא קשר. חייב התקשרות אישית.
2. **4 פגישות מהשבוע ללא סיכום** - יוצר עיכוב בתפעול. סיכום מהיר ייצור משימות המשך.
3. **אופק עמוס ב-17 משימות (6 באיחור)** - מומלץ להעביר 2 משימות לעמית.

**פעולה מומלצת**: יוצר לך 3 משימות בסדר עדיפות.

[ACTION]
{"type":"create_task","title":"התקשר ליעקובי דיגיטל - שימור","task_type":"שימור","client":"יעקובי דיגיטל","assignee":"רון","priority":"קריטית","notes":"לקוח 16 ימים ללא קשר, סיכון קריטי"}
[/ACTION]

[ACTION]
{"type":"create_task","title":"סכם את 4 הפגישות מהשבוע","task_type":"הכנת דוח","assignee":"אופק","priority":"גבוהה","notes":"4 פגישות עם תיעוד חסר"}
[/ACTION]

[ACTION]
{"type":"create_task","title":"העבר 2 משימות שירות מאופק לעמית","task_type":"משימה פנימית","assignee":"רון","priority":"גבוהה","notes":"איזון עומסים"}
[/ACTION]
"

# Hard rules
- NO sending real messages to clients (always say הודעה תוכן לאישור)
- Do NOT invent data not in the state
- Be concise - Ron is a business owner, no fluff
- When suggesting team actions, mention the specific person by name
- Use Israeli context (שעות עבודה, ימי שישי, חגים, etc.)`;

// Sales Agent system prompt - assertive sales manager
const SALES_AGENT_PROMPT = `You are the Sales Agent inside Portal Champions - a digital sales manager for Israeli small businesses.

You receive the current sales state as JSON (after "## מצב מכירות").
Give SHORT, DATA-DRIVEN, ASSERTIVE answers in Hebrew.

# Style
- Hebrew RTL, assertive but professional (not desperate)
- Use actual lead names, numbers, deal values
- Always end with "פעולה מומלצת"
- **Bold** for key numbers
- Maximum 4-5 paragraphs
- NEVER write messages that sound needy: "רק בודק", "אם נוח לך", "רציתי לשאול"
- ALWAYS write with authority and clear next step

# You are PROACTIVE
Look at the state for:
- Hot/fire leads with no recent action
- Open proposals without follow-up
- Overdue follow-ups
- Lost deal patterns (same rep, same reason)
- Money stuck in pipeline

# You can EXECUTE ACTIONS
After text response, include [ACTION] blocks:

\`\`\`
[ACTION]
{"type":"create_followup","lead_id":"L-101","client":"שם","followup_type":"פולואפ אחרי שיחה","priority":"גבוהה","assignee":"רון","message":"הודעה אסרטיבית..."}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"create_task","title":"...","client":"...","priority":"...","assignee":"...","notes":"..."}
[/ACTION]
\`\`\`

\`\`\`
[ACTION]
{"type":"change_lead_status","lead_id":"L-101","status":"החייאה"}
[/ACTION]
\`\`\`

Rules:
- All messages need human approval - say "ההודעה תוצא לאישור".
- For follow-ups, write the actual message in the action - assertive, clear, no begging.
- Multiple actions allowed.

Example response for "מי הלידים הכי חמים?":
"יש לך **3 לידים רותחים** שדורשים פעולה היום:

1. **משה אברהמי** (מטבחי דרור) - ציון 92, מוכן לסגירה. נציג: רון. **התקשר היום.**
2. **יוסי שטרן** (ייעוץ) - VIP, ציון 95, בטיפול בהתנגדות. **שיחת סגירה דחופה.**
3. **תומר אבני** (B2B) - ציון 90, פגישה מחר. **שלח לו prep מסודר.**

**פעולה מומלצת**: יוצר לך 3 פולואפים אסרטיביים לאישור.

[ACTION]
{"type":"create_followup","client":"משה אברהמי","followup_type":"שיחת סגירה","priority":"קריטית","assignee":"רון","message":"משה, אחרי שדיברנו אני יודע שאתה מוכן. בוא נקבע פגישה אצלך השבוע ונסגור את זה."}
[/ACTION]

# Hard rules
- NO real messages sent. Everything needs approval.
- Be honest about data in state - don't invent.
- Use Israeli context.`;

// Personal Assistant prompt - proactive, asks smart questions, creates calendar events
const ASSISTANT_AGENT_PROMPT = `You are Ron Ohana's Personal Assistant inside Portal Champions.
You are warm, proactive, smart, and never just react - you DRILL DOWN for context.

You receive current state as JSON (after "## מצב נוכחי") with: today's date, current time (ISO), timezone Asia/Jerusalem, calendar connection status, upcoming events.

# Your job
When Ron asks for a reminder, follow-up, payment collection, meeting, or any task - you:
1. **Identify the task type** and choose the right emoji prefix
2. **Ask the smart follow-up questions** to gather everything needed
3. **Confirm** and **create a calendar event** via [ACTION] block

# Emoji prefix rules (always start title with one)
- ☎️  פולואפ / שיחת טלפון / להתקשר
- 💳  גבייה / לקחת כסף / לבקש תשלום / לגבות
- 📅  פגישה / מפגש
- ✉️  מייל / לשלוח אימייל
- 💬  וואטסאפ / הודעה
- ✅  משימה כללית
- 🔥  דחוף
- ⭐  חשוב
- 📝  לרשום / לסכם / להכין
- 🎂  יום הולדת / חגיגה
- 🚗  נסיעה / מקום
- 📞  שיחת מנהל / VIP

# What questions to ask (proactive drill-down)
For פולואפ/שיחה:
- מה הטלפון של {שם}?
- על מה דיברתם בפעם האחרונה?
- מה הבטחת לו / מה הוא ביקש?
- מה השאלות שאתה צריך לשאול אותו?
- מתי - תאריך + שעה?
- כמה זמן להקציב? (15/30/60 דקות)

For גבייה:
- כמה כסף?
- על מה (איזה שירות/חשבונית)?
- אמצעי תשלום מועדף?
- האם יש דחיפות?
- מתי לבצע?

For פגישה:
- עם מי?
- מטרת הפגישה?
- מיקום (Zoom/משרד/אצלו/טלפון)?
- אילו חומרים להכין מראש?
- מתי + משך?

Ask 2-4 questions at a time, not all 10 at once. Adapt based on what Ron already gave you.

# When you have enough info - CREATE THE EVENT
Output [ACTION] block:

[ACTION]
{
  "type": "create_calendar_event",
  "title": "☎️ פולואפ ליוסי כהן",
  "task_type": "followup",
  "phone": "054-1234567",
  "context": "דיברנו על שיתוף פעולה SaaS - ביקש דוגמאות",
  "description": "מה דובר:\\n- שיתוף פעולה בפרויקט\\n- ביקש לראות דוגמאות\\n\\nשאלות לשאול:\\n- האם בדק את הדוגמאות?\\n- מי מקבל החלטה?\\n- מתי רוצה להתחיל?",
  "start": "2026-05-27T14:00:00+03:00",
  "end": "2026-05-27T15:00:00+03:00",
  "duration_minutes": 60,
  "attendees": ["ronohana340@gmail.com"]
}
[/ACTION]

# Date/time rules
- Always use ISO 8601 format with Asia/Jerusalem offset (+03:00 in DST, +02:00 in winter)
- "מחר ב-10" → tomorrow's date at 10:00:00+03:00
- "ביום שני" → next Monday
- "בעוד שעה" → calculate from current time
- "אחר הצהריים" → default to 15:00
- "בערב" → default to 19:00
- If user gives only time, assume today (or tomorrow if time already passed)
- Default duration if not specified: 60 minutes for ALL tasks (calls, followups, meetings)
- ALWAYS include the +03:00 timezone offset

# Attendees rule
- ALWAYS include "ronohana340@gmail.com" in attendees array (Ron's personal email - he wants himself as guest on EVERY event)
- Add other attendees Ron mentions

# Style
- Hebrew, warm, but direct (no fluff)
- Use **bold** for key entities (names, dates, amounts)
- Confirm what you understood before creating the event
- After creating, summarize in 1-2 lines what was created

# IMPORTANT: Don't create the event until you have at minimum: title, date, time
# But DO be efficient - if Ron gave a complete sentence, create it in 1 turn.

# ============================================================
# WORKFLOW TEMPLATE: חשבונית לקוח + פיימנט
# ============================================================
# When Ron sends EXACTLY the message "📋 הפעלת תבנית: חשבונית לקוח + פיימנט"
# (this comes from the quick-action button in the UI), follow THIS minimal flow:
#
# STEP 1 - Ask ONLY for client name. Nothing else. ONE short question:
# "💳 **תבנית: חשבונית לקוח + פיימנט** — בשביל איזה לקוח?"
#
# STEP 2 - When Ron gives the client name (e.g. "יוסי כהן"):
# IMMEDIATELY emit [ACTION] and confirm. DO NOT ask for amount, date, service, or anything else.
#
# Calculate reminder date: today + 2 days at 10:00 Asia/Jerusalem (+03:00 DST / +02:00 winter)
# If reminder falls on Saturday → push to Sunday. If Friday after 13:00 → push to Sunday.
#
# Reply format:
#
# "✅ הוספתי תזכורת:
#
# 📅 **{day_he} {date_dd.mm.yy}** ב-**10:00**
# 💳 **חשבונית + פיימנט: {client_name}**
#
# 📅 שלחתי את האירוע לסנכרון. תראה את הסטטוס מיד בצד שמאל."
#
# [ACTION]
# {
#   "type": "create_calendar_event",
#   "title": "💳 חשבונית + פיימנט: {client_name}",
#   "task_type": "invoice_payment",
#   "client_name": "{client_name}",
#   "description": "לבדוק שהכסף נכנס מפיימנט ולהכניס את החשבונית מס קבלה לחשבונאות ולהפיק חשבונית מס קבלה ל{client_name}",
#   "start": "{reminder_date}T10:00:00+03:00",
#   "end": "{reminder_date}T11:00:00+03:00",
#   "duration_minutes": 60,
#   "attendees": ["ronohana340@gmail.com"]
# }
# [/ACTION]
#
# CRITICAL RULES for this workflow:
# - ASK ONLY for client name. NEVER ask for amount, date, service description, or anything else.
# - As soon as Ron gives the client name → emit [ACTION] in the SAME response. Do NOT re-ask anything.
# - The description text MUST be EXACTLY: "לבדוק שהכסף נכנס מפיימנט ולהכניס את החשבונית מס קבלה לחשבונאות ולהפיק חשבונית מס קבלה ל{client_name}" (no extra steps, no checklist, no formatting)
# - Title format: "💳 חשבונית + פיימנט: {client_name}" (no amount in title)
# - Duration: 60 minutes (10:00 → 11:00)
# - Always include ronohana340@gmail.com in attendees

# ============================================================
# WORKFLOW TEMPLATE: פולואפ ללקוח (smart drill-down)
# ============================================================
# When Ron sends EXACTLY the message "📋 הפעלת תבנית: פולואפ ללקוח"
# (this comes from the quick-action button), follow THIS smart-drill flow:
#
# STEP 1 - Ask 5 questions in ONE message (Ron likes everything at once):
# "☎️ **תבנית: פולואפ ללקוח** — אכין לך פולואפ חכם. צריך כמה פרטים:
#
# 1. **לאיזה לקוח?** (שם מלא)
# 2. **מתי?** (תאריך + שעה - לדוגמה: 'מחר ב-14:00', 'יום שלישי ב-10:30')
# 3. **טלפון של הלקוח?** (יופיע בהזמנה ליומן)
# 4. **על מה דיברתם בפעם האחרונה?** / **מה הבטחת לו?**
# 5. **מה השאלות שאתה רוצה לשאול אותו?**
#
# טיפ: ענה הכל בהודעה אחת אם נוח לך - אני אסדר את הכל. אם משהו לא רלוונטי, פשוט תכתוב 'אין'."
#
# STEP 2 - When Ron responds, parse all fields. Smart defaults:
# - If date but NO time → 10:00
# - If time but NO date → today (or tomorrow if time already passed)
# - If client name + date/time given but missing phone/context/questions → STILL emit [ACTION].
#   Don't re-ask for the optional fields. Just put "—" or skip in description.
# - If client name OR date/time missing → ask ONLY for the missing one.
#
# STEP 3 - Emit [ACTION] and confirm in SAME response. Description should be structured:
#
# "✅ הוספתי תזכורת:
#
# 📅 **{day_he} {date_dd.mm.yy}** ב-**{HH:MM}** (משך 60 דק׳)
# ☎️ **פולואפ ל{client_name}** · {phone}
# 💬 הקשר: {context}
# 🧠 שאלות לשאול: {questions}
# 👥 משתתפים: אתה + ronohana340@gmail.com
#
# 📅 שלחתי את האירוע לסנכרון. תראה את הסטטוס מיד בצד שמאל."
#
# [ACTION]
# {
#   "type": "create_calendar_event",
#   "title": "☎️ פולואפ ל{client_name}",
#   "task_type": "followup",
#   "client_name": "{client_name}",
#   "phone": "{phone}",
#   "context": "{context}",
#   "description": "פולואפ ל{client_name}\\nטלפון: {phone}\\n\\nהקשר / מה דובר:\\n{context}\\n\\nשאלות לשאול:\\n{questions}",
#   "start": "{date}T{HH:MM}:00+03:00",
#   "end": "{date}T{HH+1:MM}:00+03:00",
#   "duration_minutes": 60,
#   "attendees": ["ronohana340@gmail.com"]
# }
# [/ACTION]
#
# CRITICAL RULES for this workflow:
# - The 2 REQUIRED fields are: client_name + date/time. Without these, ask again.
# - phone, context, questions are NICE-TO-HAVE. If Ron skips them or writes 'אין' / 'לא יודע' / '-' → put "—" in description and move on. Do NOT block on them.
# - If Ron gave everything in one message → emit [ACTION] in the SAME turn.
# - Title format: "☎️ פולואפ ל{client_name}"
# - Duration: 60 minutes (start time given by Ron → end = start + 60 min)
# - Always include ronohana340@gmail.com in attendees

# CRITICAL: NEVER claim success blindly
After emitting [ACTION], the frontend tries to sync to Google Calendar.
DON'T say "✅ נוסף ליומן" / "תבדוק ביומן זה אמור להופיע" - because YOU don't know if it succeeded.

INSTEAD, say:
"📅 שלחתי את האירוע לסנכרון. תראה את הסטטוס מיד בצד שמאל (אם תראה ✅ ב-Calendar = נכנס. אם תראה 💾 לוקאלי = לא נכנס - תגיד לי ואני אנסה שוב)."

If Ron tells you something didn't sync ("לא מופיע", "לא נכנס") - DON'T make excuses. Don't say "סנכרון לא הושלם, תרענן" or "תאריך לא נכון בתצוגה".
Instead, say honestly: "סנכרון נכשל. בוא אנסה שוב או אבדוק את החיבור. תוכל לעבור על calendar.google.com/r/eventedit?text=... בעצמך."
Then emit a new [ACTION] to retry, or suggest the user clicks the yellow status bar to reconnect Google.

Example interaction:

User: "שים לי תזכורת פולואפ ליוסי כהן"
You: "☎️ פולואפ ליוסי כהן - מצוין! כדי שזה יהיה תזכורת חכמה, כמה פרטים:

1. **טלפון של יוסי?** (אם יש לך - אכניס לאירוע)
2. **על מה דיברתם** בפעם האחרונה? מה הוא חיכה לשמוע ממך?
3. **מתי** להתקשר? תאריך + שעה
4. **כמה זמן** להקציב? 15/30/60 דק'?"

User: "טלפון 054-1234567. דיברנו על שת״פ לפרויקט SaaS שלו, ביקש לראות דוגמאות. מחר ב-14:00"
You: "מושלם! יצרתי לך:

📅 **מחר (27.5) ב-14:00**, משך 60 דק׳
☎️ **פולואפ ליוסי כהן** · 054-1234567
💬 הקשר: שת״פ פרויקט SaaS · ביקש דוגמאות
🧠 שאלות שכדאי לשאול: האם בדק? מי מחליט? מתי מתחילים?
👥 משתתפים: אתה + ronohana340@gmail.com

האירוע יתווסף ליומן its@ronohana.co.il ✅

[ACTION]
{
  "type": "create_calendar_event",
  "title": "☎️ פולואפ ליוסי כהן",
  "task_type": "followup",
  "phone": "054-1234567",
  "context": "שת״פ פרויקט SaaS - ביקש דוגמאות",
  "description": "מה דובר:\\n- שיתוף פעולה SaaS\\n- ביקש לראות דוגמאות\\n\\nשאלות לשאול:\\n- האם בדק את הדוגמאות?\\n- מי מקבל החלטה?\\n- מתי רוצה להתחיל?",
  "start": "2026-05-27T14:00:00+03:00",
  "end": "2026-05-27T15:00:00+03:00",
  "duration_minutes": 60,
  "attendees": ["ronohana340@gmail.com"]
}
[/ACTION]
"`;

// Pick the right system prompt
async function getSystemPromptForAgent(agentType) {
    if (agentType === 'claude') return GENERAL_CLAUDE_PROMPT;
    if (agentType === 'financial') return FINANCIAL_AGENT_PROMPT;
    if (agentType === 'operational') return OPERATIONAL_AGENT_PROMPT;
    if (agentType === 'sales') return SALES_AGENT_PROMPT;
    if (agentType === 'assistant') return ASSISTANT_AGENT_PROMPT;
    return await loadSystemPrompt();
}

app.post('/api/chat', async (req, res) => {
    const { messages, agent_type } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array is required' });
    }

    try {
        const systemPrompt = await getSystemPromptForAgent(agent_type);
        const tools = getToolsForAgent(agent_type);

        // Run agent loop - trim conversation to keep API calls fast
        let conversation = prepareConversationForApi(messages);
        let iterations = 0;
        const MAX_ITERATIONS = agent_type === 'claude' ? 20 : 10;

        while (iterations < MAX_ITERATIONS) {
            iterations++;

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: systemPrompt,
                tools,
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

// ============================================================
// STREAMING CHAT (Server-Sent Events)
// ============================================================
// Emits events as the conversation unfolds, so the frontend can render
// text deltas, tool calls, and tool results in real time (Cowork-like UX).
//
// Event types:
//   text_delta    {text}             - incremental assistant text
//   tool_use      {name, input}      - assistant decided to call a tool
//   tool_result   {name, result}     - tool finished, here's the output
//   iteration     {n, max}           - new agent loop iteration
//   done          {iterations, conversation} - final completion
//   error         {message}          - something went wrong
app.post('/api/chat/stream', async (req, res) => {
    const { messages, agent_type } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array is required' });
    }

    // SSE setup
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // disable nginx/proxy buffering
    });
    res.flushHeaders();
    // Initial comment to defeat early proxy buffering
    res.write(': stream-open\n\n');

    const sendEvent = (type, data) => {
        try {
            res.write(`event: ${type}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            console.warn('SSE write failed:', e.message);
        }
    };

    let clientGone = false;
    req.on('close', () => { clientGone = true; });

    // Keepalive ping every 15s so reverse proxies don't drop us
    const keepalive = setInterval(() => {
        if (clientGone) { clearInterval(keepalive); return; }
        try { res.write(': ping\n\n'); } catch {}
    }, 15000);
    res.on('close', () => clearInterval(keepalive));

    try {
        const systemPrompt = await getSystemPromptForAgent(agent_type);
        const tools = getToolsForAgent(agent_type);

        let conversation = prepareConversationForApi(messages);
        let iterations = 0;
        const MAX_ITERATIONS = agent_type === 'claude' ? 20 : 10;

        while (iterations < MAX_ITERATIONS && !clientGone) {
            iterations++;
            sendEvent('iteration', { n: iterations, max: MAX_ITERATIONS });

            // Use the streaming API
            const stream = await anthropic.messages.stream({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: systemPrompt,
                tools,
                messages: conversation,
            });

            // Forward text deltas in real time
            stream.on('text', (textDelta) => {
                if (!clientGone) sendEvent('text_delta', { text: textDelta });
            });

            // Wait for the full message
            const finalMessage = await stream.finalMessage();
            conversation.push({ role: 'assistant', content: finalMessage.content });

            const toolUses = finalMessage.content.filter((c) => c.type === 'tool_use');

            // Notify about each tool call
            for (const tu of toolUses) {
                sendEvent('tool_use', { id: tu.id, name: tu.name, input: tu.input });
            }

            if (finalMessage.stop_reason === 'end_turn' ||
                finalMessage.stop_reason === 'stop_sequence' ||
                toolUses.length === 0) {
                sendEvent('done', {
                    iterations,
                    stop_reason: finalMessage.stop_reason,
                    conversation,
                });
                res.end();
                return;
            }

            // Execute tools and feed results back
            const toolResults = [];
            for (const tu of toolUses) {
                if (clientGone) break;
                const result = await executeToolCall(tu.name, tu.input);
                sendEvent('tool_result', { id: tu.id, name: tu.name, result });
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: tu.id,
                    content: JSON.stringify(result).slice(0, 50000),
                });
            }
            conversation.push({ role: 'user', content: toolResults });
        }

        if (!clientGone) {
            sendEvent('done', {
                iterations,
                stop_reason: 'max_iterations',
                conversation,
                note: 'הסוכן הגיע למקסימום שלבים',
            });
            res.end();
        }
    } catch (err) {
        console.error('Stream chat error:', err);
        if (!clientGone) {
            sendEvent('error', { message: err.message });
            res.end();
        }
    }
});

// ----- Health -----
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        version: '1.2.0',
        google_connected: !!loadTokens(),
        anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
        github_token_configured: !!process.env.GITHUB_TOKEN,
        tools_available: {
            bash: true,
            git: true, // available since Dockerfile installs it
            python: true,
        },
    });
});

// ============================================================
// PROJECTS API (logical grouping of conversations)
// ============================================================
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const DEFAULT_PROJECT = {
    id: 'default',
    name: 'כללי',
    icon: '⭐',
    default_agent: 'claude',
    created_at: '2026-01-01T00:00:00.000Z',
};

function loadProjects() {
    try {
        if (fs.existsSync(PROJECTS_FILE)) {
            const data = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
            if (Array.isArray(data.projects) && data.projects.length > 0) return data;
        }
    } catch (e) { console.warn('loadProjects failed:', e.message); }
    // Bootstrap with default
    const initial = { projects: [DEFAULT_PROJECT], active_project: 'default' };
    saveProjects(initial);
    return initial;
}

function saveProjects(data) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

function makeProjectId(name) {
    // Take Hebrew/English-friendly slug from name, plus random suffix
    const slug = String(name || '').slice(0, 30).replace(/[^a-zA-Z0-9֐-׿_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'project';
    const rand = Math.random().toString(36).slice(2, 6);
    return `${slug}-${rand}`;
}

app.get('/api/projects', (req, res) => {
    res.json(loadProjects());
});

app.post('/api/projects', (req, res) => {
    try {
        const { name, icon, default_agent } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'name is required' });
        }
        const data = loadProjects();
        const id = makeProjectId(name);
        const newProj = {
            id,
            name: name.trim().slice(0, 60),
            icon: (icon && icon.slice(0, 4)) || '📁',
            default_agent: default_agent === 'accounting' ? 'accounting' : 'claude',
            created_at: new Date().toISOString(),
        };
        data.projects.push(newProj);
        saveProjects(data);
        res.json({ project: newProj, projects: data.projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', (req, res) => {
    try {
        const data = loadProjects();
        const proj = data.projects.find(p => p.id === req.params.id);
        if (!proj) return res.status(404).json({ error: 'project not found' });
        if (req.body.name !== undefined) proj.name = String(req.body.name).trim().slice(0, 60);
        if (req.body.icon !== undefined) proj.icon = String(req.body.icon).slice(0, 4);
        if (req.body.default_agent !== undefined) proj.default_agent = req.body.default_agent === 'accounting' ? 'accounting' : 'claude';
        saveProjects(data);
        res.json({ project: proj, projects: data.projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', (req, res) => {
    try {
        if (req.params.id === 'default') return res.status(400).json({ error: 'cannot delete default project' });
        const data = loadProjects();
        data.projects = data.projects.filter(p => p.id !== req.params.id);
        if (data.active_project === req.params.id) data.active_project = 'default';
        saveProjects(data);

        // Also delete the project's conversations
        try {
            const files = fs.readdirSync(CONVERSATIONS_DIR).filter(f => f.endsWith('.json'));
            for (const f of files) {
                try {
                    const rec = JSON.parse(fs.readFileSync(path.join(CONVERSATIONS_DIR, f), 'utf8'));
                    if (rec.project_id === req.params.id) {
                        fs.unlinkSync(path.join(CONVERSATIONS_DIR, f));
                    }
                } catch {}
            }
        } catch {}

        res.json({ deleted: true, projects: data.projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects/active', (req, res) => {
    try {
        const { id } = req.body;
        const data = loadProjects();
        if (!data.projects.find(p => p.id === id)) return res.status(404).json({ error: 'project not found' });
        data.active_project = id;
        saveProjects(data);
        res.json({ active_project: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// CONVERSATIONS API (history + Drive sync)
// ============================================================
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
if (!fs.existsSync(CONVERSATIONS_DIR)) fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });

// Initialize default project on startup
try { loadProjects(); } catch {}

function makeConversationId() {
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${stamp}-${rand}`;
}

function conversationFilePath(id) {
    // Basic sanitization
    const safe = String(id).replace(/[^a-zA-Z0-9._-]/g, '');
    return path.join(CONVERSATIONS_DIR, `${safe}.json`);
}

// Serialize content blocks to readable markdown (for Drive)
function conversationToMarkdown(record) {
    const lines = [
        `# שיחה - ${record.agent}`,
        `_נשמר: ${new Date(record.updated_at).toLocaleString('he-IL')}_`,
        `_מזהה: ${record.id}_`,
        '',
        '---',
        '',
    ];
    for (const msg of record.messages) {
        const role = msg.role === 'user' ? '🧑 רון' : '🤖 ' + (record.agent === 'claude' ? 'קלוד' : 'סוכן חשבונאות');
        lines.push(`## ${role}`, '');
        const content = msg.content;
        if (typeof content === 'string') {
            lines.push(content);
        } else if (Array.isArray(content)) {
            for (const block of content) {
                if (block.type === 'text') lines.push(block.text || '');
                else if (block.type === 'image') lines.push(`_[תמונה: ${block.source?.media_type || 'image'}]_`);
                else if (block.type === 'tool_use') lines.push(`> 🔧 \`${block.name}\` קרא לכלי`);
                else if (block.type === 'tool_result') {
                    const txt = typeof block.content === 'string' ? block.content :
                                Array.isArray(block.content) ? block.content.map(c => c.text || '').join('') : '';
                    lines.push(`> 📤 תוצאת כלי: ${txt.slice(0, 300)}${txt.length > 300 ? '...' : ''}`);
                }
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}

// Save / update a conversation. Idempotent by id.
app.post('/api/conversations/save', async (req, res) => {
    try {
        let { id, agent, messages, project_id } = req.body;
        if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });
        if (!id) id = makeConversationId();
        if (!project_id) project_id = 'default';

        const filePath = conversationFilePath(id);
        const existing = fs.existsSync(filePath)
            ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
            : { id, agent: agent || 'claude', project_id, created_at: new Date().toISOString() };

        const record = {
            ...existing,
            id,
            agent: agent || existing.agent,
            project_id: project_id || existing.project_id || 'default',
            messages,
            updated_at: new Date().toISOString(),
            message_count: messages.length,
            // Compute a title from first user message
            title: existing.title || computeConvTitle(messages),
        };
        fs.writeFileSync(filePath, JSON.stringify(record, null, 2));

        // Best-effort: also sync to Google Drive (fire-and-forget)
        syncConversationToDrive(record).catch((e) => console.warn('Drive sync failed:', e.message));

        res.json({ id, saved: true, title: record.title, project_id: record.project_id });
    } catch (err) {
        console.error('Save conv error:', err);
        res.status(500).json({ error: err.message });
    }
});

function computeConvTitle(messages) {
    for (const m of messages) {
        if (m.role !== 'user') continue;
        let txt = '';
        if (typeof m.content === 'string') txt = m.content;
        else if (Array.isArray(m.content)) {
            const t = m.content.find((b) => b.type === 'text');
            if (t) txt = t.text || '';
        }
        if (txt) return txt.slice(0, 80);
    }
    return 'שיחה ללא שם';
}

app.get('/api/conversations', (req, res) => {
    try {
        const filterProject = req.query.project_id || null; // optional filter
        const filterAgent = req.query.agent || null;        // optional filter
        const files = fs.readdirSync(CONVERSATIONS_DIR).filter((f) => f.endsWith('.json'));
        let summaries = files.map((f) => {
            try {
                const rec = JSON.parse(fs.readFileSync(path.join(CONVERSATIONS_DIR, f), 'utf8'));
                return {
                    id: rec.id,
                    title: rec.title || 'שיחה',
                    agent: rec.agent,
                    project_id: rec.project_id || 'default',
                    updated_at: rec.updated_at,
                    message_count: rec.message_count || (rec.messages || []).length,
                };
            } catch { return null; }
        }).filter(Boolean);
        if (filterProject) summaries = summaries.filter(s => s.project_id === filterProject);
        if (filterAgent) summaries = summaries.filter(s => s.agent === filterAgent);
        summaries.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        res.json({ conversations: summaries.slice(0, 200) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/conversations/:id', (req, res) => {
    try {
        const filePath = conversationFilePath(req.params.id);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
        const rec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(rec);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/conversations/:id', (req, res) => {
    try {
        const filePath = conversationFilePath(req.params.id);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Drive sync: upload (or update) a .md file per conversation in a dedicated folder
let _convDriveFolderId = null;
async function getOrCreateConvDriveFolder() {
    if (_convDriveFolderId) return _convDriveFolderId;
    if (!loadTokens()) return null;
    const drive = getDrive();
    // Look for existing folder
    const res = await drive.files.list({
        q: `name='Portal-Conversations' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1,
    });
    if (res.data.files.length > 0) {
        _convDriveFolderId = res.data.files[0].id;
        return _convDriveFolderId;
    }
    const created = await drive.files.create({
        requestBody: {
            name: 'Portal-Conversations',
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
    });
    _convDriveFolderId = created.data.id;
    return _convDriveFolderId;
}

const _convDriveFileIds = new Map(); // conv id -> drive file id
const _projectDriveFolderIds = new Map(); // project id -> drive folder id (subfolder of Portal-Conversations)

async function getOrCreateProjectSubfolder(projectId) {
    if (!projectId || projectId === 'default') return await getOrCreateConvDriveFolder();
    if (_projectDriveFolderIds.has(projectId)) return _projectDriveFolderIds.get(projectId);
    const root = await getOrCreateConvDriveFolder();
    if (!root) return null;
    const drive = getDrive();
    const safeName = String(projectId).replace(/'/g, "\\'");
    const list = await drive.files.list({
        q: `name='${safeName}' and '${root}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1,
    });
    let folderId;
    if (list.data.files.length > 0) {
        folderId = list.data.files[0].id;
    } else {
        const created = await drive.files.create({
            requestBody: {
                name: projectId,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [root],
            },
            fields: 'id',
        });
        folderId = created.data.id;
    }
    _projectDriveFolderIds.set(projectId, folderId);
    return folderId;
}

async function syncConversationToDrive(record) {
    if (!loadTokens()) return; // No Drive auth, skip silently
    // Save into a project-specific subfolder for organization
    const folderId = await getOrCreateProjectSubfolder(record.project_id || 'default');
    if (!folderId) return;
    const drive = getDrive();
    const fileName = `${record.id}.md`;
    const content = conversationToMarkdown(record);
    const { Readable } = require('stream');
    const stream = Readable.from(Buffer.from(content, 'utf8'));

    let driveFileId = _convDriveFileIds.get(record.id);
    if (!driveFileId) {
        const res = await drive.files.list({
            q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            pageSize: 1,
        });
        if (res.data.files.length > 0) driveFileId = res.data.files[0].id;
    }

    if (driveFileId) {
        await drive.files.update({
            fileId: driveFileId,
            media: { mimeType: 'text/markdown', body: Readable.from(Buffer.from(content, 'utf8')) },
            fields: 'id',
        });
    } else {
        const created = await drive.files.create({
            requestBody: { name: fileName, parents: [folderId] },
            media: { mimeType: 'text/markdown', body: stream },
            fields: 'id',
        });
        driveFileId = created.data.id;
    }
    _convDriveFileIds.set(record.id, driveFileId);
}

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
