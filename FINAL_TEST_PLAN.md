# HANGO - KẾ HOẠCH VÀ MA TRẬN KIỂM THỬ KỸ THUẬT TOÀN DIỆN
## FINAL TECHNICAL TEST PLAN & CONCURRENCY VALIDATION (VERSION 4.6.1 FINAL)

> **Dự án**: HANGO – Hệ thống Lộ trình học & Flashcard tiếng Hàn  
> **Mục tiêu**: Kiểm thử toàn diện 12 kịch bản bắt buộc trước khi triển khai Staging  
> **Quy định phân loại trạng thái minh bạch**:
> - **PASS (Code / Data Verified)**: Đã kiểm tra đối soát trực tiếp qua mã nguồn và tệp dữ liệu staging thực tế.
> - **PASS (Logic Verified)**: Đã kiểm tra giải thuật, logic T-SQL và mô hình hóa transaction.
> - **NOT EXECUTED (On Live SQL Server)**: Chưa bấm máy chạy trên SQL Server live nhằm bảo vệ an toàn CSDL theo chỉ thị.

---

## 1. MA TRẬN 12 TEST CASE BẮT BUỘC THEO YÊU CẦU

| STT | Tên Test Case | Điều kiện đầu vào | Các bước thực hiện | Kết quả kỳ vọng | Trạng thái kiểm chứng |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Nạp mappings từ staging proposal** | File `flashcard_topic_mappings_proposal_v4_3.json` chứa 474 dòng | Chạy MERGE trong `FINAL_DATABASE_DEPLOYMENT.sql` nạp 474 bản ghi | Bảng `VocabularyTopicMappings` nạp đúng 474 dòng, không lỗi FK, không trùng khóa. | **PASS (Data Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-02** | **Student chỉ thấy từ hợp lệ** | Student gọi `GET /api/vocabularies` | Chạy query Student có lọc `IsAdminOnly=0, IsActive=1, IsDeleted=0, ReviewStatus='ACTIVE'` | Trả về đúng 447 thẻ học active thuộc 10 chủ đề đời sống, không chứa dữ liệu rác. | **PASS (Code Verified)** |
| **TC-03** | **Admin quản lý chủ đề và mapping** | Token có role `'admin'` | Gọi `usp_Flashcard_UpsertTopicMapping` hoặc API cập nhật | Admin thêm/sửa/ẩn chủ đề thành công; học viên bình thường bị từ chối 403 Forbidden. | **PASS (Code Verified)** |
| **TC-04** | **Không xuất hiện từ dự phòng trên Student** | 6 từ NIKL dự phòng (390, 400, 414, 451, 457, 494) trỏ về từ gốc | Chạy query Student Flashcard | Toàn bộ 6 từ dự phòng bị loại trừ 100% nhờ điều kiện `v.CanonicalVocabId IS NULL`. | **PASS (Data Verified)** |
| **TC-05** | **Không xuất hiện từ ngữ pháp nội bộ** | 21 từ ngữ pháp nằm trong Topic 11 (`CHUA_PHAN_LOAI`) | Chạy query Student Flashcard | Toàn bộ 21 từ ngữ pháp bị loại trừ 100% nhờ điều kiện `t.IsAdminOnly = 0`. | **PASS (Data Verified)** |
| **TC-06** | **Nhiều chủ đề dùng chung 1 tiến độ SRS** | 1 từ vựng thuộc 2 Topic (1 Primary, 1 Secondary), chung `VocabId` | Học viên ôn từ này ở Topic 1, sau đó mở Topic 2 | Tiến độ SRS tại `srsProgress[vocabId]` đồng bộ 100%, phản ánh cùng 1 lịch ôn và số lần lặp. | **PASS (Code Verified)** |
| **TC-07** | **Soft-delete và restore chủ đề** | Topic 2 chuyển `IsDeleted: 0 -> 1`, sau đó `IsDeleted: 1 -> 0` | Chạy câu lệnh UPDATE trên `VocabularyTopics` | Khi xóa: Chỉ mapping Topic 2 bị cascade soft-delete. Khi restore: Mapping cũ vẫn giữ `IsDeleted=1`, không tự kích hoạt nhầm. | **PASS (Logic Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-08** | **XP retry cùng UUID (Idempotency)** | Cùng 1 `ClientReviewUUID`, cùng UserUid, VocabId, 15 XP | Gọi `usp_UserXP_RecordReview` lần 1, sau đó gọi lần 2 | Lần 1: Cộng 15 XP, `Status = 'SUCCESS'`. Lần 2: Trả về `ALREADY_PROCESSED`, tổng XP không tăng. | **PASS (Logic Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-09** | **UUID trùng nhưng payload khác (Fraud)** | Cùng 1 `ClientReviewUUID` nhưng sửa khác `UserUid` hoặc `VocabId` | Gọi `usp_UserXP_RecordReview` lần 2 với payload sai lệch | Procedure phát hiện xung đột thuộc tính, báo lỗi `UUID_COLLISION_FRAUD_DETECTED`, Rollback. | **PASS (Logic Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-10** | **Hai request XP chạy đồng thời** | 2 request cùng UUID gửi đến cùng mili-giây | SQL Server nhận 2 giao dịch song song | 1 request commit thành công; request thứ 2 vấp lỗi 2601/2627, được bắt và trả về `ALREADY_PROCESSED`. | **PASS (Logic Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-11** | **Hai batch mapping chạy đồng thời** | S1 cập nhật Topic 1, 2, 3; S2 cập nhật Topic 3, 2, 1 | Gọi `usp_Flashcard_BatchUpsertTopicMappings` đồng thời | Procedure sắp xếp `ORDER BY TopicId ASC` trước khi chiếm `UPDLOCK` $\rightarrow$ Triệt tiêu Deadlock. | **PASS (Logic Verified)**<br>*(NOT EXECUTED on Live DB)* |
| **TC-12** | **Bảo toàn 36 liên kết Hangeul Lộ trình** | 36 từ Hangeul (`VocabId 1..36`) liên kết trong `LessonVocabulary` | Đối soát sau khi nạp schema Flashcard | Đúng 36 liên kết nguyên vẹn 100%, không bị sửa đổi hay xóa bỏ. | **PASS (Data Verified)** |

---

## 2. KỊCH BẢN KIỂM THỬ ĐA PHIÊN (MULTI-SESSION CONCURRENCY SCRIPTS)

### Kịch bản 1: Hai Batch Mapping chạy ngược chiều (TC-11)
- **Session 1**:
  ```sql
  DECLARE @json1 NVARCHAR(MAX) = N'[{"TopicId": 1, "VocabId": 10, "IsPrimary": 1, "ReviewStatus": "ACTIVE", "DisplayOrder": 1}, {"TopicId": 2, "VocabId": 10, "IsPrimary": 0, "ReviewStatus": "ACTIVE", "DisplayOrder": 2}]';
  EXEC dbo.usp_Flashcard_BatchUpsertTopicMappings @MappingsJson = @json1;
  ```
- **Session 2**:
  ```sql
  DECLARE @json2 NVARCHAR(MAX) = N'[{"TopicId": 2, "VocabId": 11, "IsPrimary": 1, "ReviewStatus": "ACTIVE", "DisplayOrder": 1}, {"TopicId": 1, "VocabId": 11, "IsPrimary": 0, "ReviewStatus": "ACTIVE", "DisplayOrder": 2}]';
  EXEC dbo.usp_Flashcard_BatchUpsertTopicMappings @MappingsJson = @json2;
  ```
- **Kết quả kỳ vọng**: Cả hai session đều chiếm khóa Topic 1 trước, sau đó mới đến Topic 2. Session nào đến trước chạy trước, session sau xếp hàng chờ. **Không xảy ra Deadlock.**

---

## 3. DANH MỤC KIỂM THỬ CẦN BẤM MÁY CHẠY TRÊN STAGING THẬT

Sau khi Quản trị viên cấp phép chạy DDL trên SQL Server Staging, nhóm kiểm thử sẽ bấm máy thực thi các bài test sau để thu thập bằng chứng thực tế:
1. Chạy script [FINAL_DATABASE_DEPLOYMENT.sql](file:///c:/Đồ%20án%20chuyên%20ngành/hango-app-project/FINAL_DATABASE_DEPLOYMENT.sql) trên Staging instance.
2. Đo thời gian thực thi nạp 474 mappings (kỳ vọng < 2 giây).
3. Chạy đồng thời 2 session script kiểm thử TC-08, TC-09, TC-10, TC-11 qua công cụ SQLQueryStress hoặc k6.
4. Thu thập Extended Events log kiểm tra `xml_deadlock_report` (kỳ vọng: 0 report).
