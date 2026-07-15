import json
import os

en_path = "c:/Users/Ragu/Downloads/edu-core/edu-main/locales/en.json"
ta_path = "c:/Users/Ragu/Downloads/edu-core/edu-main/locales/ta.json"

en_data = {
  "attendanceIntel": {
    "title": "Attendance Intelligence Platform",
    "commandCenter": "Attendance Command Center",
    "commandCenterDesc": "School-wide enterprise analytics, trend analysis, and reports.",
    "kpi": {
      "totalStudents": "Total Students",
      "presentToday": "Present Today",
      "absentToday": "Absent Today",
      "lateToday": "Late Today",
      "leaveToday": "Leave Today",
      "attendanceRate": "Attendance Rate",
      "workingDays": "Working Days",
      "presentDays": "Days Present",
      "absentDays": "Days Absent",
      "lateDays": "Days Late",
      "leaveDays": "Days Leave",
      "medicalLeave": "Medical Leave",
      "onDuty": "On Duty",
      "halfDay": "Half Day",
      "excusedLeave": "Excused Leave",
      "holiday": "Holiday",
      "specialPermission": "Special Permission",
      "transferPending": "Transfer Pending",
      "riskLevel": "Risk Level",
      "classesHandled": "Classes Handled",
      "entriesMade": "Attendance Entries",
      "averageAttendance": "Average Attendance"
    },
    "status": {
      "present": "Present",
      "absent": "Absent",
      "late": "Late",
      "medical_leave": "Medical Leave",
      "on_duty": "On Duty",
      "half_day": "Half Day",
      "excused_leave": "Excused Leave",
      "holiday": "Holiday",
      "special_permission": "Special Permission",
      "transfer_pending": "Transfer Pending"
    },
    "bulk": {
      "markAllPresent": "Mark All Present",
      "markAllAbsent": "Mark All Absent",
      "copyYesterday": "Copy Yesterday",
      "importAttendance": "Import Attendance",
      "quickAttendance": "Quick Attendance",
      "importSuccess": "Attendance imported successfully!",
      "importError": "Failed to import attendance. Check file format.",
      "copiedSuccess": "Yesterday's attendance copied successfully!",
      "quickSaveSuccess": "Quick attendance updated!"
    },
    "reports": {
      "title": "Attendance Reports Generator",
      "generate": "Generate Report",
      "exportPdf": "Export PDF",
      "exportExcel": "Export Excel",
      "exportCsv": "Export CSV",
      "print": "Print Report",
      "types": {
        "daily": "Daily Report",
        "weekly": "Weekly Report",
        "monthly": "Monthly Report",
        "term": "Term Report",
        "annual": "Annual Report",
        "student": "Student Report",
        "class": "Class Report",
        "teacher": "Teacher Report",
        "school": "School Report"
      }
    },
    "analytics": {
      "title": "Advanced Attendance Analytics",
      "trends": "Attendance Trends",
      "dailyTrend": "Daily Attendance Trend",
      "weeklyTrend": "Weekly Attendance Trend",
      "monthlyTrend": "Monthly Attendance Trend",
      "yearlyTrend": "Yearly Attendance Trend",
      "classCompare": "Class-wise Comparison",
      "sectionCompare": "Section-wise Comparison",
      "teacherCompare": "Teacher-wise Comparison",
      "subjectCompare": "Subject-wise Comparison",
      "gradeCompare": "Grade-wise Comparison",
      "highest": "Highest Attendance Student",
      "lowest": "Lowest Attendance Student",
      "average": "Class Average Attendance",
      "conducted": "Classes Conducted",
      "attended": "Classes Attended",
      "missed": "Classes Missed"
    },
    "risk": {
      "critical": "Critical Risk (< 60%)",
      "high": "High Risk (60% - 75%)",
      "medium": "Medium Risk (75% - 80%)",
      "low": "At Risk (80% - 90%)",
      "safe": "On Track (> 90%)",
      "atRiskList": "Student Risk List",
      "alertSent": "Low attendance alert sent to student, parent, and admin!",
      "warning": "Warning: Attendance percentage is critically low!"
    },
    "ai": {
      "title": "AI Attendance Insights",
      "dropped": "Attendance dropped by {{pct}}% this month.",
      "highestClass": "Class {{className}} has the highest attendance.",
      "riskStudent": "Student {{studentName}} is at risk due to attendance below {{pct}}%.",
      "lowerSubject": "{{lower}} attendance is lower than {{higher}}."
    },
    "portal": {
      "todaysAttendance": "Today's Attendance",
      "monthlyCalendar": "Monthly Attendance Calendar",
      "subjectStats": "Subject-wise Attendance",
      "weeklyTimetable": "Weekly Timetable",
      "lowAttendanceAlerts": "Low Attendance Alerts",
      "noAlerts": "No alerts. Attendance is on track!",
      "markPeriodAttendance": "Mark Period Attendance",
      "details": "Student Attendance Profile",
      "selectPeriod": "Select Period",
      "choosePeriod": "Choose Period..."
    }
  }
}

ta_data = {
  "attendanceIntel": {
    "title": "வருகை நுண்ணறிவுத் தளம்",
    "commandCenter": "வருகை கட்டுப்பாட்டு மையம்",
    "commandCenterDesc": "பள்ளி அளவிலான நிறுவன பகுப்பாய்வு, போக்கு பகுப்பாய்வு மற்றும் அறிக்கைகள்.",
    "kpi": {
      "totalStudents": "மொத்த மாணவர்கள்",
      "presentToday": "இன்று வந்தவர்கள்",
      "absentToday": "இன்று வராதவர்கள்",
      "lateToday": "இன்று தாமதமாக வந்தவர்கள்",
      "leaveToday": "இன்று விடுப்பில் உள்ளவர்கள்",
      "attendanceRate": "வருகை விகிதம்",
      "workingDays": "வேலை நாட்கள்",
      "presentDays": "வந்த நாட்கள்",
      "absentDays": "வராத நாட்கள்",
      "lateDays": "தாமத நாட்கள்",
      "leaveDays": "விடுப்பு நாட்கள்",
      "medicalLeave": "மருத்துவ விடுப்பு",
      "onDuty": "அலுவல் பணி (OD)",
      "halfDay": "அரை நாள்",
      "excusedLeave": "அனுமதிக்கப்பட்ட விடுப்பு",
      "holiday": "விடுமுறை",
      "specialPermission": "சிறப்பு அனுமதி",
      "transferPending": "இடமாற்றம் நிலுவையில் உள்ளது",
      "riskLevel": "ஆபத்து நிலை",
      "classesHandled": "கைாளப்பட்ட வகுப்புகள்",
      "entriesMade": "வருகைப் பதிவுகள்",
      "averageAttendance": "சராசரி வருகை"
    },
    "status": {
      "present": "Present",
      "absent": "Absent",
      "late": "Late",
      "medical_leave": "Medical Leave",
      "on_duty": "On Duty",
      "half_day": "Half Day",
      "excused_leave": "Excused Leave",
      "holiday": "Holiday",
      "special_permission": "Special Permission",
      "transfer_pending": "Transfer Pending"
    },
    "bulk": {
      "markAllPresent": "அனைவரையும் வந்ததாகக் குறிக்கவும்",
      "markAllAbsent": "அனைவரையும் வராததாகக் குறிக்கவும்",
      "copyYesterday": "நேற்றைய வருகையை நகலெடு",
      "importAttendance": "வருகையை இறக்குமதி செய்",
      "quickAttendance": "விரைவான வருகை",
      "importSuccess": "வருகை வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது!",
      "importError": "வருகையை இறக்குமதி செய்ய முடியவில்லை. கோப்பு வடிவமைப்பைச் சரிபார்க்கவும்.",
      "copiedSuccess": "நேற்றைய வருகை வெற்றிகரமாக நகலெடுக்கப்பட்டது!",
      "quickSaveSuccess": "விரைவான வருகை புதுப்பிக்கப்பட்டது!"
    },
    "reports": {
      "title": "வருகை அறிக்கை உருவாக்கி",
      "generate": "அறிக்கையை உருவாக்கு",
      "exportPdf": "PDF ஆக ஏற்றுமதி செய்",
      "exportExcel": "Excel ஆக ஏற்றுமதி செய்",
      "exportCsv": "CSV ஆக ஏற்றுமதி செய்",
      "print": "அச்சிடு",
      "types": {
        "daily": "தினசரி அறிக்கை",
        "weekly": "வாராந்திர அறிக்கை",
        "monthly": "மாதாந்திர அறிக்கை",
        "term": "பருவ அறிக்கை",
        "annual": "ஆண்டு அறிக்கை",
        "student": "மாணவர் அறிக்கை",
        "class": "வகுப்பு அறிக்கை",
        "teacher": "ஆசிரியர் அறிக்கை",
        "school": "பள்ளி அறிக்கை"
      }
    },
    "analytics": {
      "title": "மேம்பட்ட வருகை பகுப்பாய்வு",
      "trends": "வருகைப் போக்குகள்",
      "dailyTrend": "தினசரி வருகைப் போக்கு",
      "weeklyTrend": "வாராந்திர வருகைப் போக்கு",
      "monthlyTrend": "மாதாந்திர வருகைப் போக்கு",
      "yearlyTrend": "வருடாந்திர வருகைப் போக்கு",
      "classCompare": "வகுப்பு வாரியான ஒப்பீடு",
      "sectionCompare": "பிரிவு வாரியான ஒப்பீடு",
      "teacherCompare": "ஆசிரியர் வாரியான ஒப்பீடு",
      "subjectCompare": "பாடம் வாரியான ஒப்பீடு",
      "gradeCompare": "தர வகுப்பு வாரியான ஒப்பீடு",
      "highest": "அதிக வருகை கொண்ட மாணவர்",
      "lowest": "குறைந்த வருகை கொண்ட மாணவர்",
      "average": "வகுப்பு சராசரி வருகை",
      "conducted": "நடத்தப்பட்ட வகுப்புகள்",
      "attended": "வந்த வகுப்புகள்",
      "missed": "தவறிய வகுப்புகள்"
    },
    "risk": {
      "critical": "முக்கிய ஆபத்து நிலை (< 60%)",
      "high": "அதிக ஆபத்து நிலை (60% - 75%)",
      "medium": "நடுத்தர ஆபத்து நிலை (75% - 80%)",
      "low": "ஆபத்து நிலை (80% - 90%)",
      "safe": "சரியான பாதை (> 90%)",
      "atRiskList": "மாணவர் ஆபத்து பட்டியல்",
      "alertSent": "மாணவர், பெற்றோர் மற்றும் நிர்வாகிக்கு குறைந்த வருகை எச்சரிக்கை அனுப்பப்பட்டது!",
      "warning": "எச்சரிக்கை: வருகை சதவீதம் மிகக் குறைவாக உள்ளது!"
    },
    "ai": {
      "title": "AI வருகை நுண்ணறிவு",
      "dropped": "இந்த மாதம் வருகை {{pct}}% குறைந்துள்ளது.",
      "highestClass": "வகுப்பு {{className}} அதிக வருகையைக் கொண்டுள்ளது.",
      "riskStudent": "மாணவர் {{studentName}} வருகை {{pct}}%-க்கும் குறைவாக உள்ளதால் ஆபத்தில் உள்ளார்.",
      "lowerSubject": "{{lower}} வருகை {{higher}}-ஐ விடக் குறைவாக உள்ளது."
    },
    "portal": {
      "todaysAttendance": "இன்றைய வருகை",
      "monthlyCalendar": "மாதாந்திர வருகை நாட்காட்டி",
      "subjectStats": "பாடம் வாரியான வருகை",
      "weeklyTimetable": "வாராந்திர பாட அட்டவணை",
      "lowAttendanceAlerts": "குறைந்த வருகை எச்சரிக்கைகள்",
      "noAlerts": "எச்சரிக்கைகள் இல்லை. வருகை சரியான பாதையில் உள்ளது!",
      "markPeriodAttendance": "கால வருகையைக் குறிக்கவும்",
      "details": "மாணவர் வருகை சுயவிவரம்",
      "selectPeriod": "பாடவேளையைத் தேர்ந்தெடு",
      "choosePeriod": "பாடவேளையைத் தேர்ந்தெடு..."
    }
  }
}

# English
if os.path.exists(en_path):
    with open(en_path, "r", encoding="utf-8") as f:
        en = json.load(f)
    en.update(en_data)
    # Also add "attendanceIntel" under "dashboard" keys for superAdmin dashboard
    if "dashboard" in en:
        en["dashboard"]["attendanceIntel"] = "Attendance Intel"
        en["dashboard"]["attendanceIntelDesc"] = "Enterprise Attendance Command Center"
    with open(en_path, "w", encoding="utf-8") as f:
        json.dump(en, f, indent=2, ensure_ascii=False)
    print("Updated en.json successfully.")

# Tamil
if os.path.exists(ta_path):
    with open(ta_path, "r", encoding="utf-8") as f:
        ta = json.load(f)
    ta.update(ta_data)
    if "dashboard" in ta:
        ta["dashboard"]["attendanceIntel"] = "வருகை நுண்ணறிவு"
        ta["dashboard"]["attendanceIntelDesc"] = "வருகைக் கட்டுப்பாட்டு மையம்"
    with open(ta_path, "w", encoding="utf-8") as f:
        json.dump(ta, f, indent=2, ensure_ascii=False)
    print("Updated ta.json successfully.")
