export interface FeeReceiptData {
  studentName: string;
  studentNameTamil?: string;
  rollNo: string;
  className: string;
  section: string;
  receiptNo: string;
  date: string;
  amount: number;
  paymentMethod: string;
  feeType: string;
}

export interface ReportCardData {
  studentName: string;
  studentNameTamil?: string;
  rollNo: string;
  admissionNo: string;
  className: string;
  section: string;
  academicYear: string;
  examTitle: string;
  examTitleTamil?: string;
  schoolRank?: number | string | null;
  classRank?: number | string | null;
  sectionRank?: number | string | null;
  subjects: {
    name: string;
    nameTamil: string;
    marks: number;
    maxMarks: number;
    grade: string;
    remarks: string;
    remarksTamil: string;
    subjectRank?: number | string | null;
  }[];
}

export interface MarksheetRegisterData {
  examTitle: string;
  className: string;
  section: string;
  subject: string;
  teacherName: string;
  records: {
    rollNo: number | string;
    studentName: string;
    marks: number | string;
    maxMarks: number;
    passMark: number;
    grade: string;
    status: string;
    remarks: string;
  }[];
}

export const pdfExportService = {
  /**
   * Export fee receipt to print/PDF layout
   */
  exportFeeReceipt: (data: FeeReceiptData, language: 'en' | 'ta' | 'bilingual') => {
    const isTa = language === 'ta';
    const isBi = language === 'bilingual';

    const title = isTa ? 'கட்டண ரசீது' : isBi ? 'Fee Receipt / கட்டண ரசீது' : 'Fee Receipt';
    const studentLabel = isTa ? 'மாணவர் பெயர்' : isBi ? 'Student Name / மாணவர் பெயர்' : 'Student Name';
    const rollLabel = isTa ? 'வரிசை எண்' : isBi ? 'Roll Number / வரிசை எண்' : 'Roll Number';
    const classLabel = isTa ? 'வகுப்பு' : isBi ? 'Class / வகுப்பு' : 'Class';
    const sectionLabel = isTa ? 'பிரிவு' : isBi ? 'Section / பிரிவு' : 'Section';
    const receiptLabel = isTa ? 'ரசீது எண்' : isBi ? 'Receipt No / ரசீது எண்' : 'Receipt No';
    const dateLabel = isTa ? 'தேதி' : isBi ? 'Date / தேதி' : 'Date';
    const amountLabel = isTa ? 'தொகை' : isBi ? 'Amount / தொகை' : 'Amount';
    const methodLabel = isTa ? 'கட்டண முறை' : isBi ? 'Payment Method / கட்டண முறை' : 'Payment Method';
    const typeLabel = isTa ? 'கட்டண வகை' : isBi ? 'Fee Type / கட்டண வகை' : 'Fee Type';
    const authLabel = isTa ? 'அதிகாரப்பூர்வ கையொப்பம்' : isBi ? 'Authorized Signature / அதிகாரப்பூர்வ கையொப்பம்' : 'Authorized Signature';

    const displayName = (isTa || isBi) && data.studentNameTamil ? `${data.studentName} (${data.studentNameTamil})` : data.studentName;

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap');
            body {
              font-family: 'Inter', 'Noto Sans Tamil', 'Latha', sans-serif;
              margin: 40px;
              color: #333;
              line-height: 1.5;
            }
            .receipt-container {
              border: 2px double #ccc;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
              border-radius: 8px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 24px;
              font-weight: 700;
              color: #1e3a8a;
              margin: 0;
            }
            .school-subtitle {
              font-size: 14px;
              color: #666;
              margin: 5px 0 0 0;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: 600;
              margin: 20px 0 10px 0;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .label {
              font-weight: 600;
              color: #555;
              font-size: 13px;
              text-transform: uppercase;
            }
            .value {
              font-size: 16px;
              color: #111;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 2px;
              margin-top: 4px;
            }
            .amount-section {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 6px;
              margin-bottom: 50px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-left: 5px solid #3b82f6;
            }
            .amount-large {
              font-size: 28px;
              font-weight: 700;
              color: #1e3a8a;
            }
            .footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature-block {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 50px;
              padding-top: 5px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="school-name">EDUCORE-OMEGA ACADEMY</div>
              <div class="school-subtitle">Quality Education, Governed Excellence / தரமான கல்வி, சிறந்த நிர்வாகம்</div>
              <div class="receipt-title">${title}</div>
            </div>
            
            <div class="grid">
              <div class="info-item">
                <div class="label">${studentLabel}</div>
                <div class="value">${displayName}</div>
              </div>
              <div class="info-item">
                <div class="label">${receiptLabel}</div>
                <div class="value">${data.receiptNo}</div>
              </div>
              <div class="info-item">
                <div class="label">${rollLabel}</div>
                <div class="value">${data.rollNo}</div>
              </div>
              <div class="info-item">
                <div class="label">${dateLabel}</div>
                <div class="value">${data.date}</div>
              </div>
              <div class="info-item">
                <div class="label">${classLabel}</div>
                <div class="value">${data.className} - ${data.section}</div>
              </div>
              <div class="info-item">
                <div class="label">${typeLabel}</div>
                <div class="value">${data.feeType}</div>
              </div>
            </div>

            <div class="amount-section">
              <div>
                <div class="label">${methodLabel}</div>
                <div class="value" style="border:none; margin:0; padding:0;">${data.paymentMethod}</div>
              </div>
              <div>
                <div class="label" style="text-align:right;">${amountLabel}</div>
                <div class="amount-large">₹${data.amount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div class="footer">
              <div style="font-size:12px; color:#999;">
                System generated receipt. No signature required.
              </div>
              <div class="signature-block">
                <div class="signature-line">${authLabel}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    pdfExportService.printHTML(htmlContent);
  },

  /**
   * Export report card to print/PDF layout with Logo, Ranks, QR code, and signatures
   */
  exportReportCard: (data: ReportCardData, language: 'en' | 'ta' | 'bilingual') => {
    const isTa = language === 'ta';
    const isBi = language === 'bilingual';

    const title = isTa ? 'மதிப்பெண் அறிக்கை அட்டை' : isBi ? 'Academic Report Card / மதிப்பெண் அறிக்கை அட்டை' : 'Academic Report Card';
    const studentLabel = isTa ? 'மாணவர் பெயர்' : isBi ? 'Student Name / மாணவர் பெயர்' : 'Student Name';
    const admissionLabel = isTa ? 'அனுமதி எண்' : isBi ? 'Admission No / அனுமதி எண்' : 'Admission No';
    const rollLabel = isTa ? 'வரிசை எண்' : isBi ? 'Roll Number / வரிசை எண்' : 'Roll Number';
    const classLabel = isTa ? 'வகுப்பு' : isBi ? 'Class / வகுப்பு' : 'Class';
    const sectionLabel = isTa ? 'பிரிவு' : isBi ? 'Section / பிரிவு' : 'Section';
    const yearLabel = isTa ? 'கல்வியாண்டு' : isBi ? 'Academic Year / கல்வியாண்டு' : 'Academic Year';
    const examLabel = isTa ? 'தேர்வின் பெயர்' : isBi ? 'Examination / தேர்வின் பெயர்' : 'Examination';

    // Ranks translation
    const rankTitle = isTa ? 'மாணவர் தரவரிசை' : isBi ? 'Student Rankings / மாணவர் தரவரிசை' : 'Student Rankings';
    const schoolRankLabel = isTa ? 'பள்ளித் தரம்' : isBi ? 'School Rank / பள்ளித் தரம்' : 'School Rank';
    const classRankLabel = isTa ? 'வகுப்புத் தரம்' : isBi ? 'Class Rank / வகுப்புத் தரம்' : 'Class Rank';
    const sectionRankLabel = isTa ? 'பிரிவுத் தரம்' : isBi ? 'Section Rank / பிரிவுத் தரம்' : 'Section Rank';

    const subjectHeader = isTa ? 'பாடம்' : isBi ? 'Subject / பாடம்' : 'Subject';
    const marksHeader = isTa ? 'மதிப்பெண்கள்' : isBi ? 'Marks / மதிப்பெண்கள்' : 'Marks';
    const gradeHeader = isTa ? 'தரம்' : isBi ? 'Grade / தரம்' : 'Grade';
    const subjectRankHeader = isTa ? 'பாடத் தரம்' : isBi ? 'Subject Rank / பாடத் தரம்' : 'Subject Rank';
    const remarksHeader = isTa ? 'குறிப்புகள்' : isBi ? 'Remarks / குறிப்புகள்' : 'Remarks';

    const principalLabel = isTa ? 'முதல்வர் கையொப்பம்' : isBi ? 'Principal Signature / முதல்வர் கையொப்பம்' : 'Principal Signature';
    const teacherLabel = isTa ? 'வகுப்பாசிரியர் கையொப்பம்' : isBi ? 'Class Teacher Signature / வகுப்பாசிரியர் கையொப்பம்' : 'Class Teacher Signature';
    const secureSealLabel = isTa ? 'பாதுகாப்பான சரிபார்ப்பு முத்திரை' : isBi ? 'Secure Verification Seal / பாதுகாப்பு முத்திரை' : 'Secure Verification Seal';

    const displayName = (isTa || isBi) && data.studentNameTamil ? `${data.studentName} (${data.studentNameTamil})` : data.studentName;
    const displayExam = (isTa || isBi) && data.examTitleTamil ? data.examTitleTamil : data.examTitle;

    const tableRows = data.subjects.map(s => {
      const subjectName = isTa ? s.nameTamil : isBi ? `${s.name} (${s.nameTamil})` : s.name;
      const remarks = isTa ? s.remarksTamil : isBi ? `${s.remarks} (${s.remarksTamil})` : s.remarks;
      const subRank = s.subjectRank ? `#${s.subjectRank}` : '—';
      return `
        <tr>
          <td>${subjectName}</td>
          <td style="text-align: center; font-weight: bold;">${s.marks} / ${s.maxMarks}</td>
          <td style="text-align: center; font-weight: bold;">${s.grade}</td>
          <td style="text-align: center; color: #1e3a8a; font-weight: bold;">${subRank}</td>
          <td>${remarks}</td>
        </tr>
      `;
    }).join('');

    // Totals calculations
    const totalObtained = data.subjects.reduce((sum, s) => sum + s.marks, 0);
    const totalMax = data.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0';

    // Verification QR code URL
    const qrData = `VERIFIED: EDUCORE-OMEGA\nStudent: ${data.studentName}\nRoll No: ${data.rollNo}\nExam: ${data.examTitle}\nPercentage: ${overallPercentage}%`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', 'Noto Sans Tamil', sans-serif;
              margin: 40px;
              color: #1e293b;
              line-height: 1.5;
              background-color: #fff;
            }
            .report-container {
              border: 4px double #1e3a8a;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
              background: #fff;
              border-radius: 16px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 80px;
              font-weight: 800;
              color: rgba(30, 58, 138, 0.03);
              white-space: nowrap;
              user-select: none;
              pointer-events: none;
              z-index: 0;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 20px;
              margin-bottom: 25px;
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 10;
              position: relative;
            }
            .logo-svg {
              width: 65px;
              height: 65px;
              margin-bottom: 12px;
            }
            .school-name {
              font-size: 26px;
              font-weight: 800;
              color: #1e3a8a;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .school-subtitle {
              font-size: 13px;
              color: #475569;
              margin: 4px 0 0 0;
              font-weight: 500;
            }
            .report-title {
              font-size: 18px;
              font-weight: 700;
              margin: 15px 0 0 0;
              color: #1e3a8a;
              background-color: #f1f5f9;
              padding: 6px 20px;
              border-radius: 30px;
              border: 1px solid #cbd5e1;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 25px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              z-index: 10;
              position: relative;
            }
            .info-item {
              display: flex;
              align-items: baseline;
            }
            .info-label {
              font-weight: 600;
              width: 140px;
              color: #475569;
              font-size: 13px;
            }
            .info-val {
              color: #0f172a;
              font-weight: 700;
              font-size: 14px;
            }
            
            /* Ranks Block */
            .ranks-block {
              margin-bottom: 25px;
              background: linear-gradient(135deg, #1e3a8a, #0f172a);
              color: white;
              padding: 20px;
              border-radius: 12px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              text-align: center;
              box-shadow: 0 4px 10px rgba(30, 58, 138, 0.15);
              z-index: 10;
              position: relative;
            }
            .rank-item {
              border-right: 1px solid rgba(255, 255, 255, 0.15);
            }
            .rank-item:last-child {
              border-right: none;
            }
            .rank-label {
              font-size: 11px;
              color: #93c5fd;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .rank-value {
              font-size: 24px;
              font-weight: 800;
              margin-top: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              z-index: 10;
              position: relative;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 14px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #f1f5f9;
              color: #1e3a8a;
              font-weight: 700;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .total-row {
              background-color: #f1f5f9 !important;
              font-weight: 700;
            }
            
            .footer-block {
              display: grid;
              grid-template-columns: 1fr 2fr;
              gap: 30px;
              margin-top: 40px;
              align-items: flex-end;
              z-index: 10;
              position: relative;
            }
            .verification-box {
              border: 1px solid #e2e8f0;
              padding: 12px;
              border-radius: 12px;
              background-color: #f8fafc;
              display: flex;
              align-items: center;
              space-x: 15px;
            }
            .qr-code {
              width: 80px;
              height: 80px;
              margin-right: 12px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
            .verification-text {
              font-size: 10px;
              color: #64748b;
              line-height: 1.4;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              padding-bottom: 10px;
            }
            .sig-block {
              text-align: center;
              width: 180px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-top: 45px;
              padding-top: 6px;
              font-size: 12px;
              color: #475569;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="watermark">EDUCORE-OMEGA</div>
            
            <div class="header">
              <!-- SVG Logo -->
              <svg class="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1e3a8a"/>
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="school-name">EDUCORE-OMEGA ACADEMY</div>
              <div class="school-subtitle">Quality Education, Governed Excellence / தரமான கல்வி, சிறந்த நிர்வாகம்</div>
              <div class="report-title">${title}</div>
            </div>

            <div class="student-info">
              <div class="info-item">
                <span class="info-label">${studentLabel}:</span>
                <span class="info-val">${displayName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${admissionLabel}:</span>
                <span class="info-val">${data.admissionNo}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${classLabel} & ${sectionLabel}:</span>
                <span class="info-val">Class ${data.className} - ${data.section}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${rollLabel}:</span>
                <span class="info-val">${data.rollNo}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${examLabel}:</span>
                <span class="info-val">${displayExam}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${yearLabel}:</span>
                <span class="info-val">${data.academicYear}</span>
              </div>
            </div>

            <!-- Ranks Banner -->
            <div class="ranks-block">
              <div class="rank-item">
                <div class="rank-label">${schoolRankLabel}</div>
                <div class="rank-value">${data.schoolRank ? `#${data.schoolRank}` : '—'}</div>
              </div>
              <div class="rank-item">
                <div class="rank-label">${classRankLabel}</div>
                <div class="rank-value">${data.classRank ? `#${data.classRank}` : '—'}</div>
              </div>
              <div class="rank-item">
                <div class="rank-label">${sectionRankLabel}</div>
                <div class="rank-value">${data.sectionRank ? `#${data.sectionRank}` : '—'}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>${subjectHeader}</th>
                  <th style="text-align: center; width: 140px;">${marksHeader}</th>
                  <th style="text-align: center; width: 80px;">${gradeHeader}</th>
                  <th style="text-align: center; width: 110px;">${subjectRankHeader}</th>
                  <th>${remarksHeader}</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
                <tr class="total-row">
                  <td>Total Marks / மொத்த மதிப்பெண்</td>
                  <td style="text-align: center;">${totalObtained} / ${totalMax}</td>
                  <td style="text-align: center;">${overallPercentage}%</td>
                  <td style="text-align: center;">—</td>
                  <td>Grade: ${getGradeLetter(Number(overallPercentage))}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer-block">
              <!-- Verification QR box -->
              <div class="verification-box">
                <img class="qr-code" src="${qrCodeUrl}" alt="Verification QR"/>
                <div class="verification-text font-semibold">
                  <strong>${secureSealLabel}</strong><br/>
                  Scan to verify authentic digital records.<br/>
                  ID: E-OM-${data.admissionNo}-${data.rollNo}
                </div>
              </div>
              
              <!-- Signatures -->
              <div class="signatures">
                <div class="sig-block">
                  <div class="sig-line">${teacherLabel}</div>
                </div>
                <div class="sig-block">
                  <div class="sig-line">${principalLabel}</div>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    pdfExportService.printHTML(htmlContent);
  },

  /**
   * Export Subject Marksheet Register for the Admin Portal
   */
  exportMarksheetRegister: (data: MarksheetRegisterData, language: 'en' | 'ta' | 'bilingual') => {
    const isTa = language === 'ta';
    const isBi = language === 'bilingual';

    const title = isTa ? 'மதிப்பெண் பட்டியல் பதிவேடு' : isBi ? 'Marksheet Register / மதிப்பெண் பட்டியல் பதிவேடு' : 'Marksheet Register';
    
    const rollHeader = isTa ? 'எண்' : 'Roll No';
    const nameHeader = isTa ? 'மாணவர் பெயர்' : 'Student Name';
    const marksHeader = isTa ? 'மதிப்பெண்' : 'Obtained Marks';
    const gradeHeader = isTa ? 'தரம்' : 'Grade';
    const statusHeader = isTa ? 'நிலை' : 'Status';
    const remarksHeader = isTa ? 'குறிப்புகள்' : 'Remarks';

    const teacherLabel = isTa ? 'ஆசிரியர் கையொப்பம்' : 'Teacher Signature';
    const adminLabel = isTa ? 'நிர்வாக ஒப்புதல் கையொப்பம்' : 'Admin Approval Signature';

    const rows = data.records.map(r => {
      const isFail = r.status === 'Present' && Number(r.marks || 0) < Number(r.passMark);
      const marksVal = r.status === 'Present' ? `${r.marks} / ${r.maxMarks}` : '—';
      return `
        <tr style="${isFail ? 'background-color: #fef2f2;' : ''}">
          <td style="text-align: center; font-weight: 600;">${r.rollNo}</td>
          <td style="font-weight: 500;">${r.studentName}</td>
          <td style="text-align: center; font-weight: bold; ${isFail ? 'color: #ef4444;' : ''}">${marksVal}</td>
          <td style="text-align: center; font-weight: bold;">${r.status === 'Present' ? r.grade : '—'}</td>
          <td style="text-align: center;">
            <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; ${
              r.status === 'Present' ? (isFail ? 'background-color: #fee2e2; color: #991b1b;' : 'background-color: #dcfce7; color: #166534;') :
              'background-color: #f1f5f9; color: #475569;'
            }">
              ${r.status}
            </span>
          </td>
          <td style="font-style: italic; font-size: 12px; color: #475569;">${r.remarks || '—'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 40px;
              color: #1e293b;
              line-height: 1.5;
            }
            .register-container {
              max-width: 900px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .school-name {
              font-size: 24px;
              font-weight: 800;
              color: #1e3a8a;
            }
            .school-subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 3px;
            }
            .register-title {
              font-size: 16px;
              font-weight: 700;
              margin-top: 10px;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 20px;
              font-size: 13px;
            }
            .meta-item strong {
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              font-size: 12px;
            }
            th {
              background-color: #f1f5f9;
              color: #1e3a8a;
              font-weight: 700;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .sig-block {
              text-align: center;
              width: 220px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 12px;
              color: #475569;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="register-container">
            <div class="header">
              <div class="school-name">EDUCORE-OMEGA ACADEMY</div>
              <div class="school-subtitle">Quality Education, Governed Excellence / தரமான கல்வி, சிறந்த நிர்வாகம்</div>
              <div class="register-title">${title}</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item"><strong>Exam:</strong> ${data.examTitle}</div>
              <div class="meta-item"><strong>Class / Sec:</strong> Class ${data.className} - ${data.section}</div>
              <div class="meta-item"><strong>Subject:</strong> ${data.subject}</div>
              <div class="meta-item"><strong>Teacher:</strong> ${data.teacherName}</div>
              <div class="meta-item"><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
              <div class="meta-item"><strong>Total Students:</strong> ${data.records.length}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 60px; text-align: center;">${rollHeader}</th>
                  <th>${nameHeader}</th>
                  <th style="width: 120px; text-align: center;">${marksHeader}</th>
                  <th style="width: 80px; text-align: center;">${gradeHeader}</th>
                  <th style="width: 100px; text-align: center;">${statusHeader}</th>
                  <th>${remarksHeader}</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line">${teacherLabel}</div>
              </div>
              <div class="sig-block">
                <div class="sig-line">${adminLabel}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    pdfExportService.printHTML(htmlContent);
  },

  /**
   * Helper to print HTML via a hidden iframe
   */
  printHTML: (htmlContent: string) => {
    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 2. Write the HTML content into the iframe
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }

    // 3. Remove the iframe after printing is completed or cancelled
    // Clean up after 1 minute (giving ample time for native print popup to open and close)
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 60000);
  }
};

export default pdfExportService;
