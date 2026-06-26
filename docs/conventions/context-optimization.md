# Hướng dẫn tối ưu context khi dùng Skills trong Claude Code

## Vấn đề cốt lõi

Mỗi skill được load vào context window khi bạn gọi nó. Nếu skill nặng + conversation dài + nhiều file được đọc = context bị đầy, model bắt đầu "quên" thông tin đầu conversation.

---

## 1. Token Budget — Nguyên tắc phân bổ

Ưu tiên theo thứ tự:

```
System prompt / CLAUDE.md     ~500 tokens   ← không thể cắt
Recent messages               ~2000 tokens  ← quan trọng nhất
User profile / memory         ~200 tokens
Retrieved memories / context  ~1000 tokens
Current query + skill output  ~500 tokens
Buffer (safety margin)        ~300 tokens
```

**Nếu bị vượt ngưỡng**: cắt retrieved memories trước, không cắt recent messages.

---

## 2. Gọi skill đúng thời điểm

### Gọi skill một lần, dùng nhiều lần

```
# Sai — gọi skill mỗi lần cần hỏi
/agent-memory-systems chunking?
/agent-memory-systems decay?
/agent-memory-systems vector store?

# Đúng — gọi skill một lần, đặt nhiều câu hỏi trong cùng prompt
/agent-memory-systems
chunking strategy, memory decay, và vector store selection
```

### Không reload skill nếu đã có trong context

Khi skill đã được load trong conversation hiện tại, chỉ cần hỏi thẳng — không cần gọi lại `/skill-name`.

---

## 3. Chunking thông tin khi hỏi skill

Chia câu hỏi thành **one concern per message** thay vì dump toàn bộ vấn đề:

```
# Không tốt — quá nhiều context không liên quan
"Tôi đang làm project NestJS, có PostgreSQL, Redis, hiện đang làm
task 09 về validation pipe, nhưng tôi cũng muốn biết về memory
decay và chunking strategy..."

# Tốt — súc tích, đúng trọng tâm
"Memory decay: khi nào nên archive vs delete một memory?"
```

---

## 4. Sử dụng auto-memory hiệu quả

Hệ thống memory tại `~/.claude/projects/.../memory/` giúp **giảm tải context** giữa các session.

### Những gì NÊN lưu vào memory:
- Preferences và feedback ("đừng làm X", "luôn làm Y")
- Project decisions không có trong code
- User profile (role, expertise level)

### Những gì KHÔNG lưu vào memory:
- Code patterns — đọc trực tiếp từ file
- Git history — dùng `git log`
- Task đang làm — dùng TodoWrite
- Kiến thức từ skill — skill đã có sẵn, không cần duplicate

---

## 5. Quản lý context khi làm task dài

### Dùng `/clear` đúng lúc

Khi nào nên `/clear`:
- Xong một task, bắt đầu task mới hoàn toàn khác
- Context đã chứa nhiều file reads không còn cần thiết
- Conversation đã hỏi skill nhưng không còn dùng output đó

Khi nào KHÔNG nên `/clear`:
- Đang ở giữa task chưa xong
- Còn cần tham chiếu đến output của tool calls trước

### Tóm tắt trước khi clear

Nếu cần giữ lại kết quả từ conversation dài:
```
"Tóm tắt những gì đã làm và quyết định nào đã đưa ra trong task này"
```
→ Lưu tóm tắt vào file tạm hoặc memory trước khi `/clear`.

---

## 6. Retrieval có filter — không dùng semantic search thuần

Khi agent tìm kiếm trong memory/vector store:

```python
# Sai — chỉ semantic similarity
results = index.query(vector=embed(query), top_k=5)

# Đúng — filter trước, semantic sau
results = index.query(
    vector=embed(query),
    filter={"user_id": uid, "type": "preference", "created_after": cutoff},
    top_k=5
)
```

---

## 7. Memory decay — đừng để memory phình to

Áp dụng composite utility score:

```
utility = recency × 0.4 + frequency × 0.3 + importance × 0.3
```

- `utility < 0.2` → archive
- Half-life recency: 72 giờ cho episodic, 30 ngày cho semantic

---

## 8. Checklist trước khi gọi skill nặng

- [ ] Conversation hiện tại còn bao nhiêu "không gian"? (ít recent messages = còn nhiều)
- [ ] Thông tin cần hỏi có thể tóm gọn trong 1-2 câu không?
- [ ] Skill này đã được load trong session này chưa?
- [ ] Sau khi nhận output từ skill, có cần clear bớt context không?

---

## Tóm tắt nguyên tắc

| Nguyên tắc | Áp dụng |
|---|---|
| Gọi skill 1 lần, hỏi nhiều | Gộp câu hỏi trong một lần invoke |
| Token budget rõ ràng | System > Recent > Profile > Retrieved |
| Filter trước semantic sau | Luôn có metadata filter |
| Memory decay định kỳ | Utility score < 0.2 → archive |
| Clear đúng lúc | Sau task, trước task mới |
| Lưu đúng loại memory | Feedback/preference → memory, code → đọc file |
