const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.MISTRAL_API_KEY;

async function callAI(prompt, maxTokens = 4000, temperature = 0.5) {
  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 180000,
    }
  );
  return response.data.choices[0].message.content;
}

// ====== COMPILE STORYBIBLE ======
function compileStorybible(book, characters, chapters, plotPoints, storyEvents, worldState) {
  let sb = {};

  // 1. World
  sb.world = {
    title: book.title,
    genre: book.genre,
    setting: book.setting,
    synopsis: book.synopsis,
    world_rules: book.world_rules,
  };

  // 2. Characters
  sb.characters = characters.map(c => ({
    name: c.name,
    age: c.age,
    appearance: c.appearance,
    personality: c.personality,
    relationships: c.relationships,
    backstory: c.backstory,
    status: c.status,
    first_appearance: c.first_appearance,
  }));

  // 3. Plot
  sb.plot_points = plotPoints.map(p => ({
    chapter: p.chapter_number,
    event: p.event,
  }));

  // 4. Events
  sb.story_events = storyEvents.map(e => ({
    chapter: e.chapter_number,
    type: e.event_type,
    description: e.description,
    characters: e.character_involved,
    location: e.location,
    importance: e.importance,
  }));

  // 5. World State
  sb.world_state = worldState.map(w => ({
    type: w.entity_type,
    name: w.entity_name,
    key: w.state_key,
    value: w.state_value,
    updated_chapter: w.updated_chapter,
  }));

  // 6. Chapter summaries
  sb.chapters = chapters.map(ch => ({
    number: ch.chapter_number,
    title: ch.title,
    summary: ch.summary,
    score: ch.consistency_score,
  }));

  return sb;
}

// ====== GENERATE NARRATIVE BIBLE ======
async function generateNarrativeBible(storybibleData) {
  const prompt = `Bạn là biên tập viên chuyên nghiệp. Dựa trên dữ liệu sau, tạo một "KINH THÁNH TRUYỆN" (Story Bible) hoàn chỉnh bằng tiếng Việt.

=== DỮ LIỆU ===
${JSON.stringify(storybibleData, null, 2)}

=== YÊU CẦU ===
Viết một tài liệu hoàn chỉnh gồm các phần:

## 1. TỔNG QUAN THẾ GIỚI
Mô tả ngắn gọn về thế giới, bối cảnh, thể loại, không khí chung.

## 2. HỆ THỐNG QUY TẮC
Các quy tắc của thế giới (phép thuật, công nghệ, xã hội...).

## 3. BỐI CẢNH ĐỊA LÝ
Các địa điểm quan trọng, mô tả ngắn gọn.

## 4. NHÂN VẬT
Mỗi nhân vật một mục: tên, vai trò, tính năng, ngoại hình, mối quan hệ, trạng thái hiện tại.

## 5. DÒNG THỜI GIAN SỰ KIỆN
Các sự kiện quan trọng theo thứ tự chương.

## 6. CỐT TRUYỆN CHÍNH
Tóm tắt mạch truyện qua các chương.

## 7. CHỦ ĐỀ VÀ THÔNG ĐIỆP
Chủ đề chính của truyện.

## 8. GHI CHÚ CHO TÁC GIẢ
Những lưu ý quan trọng khi viết tiếp.

Viết bằng tiếng Việt, giọng văn chuyên nghiệp nhưng dễ đọc. Dùng markdown formatting.`;

  return await callAI(prompt, 6000, 0.5);
}

// ====== CHAT WITH CHARACTER ======
async function chatWithCharacter(character, book, chatHistory, userMessage, storyContext) {
  const systemContext = `Bạn là nhân vật "${character.name}" trong tiểu thuyết "${book.title}".

=== THÔNG TIN NHÂN VẬT ===
Tên: ${character.name}
Tuổi: ${character.age || 'Không rõ'}
Ngoại hình: ${character.appearance || 'Không rõ'}
Tính cách: ${character.personality || 'Không rõ'}
Mối quan hệ: ${character.relationships || 'Không rõ'}
Tiểu sử: ${character.backstory || 'Không rõ'}
Trạng thái: ${character.status || 'alive'}

=== BỐI CẢNH TRUYỆN ===
Thể loại: ${book.genre}
Bối cảnh: ${book.setting || 'Không rõ'}
Quy tắc thế giới: ${book.world_rules || 'Không rõ'}
${storyContext ? `\nSự kiện gần đây: ${storyContext}` : ''}

=== QUY TẮC ===
1. LUÔN trả lời với tư cách là nhân vật ${character.name}
2. Giữ tính cách nhất quán với mô tả ở trên
3. Sử dụng ngôn ngữ, cách nói chuyện phù hợp với nhân vật
4. Có thể đề cập đến sự kiện trong truyện
5. Trả lời bằng tiếng Việt
6. Giữ câu trả lời ngắn gọn (100-300 từ)
7. KHÔNG phá vỡ nhân vật, KHÔNG nói mình là AI`;

  const messages = [
    { role: 'system', content: systemContext },
  ];

  // Thêm lịch sử chat
  for (const msg of chatHistory.slice(-10)) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: 'mistral-small-latest',
      messages,
      max_tokens: 1000,
      temperature: 0.8,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = { compileStorybible, generateNarrativeBible, chatWithCharacter };