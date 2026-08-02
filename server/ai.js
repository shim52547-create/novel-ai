const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.MISTRAL_API_KEY;

async function callAI(prompt) {
  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8000,
        temperature: 0.8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI Error:', error.response?.data || error.message);
    throw error;
  }
}

function buildContext(book, characters, chapters, plotPoints) {
  let context = `=== THÔNG TIN TRUYỆN ===\n`;
  context += `Tên truyện: ${book.title}\n`;
  context += `Thể loại: ${book.genre}\n`;
  context += `Bối cảnh: ${book.setting}\n`;
  context += `Tóm tắt: ${book.synopsis}\n\n`;

  context += `=== NHÂN VẬT ===\n`;
  characters.forEach(c => {
    context += `${c.name}:\n`;
    context += `  Tuổi: ${c.age}\n`;
    context += `  Ngoại hình: ${c.appearance}\n`;
    context += `  Tính cách: ${c.personality}\n`;
    context += `  Quan hệ: ${c.relationships}\n`;
    context += `  Quá khứ: ${c.backstory}\n`;
    context += `  Trạng thái: ${c.status}\n\n`;
  });

  context += `=== KẾ HOẠCH CỐT TRUYỆN ===\n`;
  plotPoints.forEach(p => {
    context += `Chương ${p.chapter_number}: ${p.event} [${p.status}]\n`;
  });
  context += `\n`;

  context += `=== TÓM TẮT CÁC CHƯƠNG ĐÃ VIẾT ===\n`;
  chapters.forEach(ch => {
    context += `Chương ${ch.chapter_number} - ${ch.title}: ${ch.summary}\n`;
  });

  return context;
}

async function writeChapter(book, characters, chapters, plotPoints, chapterNumber, instructions) {
  const context = buildContext(book, characters, chapters, plotPoints);
  const recentChapters = chapters.slice(-2);
  let recentContent = '';
  recentChapters.forEach(ch => {
    recentContent += `\n=== CHƯƠNG ${ch.chapter_number} ===\n${ch.content}\n`;
  });

  const prompt = `${context}

=== NHIỆM VỤ ===
Viết chương ${chapterNumber}.
${recentContent ? `\nNội dung 2 chương gần nhất:\n${recentContent}\n` : ''}
${instructions ? `\nYêu cầu đặc biệt: ${instructions}\n` : ''}

QUY TẮC:
1. Giữ tính cách nhân vật nhất quán
2. Không mâu thuẫn với các chương trước
3. Tuân theo kế hoạch cốt truyện
4. Viết bằng tiếng Việt, văn phong tự nhiên
5. Không tóm tắt — viết đầy đủ cảnh truyện
6. Mỗi chương khoảng 2000-3000 từ

Bắt đầu viết:`;

  return await callAI(prompt);
}

async function checkConsistency(book, characters, newContent, chapterNumber) {
  const context = buildContext(book, characters, [], []);
  const prompt = `${context}

=== NỘI DUNG CHƯƠNG MỚI ===
${newContent}

Kiểm tra tính nhất quán của chương ${chapterNumber}:
1. Nhân vật đã chết mà vẫn xuất hiện?
2. Tính cách nhân vật có lệch?
3. Mâu thuẫn cốt truyện?
4. Lỗi logic?
5. Từ/câu trúc lặp quá nhiều?

Trả lời: "PASS" nếu OK, hoặc liệt kê vấn đề.`;

  return await callAI(prompt);
}

async function summarizeChapter(content, chapterNumber) {
  const prompt = `Tóm tắt chương ${chapterNumber} thành 3-5 câu ngắn gọn, giữ sự kiện quan trọng, tên nhân vật, tình tiết then chốt:\n\n${content}\n\nTóm tắt:`;
  return await callAI(prompt);
}

module.exports = { callAI, writeChapter, checkConsistency, summarizeChapter };