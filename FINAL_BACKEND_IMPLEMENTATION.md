# HANGO - TÀI LIỆU THIẾT KẾ VÀ HƯỚNG DẪN TÍCH HỢP BACKEND
## FINAL BACKEND IMPLEMENTATION GUIDE (VERSION 4.6.1 FINAL)

> **Dự án**: HANGO – Hệ thống Lộ trình học & Flashcard tiếng Hàn  
> **Tài liệu**: Hướng dẫn tích hợp Backend API, Stored Procedures, SRS Sync, XP Idempotency  
> **Nguyên tắc**: Bảo đảm tính toàn vẹn dữ liệu, kiểm tra 4 thuộc tính UUID, phân biệt rõ IsActive và IsDeleted.

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN TẦNG VÀ NGUỒN DỮ LIỆU

```
[ FRONTEND CLIENT ] (Next.js App Router / React 19)
       │
       ▼ (HTTPS + Bearer Firebase ID Token)
[ API ROUTE HANDLERS ] (app/api/vocabularies, app/api/srs/review)
       │  ├─ 1. Authenticate Request (Firebase Admin Token Verification)
       │  ├─ 2. Validate Input Schema & UUIDv4 Format
       │  └─ 3. Role-Based Authorization (Student vs. Admin)
       │
       ▼
[ BACKEND SERVICE LAYER ] (lib/backend/srs.ts, lib/backend/user-store.ts)
       │  ├─ 4. SM-2 Variant Scheduling Logic
       │  ├─ 5. Tie-Breaker & History Deduplication (SyntheticKey)
       │  ├─ 6. Current Primary Store: JSON (data/hango-users-db.json) & Firestore
       │  └─ 7. Staging Connection Pool: Role HangoAppRole (Direct DML Denied)
       │
       ▼ (Stored Procedure Only)
[ SQL SERVER STORAGE ENGINE ] (HangoDatasetDB)
          ├─ dbo.usp_Flashcard_UpsertTopicMapping
          ├─ dbo.usp_Flashcard_BatchUpsertTopicMappings
          ├─ dbo.usp_Vocabulary_UpdateCanonical
          └─ dbo.usp_UserXP_RecordReview
```

> [!IMPORTANT]
> **NGUỒN DỮ LIỆU CHÍNH THỨC HIỆN TẠI**: Hiện tại, toàn bộ tiến độ người dùng, điểm XP và chuỗi Streak được lưu trữ tại `data/hango-users-db.json` và đồng bộ sang Cloud Firestore. Bảng `dbo.UserXPLog` trên SQL Server là cấu trúc đề xuất Staging. **TUYỆT ĐỐI KHÔNG chuyển nguồn lưu trữ chính thức sang SQL Server** khi chưa hoàn thành kiểm chứng 3 pha (Pre-migration Audit, Dual-write, Cutover).

---

## 2. ĐẶC TẢ CHI TIẾT CÁC ENDPOINT API

### 2.1. `GET /api/vocabularies` (Truy xuất từ vựng Flashcard cho Học viên)
- **Mục đích**: Cung cấp danh sách thẻ học từ vựng theo chủ đề cho học viên, bảo đảm **100% không lọt từ dự phòng, từ ngữ pháp hoặc chủ đề bị ẩn/xóa**.
- **Xác thực**: Yêu cầu Bearer Token hợp lệ. Chặn tài khoản Guest hoặc tài khoản bị khóa (`user.locked`).
- **Phân biệt IsActive và IsDeleted**:
  - `IsActive = 0`: Chủ đề tạm ẩn (ví dụ: chưa mở theo kỳ học). Học viên không thấy, nhưng mapping không bị xóa.
  - `IsDeleted = 1`: Chủ đề bị xóa mềm. Toàn bộ mapping bị cascade soft-delete.
- **Truy vấn SQL Server thực tế**:
```sql
SELECT 
    m.MappingId,
    m.TopicId,
    t.TopicCode,
    t.TopicNameVi,
    t.TopicNameKo,
    m.VocabId,
    v.KoreanWord,
    v.VietnameseMeaning,
    v.Romanization,
    v.PartOfSpeech,
    v.ExampleSentenceKo,
    v.ExampleSentenceVi,
    v.TopikLevel,
    m.IsPrimary,
    m.ReviewStatus,
    m.DisplayOrder
FROM dbo.VocabularyTopicMappings m
INNER JOIN dbo.VocabularyTopics t ON m.TopicId = t.TopicId
INNER JOIN dbo.Vocabulary v ON m.VocabId = v.VocabId
WHERE t.IsAdminOnly = 0                  -- 1. Chặn chủ đề Admin
  AND t.IsActive = 1                     -- 2. Chặn chủ đề đang bị ẩn (Inactive)
  AND t.IsDeleted = 0                    -- 3. Chặn chủ đề đã xóa mềm (Deleted)
  AND m.IsDeleted = 0                    -- 4. Chặn mapping đã xóa mềm
  AND m.ReviewStatus = 'ACTIVE'          -- 5. Chỉ lấy thẻ ACTIVE
  AND v.CanonicalVocabId IS NULL        -- 6. Chỉ lấy từ gốc độc lập cho Student
ORDER BY t.DisplayOrder ASC, m.DisplayOrder ASC;
```

---

### 2.2. `POST /api/srs/review` (Thực thi SM-2 & Ghi nhận XP Idempotency)
- **Mục đích**: Ghi nhận kết quả đánh giá ghi nhớ của học viên, tính toán lịch ôn tập và cộng điểm kinh nghiệm XP an toàn.
- **Headers**: `Authorization: Bearer <Firebase_ID_Token>`
- **Request Body Payload**:
```json
{
  "clientReviewUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "vocabId": 15,
  "rating": "remember",
  "previous": {
    "KhoangCachNgay": 1,
    "SoLanLap": 1,
    "HeSoGhiNho": 2.50
  }
}
```
- **Xử lý kiểm tra Idempotency tại Backend**:
  1. Xác thực Token $\rightarrow$ Trích xuất `authResult.user.uid`.
  2. Bắt buộc kiểm tra `clientReviewUuid` có đúng định dạng UUIDv4 chuẩn RFC 4122.
  3. Kiểm tra `vocabId` hợp lệ trong kho từ vựng và không phải là từ bị khóa.
  4. Tính toán thuật toán SM-2: `calculateSrsSchedule(vocabId, rating, previous)`.
  5. Gọi Stored Procedure `dbo.usp_UserXP_RecordReview` (Backend cố định 15 XP).
  6. **Cơ chế xác minh 4 thuộc tính khi UUID đã tồn tại**:
     - Nếu Stored Procedure phát hiện UUID đã tồn tại: Truy vấn lại và đối chiếu khớp TOÀN BỘ 4 thuộc tính: `UserUid == @UserUid`, `ActivityType == 'SRS_REVIEW'`, `SourceEntityId == @VocabId`, `XpAmount == 15`.
     - Nếu khớp: Trả về trạng thái `ALREADY_PROCESSED` (Idempotent Retry mạng), không cộng XP lần 2.
     - Nếu KHÔNG khớp bất kỳ thuộc tính nào: Báo lỗi `UUID_COLLISION_FRAUD_DETECTED`, hủy toàn bộ giao dịch.

---

## 3. THUẬT TOÁN SRS MERGE & RECONCILIATION CHUẨN HANGO

Khảo sát trực tiếp [lib/backend/srs.ts](file:///c:/Đồ%20án%20chuyên%20ngành/hango-app-project/lib/backend/srs.ts):

### 3.1. Ma trận tính toán SuperMemo-2
- Điểm chất lượng $q$: `forgot` $\rightarrow 1$, `hard` $\rightarrow 3$, `remember` $\rightarrow 5$.
- Công thức cập nhật hệ số dễ:
  $$\text{EF}' = \max\left(1.30,\ \text{round}\Big(\text{EF} + \big(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\big),\ 2\Big)\right)$$
- Quy tắc bước nhảy:
  - `forgot`: `SoLanLap = 0`, `KhoangCachNgay = 1` ngày, $\text{EF}' = \text{EF} - 0.54$.
  - `hard`: `SoLanLap = prevReps + 1`, khoảng cách tăng chậm (1 $\rightarrow$ 2 $\rightarrow$ round($I \times 1.4$)), $\text{EF}' = \text{EF} - 0.14$.
  - `remember`: `SoLanLap = prevReps + 1`, khoảng cách tăng nhanh (1 $\rightarrow$ 3 $\rightarrow$ round($I \times \text{EF}'$)), $\text{EF}' = \text{EF} + 0.10$.

### 3.2. Quy tắc Tie-Breaker và Xử lý Lịch sử Cũ
1. **Timestamp bằng nhau nhưng khác Rating**: Ưu tiên mức bảo thủ: `forgot` > `hard` > `remember`.
2. **SyntheticKey cho lịch sử cũ**:
   $$\text{SyntheticKey} = \text{SHA256}(\text{UserUid} + \text{"|"\} + \text{VocabId} + \text{"|"\} + \text{TimestampISO} + \text{"|"\} + \text{Rating} + \text{"|"\} + \text{IntervalDays})$$
3. **Chống cộng dồn sai**: Đếm số lần quên `LapsesCount` trên tập hợp log có ID hoặc `SyntheticKey` duy nhất.
4. **History Replay Reconciliation**: Khi dữ liệu `srsProgress` mâu thuẫn với `ReviewHistory`, phát lại toàn bộ lịch sử qua hàm `calculateSrsSchedule` để tái thiết lập tiến độ. Nếu lịch sử bị khuyết thiếu, áp dụng cơ chế *Partial History Fallback* và giữ nguyên `srsProgress` hiện hành nếu nó mới hơn.

---

## 4. QUẢN LÝ GIAO DỊCH VÀ PHÒNG CHỐNG DEADLOCK

### 4.1. Thứ tự chiếm khóa chuẩn trong hệ thống
Để loại trừ hiện tượng Deadlock do đảo ngược thứ tự khóa (*Lock Hierarchy Inversion*):
1. **Khóa cấp 1 (Tài nguyên phân cấp)**: `sp_getapplock @Resource = 'HANGO_CANONICAL_HIERARCHY_MUTEX'`.
2. **Khóa cấp 2 (Bảng cha Topic)**: `dbo.VocabularyTopics WITH (UPDLOCK, HOLDLOCK)` theo thứ tự `ORDER BY TopicId ASC`.
3. **Khóa cấp 3 (Kho từ vựng)**: `dbo.Vocabulary WITH (UPDLOCK, HOLDLOCK)` theo thứ tự `ORDER BY VocabId ASC`.
4. **Khóa cấp 4 (Bảng con Mapping)**: Ghi DML vào `dbo.VocabularyTopicMappings`.

### 4.2. Cơ chế Retry tại Backend API
Khi ứng dụng gặp lỗi `1205` (Deadlock Victim):
```typescript
async function executeWithDeadlockRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isDeadlock = err?.number === 1205 || err?.message?.includes('deadlock');
      if (isDeadlock && attempt <= maxRetries) {
        const delay = Math.floor(Math.random() * 150) + 50 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}
```

---

## 5. PHÂN QUYỀN VÀ BẢO MẬT KẾT NỐI

1. **Chuỗi kết nối Staging**:
   `Server=tcp:staging-sql.hango.internal,1433;Database=HangoDatasetDB;User Id=hango_backend_svc;Password=<SecurePassword>;Encrypt=True;TrustServerCertificate=False;`
2. **Quyền hạn của user `hango_backend_svc`**:
   - Thành viên của role `HangoAppRole`.
   - **Bị cấm hoàn toàn**: `INSERT, UPDATE, DELETE` trên `VocabularyTopicMappings`, `Vocabulary(CanonicalVocabId)`.
   - **Chỉ được phép thực thi**: Các Stored Procedure `dbo.usp_Flashcard_*`, `dbo.usp_Vocabulary_*`, `dbo.usp_UserXP_*`.
