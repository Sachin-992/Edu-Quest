import os

FILES = [
    r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\student\StudentDashboard.tsx",
    r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\teacher\TeacherDashboard.tsx",
    r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\ParentDashboard.tsx"
]

for file_path in FILES:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace selected{t('teacherPortal.section')} or selected{t('studentPortal.section')}
        content = content.replace("selected{t('teacherPortal.section')}", "selectedSection")
        content = content.replace("selected{t('studentPortal.section')}", "selectedSection")
        content = content.replace("selected{t('parentPortal.section')}", "selectedSection")
        content = content.replace("current{t('teacherPortal.section')}", "currentSection")
        
        # Also let's check for classSection
        content = content.replace("class{t('teacherPortal.section')}", "classSection")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {file_path}")
