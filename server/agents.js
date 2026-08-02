const { callAI } = require('./ai-provider');

async function architectAgent(book, characters, options = {}) {
  console.log('\n🏗️  [ARCHITECT] Phân tích cấu trúc thế giới...');
  const prompt = `Bạn là nhà văn chuyên phân tích thế giới tiểu thuyết.

=== THÔNG TIN TRUYỆN ===
Tiêu đề: ${book.title}
Thể loại: ${book.genre}
Bối cảnh: ${book.setting || 'Chưa rõ'}
Tóm tắt: ${book.synopsis || 'Chưa có'}

=== NHÂN VẬT ===
${characters.map(c => `- ${c.name}: ${c.personality || ''} ${c.backstory || ''}`).join('\n') || 'Chưa có nhân vật'}

=== NHIỆM VỤ ===
Phân tích và tạo bộ quy tắc thế giới:
1. Hệ thống sức mạnh/luật lệ
2. Bối cảnh địa lý, thời gian
3. Xã hội, phe phái
4. Giới hạn và quy tắc
5. Tone/mood

Viết bằng tiếng Việt. Chi tiết nhưng ngắn gọn.`;
  return await callAI(prompt, 4000, 0.6, options);
}

async function plannerAgent(book, characters, plotPoints, chapters, chapterNumber, options = {}) {
  console.log('\n📋 [PLANNER] Lên kế hoạch chương...');
  const prompt = `Bạn là nhà văn lập kế hoạch chương.

=== TRUYỆN ===
${book.title} — ${book.genre}
Quy tắc: ${book.world_rules || 'Chưa có'}

=== NHÂN VẬT ===
${characters.map(c => `- ${c.name}: ${c.personality || ''} (${c.status || 'alive'})`).join('\n') || 'Chưa có'}

=== DÀN Ý ===
${plotPoints.map(p => `Ch.${p.chapter_number}: ${p.event}`).join('\n') || 'Chưa có'}

=== CHƯƠNG ĐÃ VIẾT ===
${chapters.map(ch => `Ch.${ch.chapter_number}: ${ch.title}`).join('\n') || 'Chưa có'}

Lên kế hoạch CHƯƠNG ${chapterNumber}:
1. Mở đầu (cách bắt đầu)
2. Diễn biến chính (3-5 sự kiện)
3. Nhân vật xuất hiện
4. Xung đột/thử thách
5. Kết thúc (hook/cliffhanger)
6. Tâm lý nhân vật

Viết bằng tiếng Việt. Chi tiết.`;
  return await callAI(prompt, 4000, 0.7, options);
}

async function composerAgent(book, characters, chapters, storyEvents, worldState, chapterNumber, options = {}) {
  console.log('\n🎵 [COMPOSER] Tổng hợp ngữ cảnh...');
  const prompt = `Bạn là nhà phân tích ngữ cảnh truyện.

=== TRUYỆN ===
${book.title} — ${book.genre}
Quy tắc: ${book.world_rules || 'Chưa có'}

=== NHÂN VẬT ===
${characters.map(c => `- ${c.name} (${c.status || 'alive'}): ${c.personality || ''}`).join('\n') || 'Chưa có'}

=== SỰ KIỆN ===
${storyEvents.slice(-10).map(e => `Ch.${e.chapter_number} [${e.event_type}]: ${e.description}`).join('\n') || 'Chưa có'}

=== THẾ GIỚI ===
${worldState.map(w => `${w.entity_name} — ${w.state_key}: ${w.state_value}`).join('\n') || 'Chưa có'}

=== CHƯƠNG TRƯỚC ===
${chapters.length > 0 ? `Ch.${chapters[chapters.length - 1].chapter_number}: ${chapters[chapters.length - 1].title}` : 'Không có'}

Tạo BỐI CẢNH cho chương ${chapterNumber}:
1. Nhân vật cần xuất hiện
2. Địa điểm phù hợp
3. Mâu thuẫn từ chương trước
4. Mood/tone
5. Chi tiết cần nhớ

Viết bằng tiếng Việt.`;
  return await callAI(prompt, 4000, 0.5, options);
}

async function writerAgent(book, characters, chapterNumber, plan, context, instructions, options = {}) {
  console.log('\n✍️  [WRITER] Đang viết chương...');
  const prompt = `Bạn là nhà văn tiểu thuyết tiếng Việt.

=== TRUYỆN ===
${book.title} — ${book.genre}
${book.world_rules ? `Quy tắc: ${book.world_rules}` : ''}

=== NHÂN VẬT ===
${characters.map(c => `- ${c.name}: ${c.appearance || ''} | ${c.personality || ''}`).join('\n') || ''}

=== KẾ HOẠCH CHƯƠNG ${chapterNumber} ===
${plan || 'Không có kế hoạch'}

=== NGỮ CẢNH ===
${context || 'Không có ngữ cảnh'}

${instructions ? `=== YÊU CẦU ===\n${instructions}` : ''}

Viết CHƯƠNG ${chapterNumber} hoàn chỉnh:
- Tiếng Việt tự nhiên, giàu hình ảnh
- Show don't tell, câu ngắn xen dài
- Hội thoại tự nhiên, nhân vật đúng tính cách
- KHÔNG dùng: "Điều đáng nói", "Thật vậy", "Không thể phủ nhận"
- Tối thiểu 2000 từ

Viết ngay, KHÔNG giải thích.`;
  return await callAI(prompt, 8000, 0.8, options);
}

async function observerAgent(book, characters, content, chapterNumber, options = {}) {
  console.log('\n👁️  [OBSERVER] Phân tích sự kiện...');
  const prompt = `Phân tích chương và trả JSON:

CHƯƠNG ${chapterNumber}:
${content}

NHÂN VẬT: ${characters.map(c => `${c.name}(${c.status || 'alive'})`).join(', ')}

Trả JSON:
{
  "events": [{"type":"character_action|plot_development|conflict|death|meeting", "description":"...", "characters":[""], "location":"", "importance":"normal|high"}],
  "character_changes": [{"name":"", "new_status":"alive|dead|injured"}],
  "new_characters": [{"name":"", "description":""}],
  "world_updates": [{"entity_type":"location|item|faction", "entity_name":"", "key":"", "value":""}]
}

Chỉ JSON.`;
  return await callAI(prompt, 4000, 0.3, options);
}

async function auditorAgent(book, characters, content, chapterNumber, storyEvents, options = {}) {
  console.log('\n🔍 [AUDITOR] Đánh giá chất lượng...');
  const prompt = `Đánh giá chương (thang 100đ):

TRUYỆN: ${book.title} — ${book.genre}
NHÂN VẬT: ${characters.map(c => `${c.name}(${c.status || 'alive'}): ${c.personality || ''}`).join('\n')}
SỰ KIỆN TRƯỚC: ${storyEvents?.slice(-10).map(e => `Ch.${e.chapter_number}: ${e.description}`).join('\n') || 'Không có'}

CHƯƠNG:
${content}

Đánh giá:
- Nhất quán nhân vật (25đ)
- Phát triển cốt truyện (25đ)
- Chất lượng văn phong (20đ)
- Hội thoại tự nhiên (15đ)
- Show don't tell (15đ)

Trả: Điểm/100, Lỗi, APPROVE hoặc REVISE, Chi tiết sửa.`;
  return await callAI(prompt, 4000, 0.4, options);
}

async function reviserAgent(book, characters, content, auditResult, chapterNumber, options = {}) {
  console.log('\n🔧 [REVISER] Sửa chữa chương...');
  const prompt = `Sửa chương theo góp ý:

TRUYỆN: ${book.title} — ${book.genre}
NHÂN VẬT: ${characters.map(c => `${c.name}: ${c.personality || ''}`).join('\n')}

CHƯƠNG GỐC:
${content}

ĐÁNH GIÁ:
${auditResult}

Sửa: nhất quán nhân vật, hội thoại, show don't tell, từ lặp, văn phong.
Giữ nguyên cốt truyện. Trả TOÀN BỘ chương đã sửa.`;
  return await callAI(prompt, 8000, 0.7, options);
}

async function summarizeAgent(content, chapterNumber, options = {}) {
  console.log('\n📝 [SUMMARIZE] Tóm tắt chương...');
  const prompt = `Tóm tắt chương sau trong 2-3 câu tiếng Việt:\n\n${content}\n\nChỉ tóm tắt.`;
  return await callAI(prompt, 500, 0.4, options);
}

module.exports = {
  architectAgent, plannerAgent, composerAgent, writerAgent,
  observerAgent, auditorAgent, reviserAgent, summarizeAgent,
};