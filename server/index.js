const express = require('express');
const cors = require('cors');
const db = require('./db');
const { exportTXT, exportEPUB, exportPDF, exportMarkdown } = require('./export');
const path = require('path');
const fs = require('fs');
const {
  architectAgent, plannerAgent, composerAgent, writerAgent,
  observerAgent, auditorAgent, reviserAgent, summarizeAgent,
} = require('./agents');
const { analyzeAISmell, fixAISmell, quickAnalyze } = require('./anti-ai');
const { compileStorybible, generateNarrativeBible, chatWithCharacter } = require('./storybible');
const { getProviders, getDefaultConfig } = require('./ai-provider');

const app = express();
app.use(cors({
  origin: function(origin, callback) {
    // Cho phép request không có origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Cho phép tất cả trong giai đoạn dev
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// ====== AI OPTIONS HELPER ======
function getAIOptions(req) {
  return {
    apiKey: req.headers['x-api-key'] || undefined,
    model: req.headers['x-ai-model'] || undefined,
    provider: req.headers['x-ai-provider'] || undefined,
  };
}

// ====== BOOKS ======

app.post('/api/books', (req, res) => {
  const { title, genre, setting, synopsis } = req.body;
  const result = db.prepare('INSERT INTO books (title, genre, setting, synopsis) VALUES (?, ?, ?, ?)').run(title, genre, setting, synopsis);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/books', (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
  res.json(books);
});

app.get('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const plotPoints = db.prepare('SELECT * FROM plot_points WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const storyEvents = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const worldState = db.prepare('SELECT * FROM world_state WHERE book_id = ?').all(req.params.id);
  const agentLogs = db.prepare('SELECT * FROM agent_logs WHERE book_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);
  res.json({ book, characters, chapters, plotPoints, storyEvents, worldState, agentLogs });
});

// ====== CHARACTERS ======

app.post('/api/books/:id/characters', (req, res) => {
  const { name, age, appearance, personality, relationships, backstory } = req.body;
  const result = db.prepare('INSERT INTO characters (book_id, name, age, appearance, personality, relationships, backstory) VALUES (?,?,?,?,?,?,?)').run(req.params.id, name, age, appearance, personality, relationships, backstory);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/characters/:id', (req, res) => {
  const { name, age, appearance, personality, relationships, backstory, status } = req.body;
  db.prepare('UPDATE characters SET name=?, age=?, appearance=?, personality=?, relationships=?, backstory=?, status=? WHERE id=?').run(name, age, appearance, personality, relationships, backstory, status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/characters/:id', (req, res) => {
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ====== PLOT POINTS ======

app.post('/api/books/:id/plot', (req, res) => {
  const { chapter_number, event } = req.body;
  const result = db.prepare('INSERT INTO plot_points (book_id, chapter_number, event) VALUES (?,?,?)').run(req.params.id, chapter_number, event);
  res.json({ id: result.lastInsertRowid });
});

// ====== MULTI-AGENT WRITE ======

app.post('/api/books/:id/write', async (req, res) => {
  const bookId = parseInt(req.params.id);
  const { chapterNumber, instructions } = req.body;
  const aiOpts = getAIOptions(req);

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(bookId);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(bookId);
  const plotPoints = db.prepare('SELECT * FROM plot_points WHERE book_id = ? ORDER BY chapter_number').all(bookId);
  const storyEvents = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(bookId);
  const worldState = db.prepare('SELECT * FROM world_state WHERE book_id = ?').all(bookId);

  const logAgent = (agentName, input, output, duration, status = 'success') => {
    db.prepare('INSERT INTO agent_logs (book_id, chapter_number, agent_name, input_summary, output_summary, duration_ms, status) VALUES (?,?,?,?,?,?,?)').run(bookId, chapterNumber, agentName, input?.substring(0, 200) || '', output?.substring(0, 500) || '', duration, status);
  };

  const progress = [];
  let totalStart = Date.now();

  try {
    // STEP 1: ARCHITECT
    let worldRules = book.world_rules;
    if (!worldRules && chapters.length === 0) {
      progress.push({ agent: 'ARCHITECT', status: 'running' });
      let archResult = await architectAgent(book, characters, aiOpts);
      if (typeof archResult === 'object') archResult = archResult.text;
      worldRules = archResult;
      db.prepare('UPDATE books SET world_rules = ? WHERE id = ?').run(worldRules, bookId);
      book.world_rules = worldRules;
      progress[progress.length - 1].status = 'done';
      logAgent('ARCHITECT', book.title, worldRules, 0);
    }

    // STEP 2: PLANNER
    progress.push({ agent: 'PLANNER', status: 'running' });
    let planResult = await plannerAgent(book, characters, plotPoints, chapters, chapterNumber, aiOpts);
    if (typeof planResult === 'object') planResult = planResult.text;
    progress[progress.length - 1].status = 'done';
    logAgent('PLANNER', `Ch.${chapterNumber}`, planResult, 0);

    // STEP 3: COMPOSER
    progress.push({ agent: 'COMPOSER', status: 'running' });
    let compResult = await composerAgent(book, characters, chapters, storyEvents, worldState, chapterNumber, aiOpts);
    if (typeof compResult === 'object') compResult = compResult.text;
    progress[progress.length - 1].status = 'done';
    logAgent('COMPOSER', `Ch.${chapterNumber}`, compResult, 0);

    // STEP 4: WRITER
    progress.push({ agent: 'WRITER', status: 'running' });
    let content = await writerAgent(book, characters, chapterNumber, planResult, compResult, instructions, aiOpts);
    if (typeof content === 'object') content = content.text;
    progress[progress.length - 1].status = 'done';
    logAgent('WRITER', `Ch.${chapterNumber}`, content.substring(0, 200), 0);

    // STEP 5: OBSERVER
    progress.push({ agent: 'OBSERVER', status: 'running' });
    let observerResult;
    try {
      observerResult = await observerAgent(book, characters, content, chapterNumber, aiOpts);
      if (typeof observerResult === 'object') observerResult = observerResult.text;
      try {
        const jsonMatch = observerResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.events) {
            for (const evt of data.events) {
              db.prepare('INSERT INTO story_events (book_id, chapter_number, event_type, description, character_involved, location, importance) VALUES (?,?,?,?,?,?,?)').run(bookId, chapterNumber, evt.type, evt.description, (evt.characters || []).join(', '), evt.location || '', evt.importance || 'normal');
            }
          }
          if (data.character_changes) {
            for (const change of data.character_changes) {
              if (change.new_status) {
                const char = characters.find(c => c.name === change.name);
                if (char) db.prepare('UPDATE characters SET status = ? WHERE id = ?').run(change.new_status, char.id);
              }
            }
          }
          if (data.new_characters) {
            for (const nc of data.new_characters) {
              const existing = characters.find(c => c.name === nc.name);
              if (!existing) {
                db.prepare('INSERT INTO characters (book_id, name, personality, first_appearance, notes) VALUES (?,?,?,?,?)').run(bookId, nc.name, nc.description, chapterNumber, 'Tự động tạo bởi Observer');
              }
            }
          }
          if (data.world_updates) {
            for (const wu of data.world_updates) {
              const existing = db.prepare('SELECT id FROM world_state WHERE book_id = ? AND entity_name = ? AND state_key = ?').get(bookId, wu.entity_name, wu.key);
              if (existing) {
                db.prepare('UPDATE world_state SET state_value = ?, updated_chapter = ? WHERE id = ?').run(wu.value, chapterNumber, existing.id);
              } else {
                db.prepare('INSERT INTO world_state (book_id, entity_type, entity_name, state_key, state_value, updated_chapter) VALUES (?,?,?,?,?,?)').run(bookId, wu.entity_type, wu.entity_name, wu.key, wu.value, chapterNumber);
              }
            }
          }
        }
      } catch (parseErr) {
        console.log('  ⚠️ Observer JSON parse error');
      }
    } catch (err) {
      observerResult = 'Observer skipped: ' + err.message;
    }
    progress[progress.length - 1].status = 'done';
    logAgent('OBSERVER', `Ch.${chapterNumber}`, (observerResult || '').substring(0, 200), 0);

    // STEP 6: AUDITOR
    progress.push({ agent: 'AUDITOR', status: 'running' });
    const updatedCharacters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(bookId);
    const updatedEvents = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(bookId);
    let auditResult = await auditorAgent(book, updatedCharacters, content, chapterNumber, updatedEvents, aiOpts);
    if (typeof auditResult === 'object') auditResult = auditResult.text;
    progress[progress.length - 1].status = 'done';
    logAgent('AUDITOR', `Ch.${chapterNumber}`, auditResult.substring(0, 200), 0);

    const scoreMatch = auditResult.match(/(\d+)\s*\/\s*100/);
    const consistencyScore = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    // STEP 7: REVISER
    let finalContent = content;
    if (auditResult.includes('REVISE') || consistencyScore < 70) {
      progress.push({ agent: 'REVISER', status: 'running' });
      let revisedContent = await reviserAgent(book, updatedCharacters, content, auditResult, chapterNumber, aiOpts);
      if (typeof revisedContent === 'object') revisedContent = revisedContent.text;
      finalContent = revisedContent;
      progress[progress.length - 1].status = 'done';
      logAgent('REVISER', `Ch.${chapterNumber}`, finalContent.substring(0, 200), 0);
    }

    // STEP 8: SUMMARIZE
    progress.push({ agent: 'SUMMARIZE', status: 'running' });
    let summary = await summarizeAgent(finalContent, chapterNumber, aiOpts);
    if (typeof summary === 'object') summary = summary.text;
    progress[progress.length - 1].status = 'done';

    // SAVE
    const result = db.prepare('INSERT INTO chapters (book_id, chapter_number, title, content, summary, draft, consistency_score) VALUES (?,?,?,?,?,?,?)').run(bookId, chapterNumber, `Chương ${chapterNumber}`, finalContent, summary, content, consistencyScore);

    const totalTime = ((Date.now() - totalStart) / 1000).toFixed(1);
    res.json({ id: result.lastInsertRowid, content: finalContent, summary, consistencyScore, auditResult, progress, totalTime });

  } catch (error) {
    console.error('Pipeline error:', error.message);
    res.status(500).json({ error: error.message, progress });
  }
});

// ====== CHAPTERS ======

app.put('/api/chapters/:id', (req, res) => {
  const { title, content, summary } = req.body;
  db.prepare('UPDATE chapters SET title=?, content=?, summary=? WHERE id=?').run(title, content, summary, req.params.id);
  res.json({ success: true });
});

app.delete('/api/chapters/:id', (req, res) => {
  const chapterId = parseInt(req.params.id);
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId);
  if (!chapter) return res.status(404).json({ error: 'Không tìm thấy chương' });
  db.prepare('DELETE FROM story_events WHERE book_id = ? AND chapter_number = ?').run(chapter.book_id, chapter.chapter_number);
  db.prepare('DELETE FROM agent_logs WHERE book_id = ? AND chapter_number = ?').run(chapter.book_id, chapter.chapter_number);
  db.prepare('DELETE FROM chapters WHERE id = ?').run(chapterId);
  res.json({ success: true, deleted: chapter.chapter_number });
});

// ====== AGENT LOGS ======

app.get('/api/books/:id/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM agent_logs WHERE book_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
  res.json(logs);
});

// ====== MEMORY ENGINE — EVENTS ======

app.get('/api/books/:id/events', (req, res) => {
  const events = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number DESC, id DESC').all(req.params.id);
  res.json(events);
});

app.post('/api/books/:id/events', (req, res) => {
  const { chapter_number, event_type, description, character_involved, location, importance } = req.body;
  const result = db.prepare('INSERT INTO story_events (book_id, chapter_number, event_type, description, character_involved, location, importance) VALUES (?,?,?,?,?,?,?)').run(req.params.id, chapter_number, event_type, description, character_involved, location, importance || 'normal');
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/events/:id', (req, res) => {
  const { description, event_type, importance, character_involved, location } = req.body;
  db.prepare('UPDATE story_events SET description=?, event_type=?, importance=?, character_involved=?, location=? WHERE id=?').run(description, event_type, importance, character_involved, location, req.params.id);
  res.json({ success: true });
});

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM story_events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ====== MEMORY ENGINE — WORLD STATE ======

app.get('/api/books/:id/world-state', (req, res) => {
  const state = db.prepare('SELECT * FROM world_state WHERE book_id = ? ORDER BY entity_type, entity_name').all(req.params.id);
  res.json(state);
});

app.post('/api/books/:id/world-state', (req, res) => {
  const { entity_type, entity_name, state_key, state_value } = req.body;
  const result = db.prepare('INSERT INTO world_state (book_id, entity_type, entity_name, state_key, state_value, updated_chapter) VALUES (?,?,?,?,?,?)').run(req.params.id, entity_type, entity_name, state_key, state_value, 0);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/world-state/:id', (req, res) => {
  const { state_value, entity_type, entity_name, state_key } = req.body;
  db.prepare('UPDATE world_state SET state_value=?, entity_type=?, entity_name=?, state_key=? WHERE id=?').run(state_value, entity_type, entity_name, state_key, req.params.id);
  res.json({ success: true });
});

app.delete('/api/world-state/:id', (req, res) => {
  db.prepare('DELETE FROM world_state WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ====== MEMORY ENGINE — CHARACTER TIMELINE ======

app.get('/api/books/:id/character-timeline', (req, res) => {
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(req.params.id);
  const events = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const timeline = {};
  characters.forEach(c => { timeline[c.name] = { info: c, appearances: [], changes: [] }; });
  events.forEach(evt => {
    const involved = (evt.character_involved || '').split(',').map(s => s.trim()).filter(Boolean);
    involved.forEach(name => { if (timeline[name]) timeline[name].appearances.push(evt); });
    if (['death', 'injury', 'status_change'].includes(evt.event_type)) {
      involved.forEach(name => { if (timeline[name]) timeline[name].changes.push(evt); });
    }
  });
  res.json(timeline);
});

// ====== ANTI-AI SMELL ======

app.post('/api/anti-ai/quick', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const result = quickAnalyze(text);
  res.json(result);
});

app.post('/api/anti-ai/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const result = await analyzeAISmell(text, getAIOptions(req));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/anti-ai/fix', async (req, res) => {
  const { text, issues } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const fixed = await fixAISmell(text, issues || [], getAIOptions(req));
    res.json({ fixed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chapters/:id/anti-ai', async (req, res) => {
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Không tìm thấy chương' });
  try {
    const quick = quickAnalyze(chapter.content);
    const detailed = await analyzeAISmell(chapter.content, getAIOptions(req));
    res.json({ quick, detailed, chapterId: chapter.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chapters/:id/fix-ai', async (req, res) => {
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Không tìm thấy chương' });
  try {
    const aiOpts = getAIOptions(req);
    const analysis = await analyzeAISmell(chapter.content, aiOpts);
    const highIssues = analysis.issues.filter(i => i.severity === 'high' || i.severity === 'medium');
    if (highIssues.length === 0) return res.json({ fixed: chapter.content, message: 'Không phát hiện vấn đề nghiêm trọng' });
    const fixed = await fixAISmell(chapter.content, highIssues, aiOpts);
    res.json({ fixed, issues: highIssues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== EXPORT ======

app.get('/api/books/:id/export/formats', (req, res) => {
  res.json([
    { format: 'txt', label: 'TXT', icon: '📄', ext: '.txt' },
    { format: 'epub', label: 'EPUB', icon: '📗', ext: '.epub' },
    { format: 'pdf', label: 'PDF', icon: '📕', ext: '.pdf' },
    { format: 'markdown', label: 'Markdown', icon: '📝', ext: '.md' },
  ]);
});

app.get('/api/books/:id/export/txt', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  if (chapters.length === 0) return res.status(400).json({ error: 'Chưa có chương' });
  const text = exportTXT(book, chapters);
  const filename = `${book.title.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')}.txt`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(text);
});

app.get('/api/books/:id/export/epub', async (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  if (chapters.length === 0) return res.status(400).json({ error: 'Chưa có chương' });
  const filename = `${book.title.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')}.epub`;
  const outputPath = path.join(__dirname, 'exports', filename);
  if (!fs.existsSync(path.join(__dirname, 'exports'))) fs.mkdirSync(path.join(__dirname, 'exports'));
  try {
    await exportEPUB(book, chapters, outputPath);
    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => { setTimeout(() => fs.unlink(outputPath, () => {}), 5000); });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo EPUB: ' + err.message });
  }
});

app.get('/api/books/:id/export/pdf', async (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  if (chapters.length === 0) return res.status(400).json({ error: 'Chưa có chương' });
  const filename = `${book.title.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')}.pdf`;
  const outputPath = path.join(__dirname, 'exports', filename);
  if (!fs.existsSync(path.join(__dirname, 'exports'))) fs.mkdirSync(path.join(__dirname, 'exports'));
  try {
    await exportPDF(book, chapters, outputPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => { setTimeout(() => fs.unlink(outputPath, () => {}), 5000); });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo PDF: ' + err.message });
  }
});

app.get('/api/books/:id/export/markdown', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  if (chapters.length === 0) return res.status(400).json({ error: 'Chưa có chương' });
  const md = exportMarkdown(book, chapters);
  const filename = `${book.title.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_')}.md`;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(md);
});

// ====== REVISION STUDIO ======

app.get('/api/books/:id/chapters', (req, res) => {
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const enriched = chapters.map(ch => ({
    ...ch,
    word_count: (ch.content || '').split(/\s+/).filter(Boolean).length,
    char_count: (ch.content || '').length,
    para_count: (ch.content || '').split('\n').filter(p => p.trim()).length,
    has_draft: !!(ch.draft && ch.draft !== ch.content),
  }));
  res.json(enriched);
});

app.post('/api/chapters/:id/revise', async (req, res) => {
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Không tìm thấy chương' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(chapter.book_id);
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(chapter.book_id);
  const events = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(chapter.book_id);
  const aiOpts = getAIOptions(req);

  try {
    let auditResult = await auditorAgent(book, characters, chapter.content, chapter.chapter_number, events, aiOpts);
    if (typeof auditResult === 'object') auditResult = auditResult.text;
    const scoreMatch = auditResult.match(/(\d+)\s*\/\s*100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    let revised = chapter.content;
    if (auditResult.includes('REVISE') || score < 75) {
      let result = await reviserAgent(book, characters, chapter.content, auditResult, chapter.chapter_number, aiOpts);
      if (typeof result === 'object') result = result.text;
      revised = result;
    }
    res.json({ original: chapter.content, revised, auditResult, score, wasRevised: revised !== chapter.content });
  } catch (err) {
    console.error('Revision error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====== STORYBIBLE ======

app.get('/api/books/:id/storybible', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const plotPoints = db.prepare('SELECT * FROM plot_points WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const storyEvents = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const worldState = db.prepare('SELECT * FROM world_state WHERE book_id = ?').all(req.params.id);
  const data = compileStorybible(book, characters, chapters, plotPoints, storyEvents, worldState);
  res.json(data);
});

app.post('/api/books/:id/storybible/generate', async (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  const characters = db.prepare('SELECT * FROM characters WHERE book_id = ?').all(req.params.id);
  const chapters = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const plotPoints = db.prepare('SELECT * FROM plot_points WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const storyEvents = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number').all(req.params.id);
  const worldState = db.prepare('SELECT * FROM world_state WHERE book_id = ?').all(req.params.id);
  try {
    const data = compileStorybible(book, characters, chapters, plotPoints, storyEvents, worldState);
    const narrative = await generateNarrativeBible(data, getAIOptions(req));
    res.json({ narrative, data });
  } catch (err) {
    console.error('Storybible error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====== AI CHAT ======

app.post('/api/books/:id/chat', async (req, res) => {
  const { characterName, message, chatHistory } = req.body;
  if (!characterName || !message) return res.status(400).json({ error: 'Thiếu thông tin' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Không tìm thấy' });
  const character = db.prepare('SELECT * FROM characters WHERE book_id = ? AND name = ?').get(req.params.id, characterName);
  if (!character) return res.status(404).json({ error: 'Không tìm thấy nhân vật' });
  const events = db.prepare('SELECT * FROM story_events WHERE book_id = ? ORDER BY chapter_number DESC LIMIT 10').all(req.params.id);
  const storyContext = events.map(e => `Ch.${e.chapter_number}: ${e.description}`).join('; ');
  try {
    const reply = await chatWithCharacter(character, book, chatHistory || [], message, storyContext, getAIOptions(req));
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====== SETTINGS / PROVIDERS ======

app.get('/api/providers', (req, res) => {
  res.json(getProviders());
});

app.get('/api/config/check', (req, res) => {
  res.json(getDefaultConfig());
});

// ====== SERVE REACT CLIENT (BUILD) ======
// Phục vụ file tĩnh của React sau khi đã build (client/build)
app.use(express.static(path.join(__dirname, '../client/build')));

// Mọi route KHÔNG bắt đầu bằng /api sẽ trả về index.html của React
// để React Router xử lý phía client (SPA fallback)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ====== START SERVER ======

const PORT = process.env.PORT || 4000;
const keepAlive = require('./keep-alive');
keepAlive();
app.listen(PORT, () => {
  console.log(`\n🚀 Novel AI Server — Multi-Agent System`);
  console.log(`📡 Running at http://localhost:${PORT}\n`);
});