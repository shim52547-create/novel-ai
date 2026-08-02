# 📖 Novel AI Studio

**Nền tảng viết tiểu thuyết bằng AI với kiến trúc multi-agent** — lên kế hoạch cốt truyện, viết chương, kiểm tra tính nhất quán và tự động chỉnh sửa văn phong "giống máy" thành văn phong tự nhiên.

![Node.js](https://imgur.com/XIXCSqV)
![React](https://imgur.com/DoiiRjV)
![SQLite](https://imgur.com/e9gwuB6)
![License](https://imgur.com/undefined)

---

## ✨ Tính năng chính

- **🤖 Multi-Agent Writing Pipeline** — 8 AI agent chuyên biệt phối hợp để viết mỗi chương: `Architect → Planner → Composer → Writer → Observer → Auditor → Reviser → Summarizer`.
- **🧠 Bộ nhớ truyện dài hạn** — Tự động theo dõi nhân vật, sự kiện, trạng thái thế giới (world state) qua từng chương để đảm bảo tính nhất quán xuyên suốt cuốn sách.
- **🕵️ Auditor tự động chấm điểm** — Mỗi chương được kiểm tra tính nhất quán (consistency score); nếu điểm thấp, agent **Reviser** sẽ tự sửa lại trước khi lưu.
- **🚫 Anti-AI Smell Detector** — Phân tích và loại bỏ các dấu hiệu văn phong "máy móc" đặc trưng của AI, giúp văn bản đọc tự nhiên hơn.
- **📚 Story Bible tự sinh** — Tổng hợp toàn bộ nhân vật, cốt truyện, thế giới quan thành một "cuốn kinh thánh truyện" hoàn chỉnh.
- **💬 Chat trực tiếp với nhân vật** — Trò chuyện với bất kỳ nhân vật nào trong truyện dựa trên tính cách và bối cảnh đã thiết lập.
- **🔌 Đa nhà cung cấp AI (multi-provider)** — Hỗ trợ **OpenAI, Anthropic (Claude), Google Gemini, Mistral, DeepSeek, Kimi (Moonshot)** — người dùng tự nhập API key, không khoá cứng vào một provider.
- **📤 Xuất bản đa định dạng** — Xuất tiểu thuyết ra **TXT, EPUB, PDF, Markdown** chỉ với một cú click.
- **📊 Nhật ký hoạt động Agent** — Theo dõi lịch sử chạy của từng agent (thời gian, input/output, trạng thái) cho mỗi chương.

## 🏗️ Kiến trúc

```
novel-ai/
├── server/                  # Backend — Node.js + Express
│   ├── index.js              # API chính, điều phối pipeline
│   ├── db.js                 # SQLite schema & kết nối
│   ├── agents.js             # 8 AI agent của pipeline viết truyện
│   ├── ai-provider.js        # Adapter cho các nhà cung cấp AI
│   ├── anti-ai.js            # Phát hiện & sửa văn phong AI
│   ├── storybible.js         # Sinh Story Bible & chat nhân vật
│   ├── export.js             # Xuất TXT / EPUB / PDF / Markdown
│   └── keep-alive.js         # Ping định kỳ khi deploy free-tier (Render...)
└── client/                  # Frontend — React 19
    └── src/
        ├── App.js
        ├── pages/             # Home, BookDetail, Characters, Write,
        │                      # PlotPlan, Storybible, AIChat, AntiAI,
        │                      # Revision, Memory, Export, Settings
        └── components/        # Sidebar, CyberBackground...
```

### Luồng xử lý khi viết một chương mới

```
ARCHITECT   → Thiết lập luật thế giới (chỉ chạy ở chương đầu)
PLANNER     → Lên kế hoạch nội dung cho chương dựa trên cốt truyện đã có
COMPOSER    → Dựng khung ngữ cảnh (nhân vật, sự kiện, world state liên quan)
WRITER      → Viết nội dung chương hoàn chỉnh
OBSERVER    → Trích xuất sự kiện mới, thay đổi nhân vật, cập nhật world state
AUDITOR     → Chấm điểm tính nhất quán (0–100)
REVISER     → Tự động sửa nếu điểm < 70 hoặc phát hiện mâu thuẫn
SUMMARIZER  → Tóm tắt chương để làm ngữ cảnh cho chương tiếp theo
```

## 🛠️ Công nghệ sử dụng

| Layer | Công nghệ |
|---|---|
| Backend | Node.js, Express 5, better-sqlite3, axios |
| Frontend | React 19, React Router 7, Framer Motion, TailwindCSS-ready, Lucide Icons |
| Xuất file | `pdfkit`, `epub-gen` |
| AI Providers | OpenAI, Anthropic, Google Gemini, Mistral, DeepSeek, Moonshot (Kimi) |
| Database | SQLite (file `novels.db`, không cần cài server riêng) |

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js ≥ 18
- API key của ít nhất một nhà cung cấp AI (OpenAI / Anthropic / Gemini / Mistral / DeepSeek / Moonshot)

### 1. Clone dự án

```bash
git clone https://github.com/<username>/novel-ai.git
cd novel-ai
```

### 2. Cài đặt & chạy Backend

```bash
cd server
npm install
npm start   # hoặc: node index.js
```

Server chạy mặc định tại `http://localhost:4000`.

> Bạn **không bắt buộc** phải tạo file `.env` — API key có thể nhập trực tiếp trong giao diện web (mục **Cài đặt**). Nếu muốn đặt key mặc định cho server, tạo file `server/.env` theo mẫu `server/.env.example`:
> ```env
> MISTRAL_API_KEY=your_key_here
> AI_PROVIDER=mistral
> AI_MODEL=mistral-small-latest
> CLIENT_URL=http://localhost:3000
> PORT=4000
> ```

### 3. Cài đặt & chạy Frontend

```bash
cd client
npm install
npm start
```

Frontend chạy mặc định tại `http://localhost:3000` và cần biến môi trường `REACT_APP_API_URL` trỏ về địa chỉ backend (mặc định `http://localhost:4000`).

## 📡 API chính

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/books` | Tạo tiểu thuyết mới |
| `GET` | `/api/books/:id` | Lấy toàn bộ dữ liệu sách (nhân vật, chương, sự kiện, world state...) |
| `POST` | `/api/books/:id/characters` | Thêm nhân vật |
| `POST` | `/api/books/:id/plot` | Thêm điểm cốt truyện (plot point) |
| `POST` | `/api/books/:id/write` | Chạy pipeline 8-agent để viết một chương mới |
| `POST` | `/api/chapters/:id/revise` | Yêu cầu chỉnh sửa lại một chương |
| `POST` | `/api/anti-ai/analyze` \| `/fix` | Phân tích / sửa văn phong AI |
| `GET` | `/api/books/:id/storybible` | Lấy Story Bible đã tổng hợp |
| `POST` | `/api/books/:id/chat` | Chat với nhân vật trong truyện |
| `GET` | `/api/books/:id/export/{txt,epub,pdf,markdown}` | Xuất bản theo định dạng |
| `GET` | `/api/providers` | Danh sách nhà cung cấp & model AI hỗ trợ |

## 🔑 Nhà cung cấp AI hỗ trợ

| Provider | Model tiêu biểu |
|---|---|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-3.5 Turbo, o1-mini, o3-mini |
| Anthropic | Claude Sonnet 4, Claude 3.5 Sonnet/Haiku, Claude 3 Opus |
| Google | Gemini 2.5 Pro/Flash, Gemini 2.0 Flash, Gemini 1.5 Pro |
| Mistral | Mistral Large/Medium/Small, Nemo, Tiny (miễn phí) |
| DeepSeek | DeepSeek V3, DeepSeek R1 |
| Moonshot | Kimi 128K/32K/8K |

## 🗺️ Roadmap

- [ ] Xác thực người dùng (multi-user) & lưu key theo tài khoản
- [ ] Xuất audiobook (text-to-speech)
- [ ] Hỗ trợ cộng tác viết nhiều người trên cùng một cuốn sách
- [ ] Giao diện quản lý phiên bản (version control) cho từng chương

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request nếu bạn muốn cải thiện dự án.

1. Fork dự án
2. Tạo nhánh tính năng (`git checkout -b feature/ten-tinh-nang`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng abc'`)
4. Push lên nhánh (`git push origin feature/ten-tinh-nang`)
5. Mở Pull Request

## 📄 Giấy phép

Phát hành theo giấy phép [MIT](LICENSE).

---

<p align="center">Được xây dựng với ❤️ và rất nhiều lần gọi API AI</p>
