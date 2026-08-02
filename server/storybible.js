const { callAI } = require('./ai-provider');

function compileStorybible(book, characters, chapters, plotPoints, storyEvents, worldState) {
  return {
    world: { title: book.title, genre: book.genre, setting: book.setting, synopsis: book.synopsis, world_rules: book.world_rules },
    characters: characters.map(c => ({
      name: c.name, age: c.age, appearance: c.appearance, personality: c.personality,
      relationships: c.relationships, backstory: c.backstory, status: c.status, first_appearance: c.first_appearance,
    })),
    plot_points: plotPoints.map(p => ({ chapter: p.chapter_number, event: p.event })),
    story_events: storyEvents.map(e => ({
      chapter: e.chapter_number, type: e.event_type, description: e.description,
      characters: e.character_involved, location: e.location, importance: e.importance,
    })),
    world_state: worldState.map(w => ({
      type: w.entity_type, name: w.entity_name, key: w.state_key,
      value: w.state_value, updated_chapter: w.updated_chapter,
    })),
    chapters: chapters.map(ch => ({
      number: ch.chapter_number, title: ch.title, summary: ch.summary, score: ch.consistency_score,
    })),
  };
}

async function generateNarrativeBible(storybibleData, options = {}) {
  const prompt = `Bạn là biên tập viên chuyên nghiệp. Tạo "CẨM NANG" cho tác giả bằng tiếng Việt.

DỮ LIỆU:
${JSON.stringify(storybibleData, null, 2)}

Viết tài liệu gồm:
## 1. TỔNG QUAN THẾ GIỚI
## 2. HỆ THỐNG QUY TẮC
## 3. BỐI CẢNH ĐỊA LÝ
## 4. NHÂN VẬT
## 5. DÒNG THỜI GIAN SỰ KIỆN
## 6. CỐT TRUYỆN CHÍNH
## 7. CHỦ ĐỀ VÀ THÔNG ĐIỆP
## 8. GHI CHÚ CHO TÁC GIẢ

Markdown formatting, tiếng Việt chuyên nghiệp.`;
  return await callAI(prompt, 6000, 0.5, options);
}

async function chatWithCharacter(character, book, chatHistory, userMessage, storyContext, options = {}) {
  const systemContext = `Bạn là nhân vật "${character.name}" trong "${book.title}".
Tên: ${character.name}. Tuổi: ${character.age || '?'}. Ngoại hình: ${character.appearance || '?'}. Tính cách: ${character.personality || '?'}. Quan hệ: ${character.relationships || '?'}. Tiểu sử: ${character.backstory || '?'}. Trạng thái: ${character.status || 'alive'}.
Truyện: ${book.genre}. Bối cảnh: ${book.setting || '?'}. ${storyContext ? `Sự kiện gần: ${storyContext}` : ''}
Quy tắc: LUÔN trả lời là ${character.name}. Nhất quán tính cách. Tiếng Việt. 100-300 từ. KHÔNG phá vai.

Lịch sử chat:
${chatHistory.slice(-10).map(m => `${m.role === 'user' ? 'Người đọc' : character.name}: ${m.content}`).join('\n')}

Người đọc hỏi: ${userMessage}

${character.name} trả lời:`;
  return await callAI(systemContext, 1000, 0.8, options);
}

module.exports = { compileStorybible, generateNarrativeBible, chatWithCharacter };