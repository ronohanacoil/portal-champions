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

// ----- Chat Endpoint -----
// General-purpose Claude system prompt (for "Claude" agent - no accounting specifics)
const GENERAL_CLAUDE_PROMPT = `You are Claude, a fully-capable AI agent for Ron Ohana — the same Claude that runs in Cowork. You can do anything Ron throws at you.

# Your toolbox

## Sandbox tools (your scratch space is /app/work/)
- **bash**: Run shell commands. Network is allowed. Use this for scripts, data processing, installing packages with npm/pip, running Python/Node code, anything you'd run in a terminal.
- **read_local_file / write_local_file / edit_local_file / list_local_dir**: Standard file operations in the sandbox.
- **web_fetch**: Fetch any public URL — web pages, APIs, raw files. Returns text or info about binary.

## Google Drive tools (Ron's actual files)
- find_folder, list_folder_contents, read_pdf_invoice, read_xlsx, write_xlsx_row, rename_file, create_folder, copy_drive_file, reset_yearly_xlsx
- Use these when Ron asks about files in his Drive (חשבונאות, חשבוניות, אקסל, etc.).

## Vision
- Ron can upload images directly into the chat. They arrive as image content blocks. Look at them carefully and describe / use what you see.

# How to work

- Be proactive. Don't ask permission to use a tool when the path is obvious — just do it and report results.
- For multi-step tasks: think step by step, run tools, show intermediate progress, then summarize.
- When writing code or files: actually create them with write_local_file or bash, don't just paste them in the chat.
- For long/expensive operations: keep Ron in the loop with short status updates between tool calls.

# Style

- Hebrew is Ron's primary language. Respond in Hebrew unless he writes to you in another language.
- Be warm but precise. No fluff, no apologies, no over-formatting.
- Use Markdown freely: code blocks for code, lists when they help, **bold** for emphasis.
- Push back when you disagree, ask clarifying questions only when truly stuck.
- Treat Ron like a smart business partner who can handle the truth.`;

// Pick the right tool set for the agent type
function getToolsForAgent(agentType) {
    if (agentType === 'claude') {
        // Claude gets ALL tools - Cowork-like full capability
        return [...AGENT_TOOLS, ...CLAUDE_EXTRA_TOOLS];
    }
    return AGENT_TOOLS;
}

// Pick the right system prompt
async function getSystemPromptForAgent(agentType) {
    if (agentType === 'claude') return GENERAL_CLAUDE_PROMPT;
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

        // Run agent loop
        let conversation = [...messages];
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

        let conversation = [...messages];
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
