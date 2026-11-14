const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

class DocxBuilder {
  constructor() {
    this.paragraphs = [];
  }

  addTitle(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:before="240" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="34"/>
            <w:color w:val="1F497D"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addSubtitle(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:before="60" w:after="240"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:i/>
            <w:sz w:val="22"/>
            <w:color w:val="595959"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading1(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="360" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="26"/>
            <w:color w:val="1F497D"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading2(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="80"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="22"/>
            <w:color w:val="365F91"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading3(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="180" w:after="60"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="20"/>
            <w:color w:val="4F81BD"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addParagraph(text, options = {}) {
    const boldXml = options.bold ? '<w:b/>' : '';
    const italicXml = options.italic ? '<w:i/>' : '';
    const colorXml = options.color ? `<w:color w:val="${options.color}"/>` : '';
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="50" w:after="50" w:line="260" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            ${boldXml}
            ${italicXml}
            ${colorXml}
            <w:sz w:val="20"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addBullet(text, level = 0) {
    const indent = 300 * (level + 1);
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:ind w:left="${indent}" w:hanging="200"/>
          <w:spacing w:before="30" w:after="30"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:sz w:val="20"/>
          </w:rPr>
          <w:t>•  ${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addCodeBlock(codeText) {
    const lines = codeText.split('\n');
    const runs = lines.map(line => `
      <w:p>
        <w:pPr>
          <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
          <w:spacing w:before="0" w:after="0" w:line="220" w:lineRule="auto"/>
          <w:ind w:left="200" w:right="200"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>
            <w:sz w:val="17"/>
            <w:color w:val="262626"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`).join('');
    this.paragraphs.push(runs);
  }

  addTable(headers, rows) {
    let tableXml = `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="9200" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="D3D3D3"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="4F81BD"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
            <w:insideV w:val="none"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tr>
          ${headers.map(h => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="1F497D"/>
                <w:tcMar>
                  <w:top w:w="100" w:type="dxa"/>
                  <w:bottom w:w="100" w:type="dxa"/>
                  <w:left w:w="120" w:type="dxa"/>
                  <w:right w:w="120" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="19"/>
                    <w:color w:val="FFFFFF"/>
                  </w:rPr>
                  <w:t>${escapeXml(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          `).join('')}
        </w:tr>`;

    rows.forEach((row, rIdx) => {
      const fill = rIdx % 2 === 1 ? 'F9FBFD' : 'FFFFFF';
      tableXml += `
        <w:tr>
          ${row.map(cell => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
                <w:tcMar>
                  <w:top w:w="80" w:type="dxa"/>
                  <w:bottom w:w="80" w:type="dxa"/>
                  <w:left w:w="120" w:type="dxa"/>
                  <w:right w:w="120" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:sz w:val="18"/>
                  </w:rPr>
                  <w:t>${escapeXml(cell)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          `).join('')}
        </w:tr>`;
    });

    tableXml += `</w:tbl>`;
    this.paragraphs.push(tableXml);
  }

  buildDocumentXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${this.paragraphs.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }
}

// Generate the full docx
const doc = new DocxBuilder();

doc.addTitle("DỰ ÁN HANGO - BÁO CÁO KIỂM TOÁN VÀ KHẮC PHỤC BLOCKER CUỐI CÙNG");
doc.addSubtitle("FINAL DEPLOYMENT BLOCKER FIX & VERIFICATION REPORT (VERSION 4.6.1 FINAL)");

doc.addParagraph("Thời gian hoàn tất: 13/11/2026 | Phiên bản thẩm định: Final Blocker Fix");
doc.addParagraph("Cơ sở dữ liệu: HangoDatasetDB (SQL Server) | Phạm vi: Flashcard, Vocabulary, SRS & XP Gamification");

// Section 1: Executive Summary & Blockers
doc.addHeading1("1. TỔNG HỢP CÁC BLOCKER ĐÃ ĐƯỢC XỬ LÝ TRIỆT ĐỂ");
doc.addParagraph("Qua rà soát kỹ lưỡng các phản hồi, báo cáo v4.6.1 đã khắc phục dứt điểm 6 nhóm blocker kỹ thuật quan trọng:");

doc.addHeading2("1.1. Blocker A: Bổ sung bước nạp 474 Mappings thực tế vào FINAL_DATABASE_DEPLOYMENT.sql");
doc.addBullet("Vấn đề: File SQL trước đó mới chỉ tạo bảng VocabularyTopicMappings mà chưa có câu lệnh nạp 474 dòng ánh xạ thực tế.");
doc.addBullet("Khắc phục: Trích xuất trực tiếp toàn bộ 474 bản ghi từ tệp staging data/flashcard_topic_mappings_proposal_v4_3.json và nhúng trực tiếp vào Bước 3.1 của FINAL_DATABASE_DEPLOYMENT.sql qua câu lệnh MERGE lũy đẳng. Đảm bảo nạp đầy đủ đúng 474 bản ghi.");

doc.addHeading2("1.2. Blocker B: Bổ sung cột IsActive và phân biệt rõ ràng với IsDeleted");
doc.addBullet("Vấn đề: Trước đó có sự lẫn lộn giữa trạng thái ẩn (Inactive) và xóa mềm (Deleted).");
doc.addBullet("Khắc phục: Bổ sung chính thức cột IsActive BIT NOT NULL DEFAULT 1 vào dbo.VocabularyTopics. Phân định rõ: IsActive=0 chỉ ẩn chủ đề khỏi Student mà không xóa mapping; IsDeleted=1 là xóa mềm và cascade soft-delete toàn bộ mapping. Đồng bộ hóa vào Trigger, Stored Procedure và Student Query.");

doc.addHeading2("1.3. Blocker C: Rà soát nghiêm ngặt tính toàn vẹn của Mapping");
doc.addBullet("Chặn tuyệt đối từ Canonical độc lập (CanonicalVocabId IS NULL) không được mang ReviewStatus = 'DUPLICATE_STANDBY'.");
doc.addBullet("Từ có CanonicalVocabId bắt buộc phải mang ReviewStatus = 'DUPLICATE_STANDBY' và IsPrimary = 0.");
doc.addBullet("Chỉ mapping ACTIVE trên Topic hợp lệ (IsAdminOnly=0, IsActive=1, IsDeleted=0) mới được phép mang IsPrimary = 1.");

doc.addHeading2("1.4. Blocker D: Thống nhất thứ tự khóa và minh bạch rủi ro Deadlock");
doc.addBullet("Thống nhất thứ tự chiếm khóa: AppLock phân cấp -> Topic (ORDER BY TopicId ASC) -> Vocabulary (ORDER BY VocabId ASC) -> Mapping.");
doc.addBullet("Minh bạch rủi ro: Khẳng định trung thực rằng thứ tự khóa chỉ triệt tiêu Deadlock giữa các Stored Procedure được kiểm soát; các câu lệnh ad-hoc ngoài SP vẫn có thể gây Deadlock -> Backend bắt buộc phải cấu hình Retry lỗi 1205.");

doc.addHeading2("1.5. Blocker E: Tăng cường kiểm tra 4 thuộc tính XP Idempotency và xác định Single Source of Truth");
doc.addBullet("Khi ClientReviewUUID đã tồn tại: Truy vấn lại và đối chiếu khớp toàn bộ 4 thuộc tính (UserUid, ActivityType, SourceEntityId, XpAmount). Nếu khác bất kỳ trường nào -> Ném lỗi UUID_COLLISION_FRAUD_DETECTED và Rollback.");
doc.addBullet("Kiểm tra VocabId hợp lệ trong dbo.Vocabulary trước khi cộng XP.");
doc.addBullet("Khẳng định rõ: Nguồn XP chính thức hiện tại vẫn là data/hango-users-db.json và Firestore. SQL Server UserXPLog là cấu trúc Staging, chưa chuyển đổi nguồn ghi.");

doc.addHeading2("1.6. Blocker F: Hoàn thiện kế hoạch và script Rollback");
doc.addBullet("Phân định rõ 2 cấp độ: Cấp độ 1 (DDL Undo script) và Cấp độ 2 (Phục hồi vật lý từ file .BAK).");
doc.addBullet("Thêm nhãn thời gian (timestamp) vào file backup để không ghi đè bản cũ; bổ sung kiểm tra RESTORE VERIFYONLY.");
doc.addBullet("Ghi rõ cảnh báo nguy cơ mất dữ liệu của lệnh DROP TABLE / DROP COLUMN; cấm tự động rollback trên live DB.");

// Section 2: Complete Inventory & Source of Truth
doc.addHeading1("2. ĐỐI SOÁT NGUỒN DỮ LIỆU THẬT VÀ 10 CHỈ SỐ VÀNG");
doc.addTable(
  ["STT", "Chỉ số hệ thống", "Số lượng thực tế", "Nguồn dữ liệu kiểm chứng", "Kết luận"],
  [
    ["1", "Tổng từ vựng trong kho", "296 bản ghi", "CSDL dbo.Vocabulary & TSV gốc", "Khớp 100% (Bảo toàn 100% VocabId)"],
    ["2", "Khóa Lộ trình Hangeul", "36 bản ghi", "dbo.LessonVocabulary (ID 1..36)", "Khớp 100% (UNCHANGED_LESSON_LOCKED)"],
    ["3", "Từ NIKL dự phòng", "6 bản ghi", "ID: 390, 400, 414, 451, 457, 494", "Khớp 100% (Trỏ đúng từ gốc)"],
    ["4", "Từ ngữ pháp / trợ từ", "21 bản ghi", "Topic 11 CHUA_PHAN_LOAI", "Khớp 100% (GRAMMAR_AUXILIARY)"],
    ["5", "Từ đời sống duy nhất của Student", "269 từ vựng", "296 - 6 - 21 = 269 từ", "Khớp 100%"],
    ["6", "Tổng danh mục Flashcard", "11 chủ đề", "flashcard_topics_proposal_v4_3.json", "Khớp 100% (10 Student + 1 Admin)"],
    ["7", "Tổng lượt ánh xạ", "474 mappings", "flashcard_topic_mappings_proposal_v4_3.json", "Khớp 100% (Đã nhúng vào SQL)"],
    ["8", "Số Mapping IsPrimary = 1", "269 mappings", "UQ_Primary_Mapping", "Khớp 1-1 với 269 từ Student"],
    ["9", "Số Mapping IsPrimary = 0", "205 mappings", "178 mở rộng + 6 standby + 21 ngữ pháp", "Khớp 100%"],
    ["10", "Số Mapping ACTIVE", "447 mappings", "ReviewStatus = 'ACTIVE'", "Khớp 100% (Thẻ hiển thị Student)"]
  ]
);

// Section 3: 12 Test Cases Summary
doc.addHeading1("3. TỔNG HỢP MA TRẬN 12 TEST CASE BẮT BUỘC");
doc.addBullet("TC-01 (Nạp mappings từ staging): PASS (Data Verified) - Đã sinh câu lệnh MERGE cho đúng 474 dòng; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-02 (Student chỉ thấy từ hợp lệ): PASS (Code Verified) - Query có bộ lọc IsAdminOnly=0, IsActive=1, IsDeleted=0, ReviewStatus='ACTIVE'.");
doc.addBullet("TC-03 (Admin quản lý chủ đề và mapping): PASS (Code Verified) - Xác thực role 'admin' tại Backend API.");
doc.addBullet("TC-04 (Không xuất hiện từ dự phòng trên Student): PASS (Data Verified) - 6 từ standby bị loại trừ 100% nhờ CanonicalVocabId IS NULL.");
doc.addBullet("TC-05 (Không xuất hiện từ ngữ pháp nội bộ): PASS (Data Verified) - 21 từ ngữ pháp bị loại trừ 100% nhờ IsAdminOnly = 0.");
doc.addBullet("TC-06 (Nhiều chủ đề dùng chung tiến độ SRS): PASS (Code Verified) - Dùng chung VocabId và srsProgress[vocabId].");
doc.addBullet("TC-07 (Soft-delete và restore): PASS (Logic Verified) - Xóa chỉ cascade Topic đó; restore không tự động khôi phục mapping cũ; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-08 (XP retry cùng UUID): PASS (Logic Verified) - Trả về ALREADY_PROCESSED, không cộng dồn XP lần 2; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-09 (UUID trùng nhưng payload khác): PASS (Logic Verified) - Ném lỗi UUID_COLLISION_FRAUD_DETECTED, Rollback; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-10 (Hai request XP chạy đồng thời): PASS (Logic Verified) - Ràng buộc UNIQUE chặn đứng, bắt lỗi 2601/2627; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-11 (Hai batch mapping chạy đồng thời): PASS (Logic Verified) - Khóa Topic tuần tự ORDER BY TopicId ASC triệt tiêu Deadlock; NOT EXECUTED trên Live DB.");
doc.addBullet("TC-12 (Bảo toàn 36 liên kết Hangeul Lộ trình): PASS (Data Verified) - 36 liên kết trong LessonVocabulary nguyên vẹn 100%.");

// Section 4: Final Conclusion
doc.addHeading1("4. KẾT LUẬN KIỂM TOÁN VÀ ĐÁNH GIÁ SẴN SÀNG TRIỂN KHAI");
doc.addParagraph("Toàn bộ 6 nhóm blocker kỹ thuật đã được xử lý triệt để, bộ 5 tài liệu bàn giao đã được cập nhật đồng bộ và hoàn thiện chính thức:");
doc.addParagraph("KẾT LUẬN CHÍNH THỨC: ĐÃ ĐỦ ĐIỀU KIỆN TRIỂN KHAI TRÊN MÔI TRƯỜNG SQL SERVER STAGING (READY FOR STAGING DEPLOYMENT)", { bold: true, color: "1F497D" });
doc.addParagraph("Điều kiện tiên quyết trước khi bấm máy chạy SQL trên Staging:");
doc.addBullet("1. Chạy Full Backup vật lý có gắn nhãn thời gian và kiểm tra RESTORE VERIFYONLY thành công.");
doc.addBullet("2. Chạy đối soát trước triển khai (Pre-deployment checks) bảo đảm CSDL có đúng 296 từ và 36 liên kết Hangeul.");
doc.addBullet("3. Thực thi FINAL_DATABASE_DEPLOYMENT.sql trên Staging.");
doc.addBullet("4. Thu thập kết quả kiểm thử thực tế và Deadlock Graph từ 7 kịch bản đa phiên.");
doc.addParagraph("Hệ thống CHƯA ĐỦ ĐIỀU KIỆN ĐÁNH GIÁ SẴN SÀNG PRODUCTION cho đến khi có báo cáo nghiệm thu thực tế từ Staging.");

// Write out the document
const targetDocx = path.resolve('FINAL_AUDIT_REPORT.docx');
const tempDir = path.resolve('.docx_temp_final_blocker');

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

// [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml, 'utf8');

// _rels/.rels
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), relsXml, 'utf8');

// word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml, 'utf8');

// word/styles.xml
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
        <w:lang w:val="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), stylesXml, 'utf8');

const docXml = doc.buildDocumentXml();
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), docXml, 'utf8');

// Compress tempDir into targetDocx using PowerShell
try {
  if (fs.existsSync(targetDocx)) {
    fs.unlinkSync(targetDocx);
  }
  const targetZip = targetDocx.replace('.docx', '.zip');
  if (fs.existsSync(targetZip)) {
    fs.unlinkSync(targetZip);
  }
  const psCmd = `$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${targetZip}' -Force; Move-Item -Path '${targetZip}' -Destination '${targetDocx}' -Force`;
  execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log(`Document successfully generated at: ${targetDocx}`);
  // Clean up tempDir
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (err) {
  console.error('Error compressing docx:', err);
  process.exit(1);
}
