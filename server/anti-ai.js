const { callAI } = require('./ai-provider');

async function analyzeAISmell(text, options = {}) {
  console.log('\n🧪 [ANTI-AI] Phân tích dấu vết AI...');
  const prompt = `Phân tích văn bản, tìm dấu vết AI. Trả JSON:

VĂN BẢN:
${text}

Trả JSON:
{
  "overall_score": 85,
  "smell_level": "low|medium|high|extreme",
  "issues": [{"type":"repeated_phrase|ai_tropes|monotone_structure|telling_not_showing", "severity":"low|medium|high", "original":"đoạn có vấn đề", "explanation":"tại sao", "suggestion":"cách sửa"}],
  "stats": {"total_words":0, "unique_ratio":0, "avg_sentence_length":0, "dialogue_ratio":0, "repeated_words":[""], "repeated_count":{"từ":0}},
  "recommendations": [""]
}

Kiểm tra: từ lặp, cụm từ AI ("Điều đáng nói","Thật vậy"), cấu trúc đơn điệu, show don't tell, hội thoại.
Chỉ JSON.`;
  const result = await callAI(prompt, 5000, 0.3, options);
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) { console.log('  ⚠️ JSON parse error'); }
  return { overall_score: 70, smell_level: 'medium', issues: [], stats: {}, recommendations: [] };
}

async function fixAISmell(text, issues, options = {}) {
  console.log('\n🔧 [ANTI-AI] Tự động sửa dấu vết...');
  const issuesSummary = (issues || [])
    .filter(i => i.severity === 'high' || i.severity === 'medium')
    .map(i => `- "${i.original}" → ${i.suggestion}`)
    .join('\n');
  const prompt = `Sửa văn bản, loại dấu vết AI:

VĂN BẢN:
${text}

VẤN ĐỀ:
${issuesSummary}

Quy tắc: thay từ lặp, thay cụm từ AI, show don't tell, đa dạng câu.
KHÔNG thay đổi cốt truyện. Trả TOÀN BỘ văn bản đã sửa.`;
  return await callAI(prompt, 8000, 0.7, options);
}

function quickAnalyze(text) {
  const words = text.split(/\s+/);
  const totalWords = words.length;
  const stopWords = new Set(['và','của','là','có','được','cho','với','này','đã','từ','không','một','những','các','để','trong','trên','về','như','khi','hay','hoặc','nhưng','vì','nếu','mà','đến','tại','theo','người','cô','anh','nó','hắn','lại','ra','lên','xuống']);
  const wordFreq = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[.,!?;:'"()]/g, '');
    if (clean.length > 2 && !stopWords.has(clean)) wordFreq[clean] = (wordFreq[clean] || 0) + 1;
  });
  const repeated = Object.entries(wordFreq).filter(([_, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;
  const dialogueChars = (text.match(/["""「」].*?["""「」]/g) || []).join('').length;
  const dialogueRatio = text.length > 0 ? dialogueChars / text.length : 0;
  const aiPhrases = ['Điều đáng nói','Thật vậy','Không thể phủ nhận','Cần phải nhấn mạnh','Điều quan trọng','Có thể nói rằng','Không ngoa khi nói','It is worth noting','In this chapter','As we delve deeper','cảm nhận được','không khỏi','đột nhiên nhận ra','bất giác','trong lòng không khỏi'];
  const foundPhrases = [];
  aiPhrases.forEach(phrase => { const m = text.match(new RegExp(phrase, 'gi')); if (m) foundPhrases.push({ phrase, count: m.length }); });
  const uniqueWords = new Set(Object.keys(wordFreq));
  const uniqueRatio = totalWords > 0 ? uniqueWords.size / totalWords : 0;
  let quickScore = 100;
  if (uniqueRatio < 0.3) quickScore -= 15;
  if (uniqueRatio < 0.2) quickScore -= 15;
  if (dialogueRatio < 0.1) quickScore -= 10;
  if (dialogueRatio > 0.6) quickScore -= 5;
  if (avgSentenceLength > 25) quickScore -= 10;
  if (avgSentenceLength < 8) quickScore -= 10;
  if (foundPhrases.length > 0) quickScore -= foundPhrases.length * 8;
  if (repeated.length > 0 && repeated[0][1] > 5) quickScore -= 10;
  quickScore = Math.max(0, Math.min(100, quickScore));
  return {
    totalWords, uniqueWordsCount: uniqueWords.size,
    uniqueRatio: Math.round(uniqueRatio * 100), sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    dialogueRatio: Math.round(dialogueRatio * 100),
    repeatedWords: repeated.slice(0, 10), aiPhrases: foundPhrases,
    quickScore,
    smellLevel: quickScore >= 85 ? 'low' : quickScore >= 65 ? 'medium' : quickScore >= 40 ? 'high' : 'extreme',
  };
}

module.exports = { analyzeAISmell, fixAISmell, quickAnalyze };