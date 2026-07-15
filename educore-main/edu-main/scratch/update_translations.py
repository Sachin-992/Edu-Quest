import json
import os

def update_locale_file(filepath, updates):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for path, value in updates.items():
        parts = path.split('.')
        ref = data
        for part in parts[:-1]:
            if part not in ref:
                ref[part] = {}
            ref = ref[part]
        ref[parts[-1]] = value
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Successfully updated {filepath}")

# English updates
en_updates = {
    "dashboard.feedback": "Questions & Doubts",
    "dashboard.studentParentFeedback": "Questions & Doubts Portal",
    "studentPortal.myFeedback": "Questions & Doubts",
    "studentPortal.submitFeedback": "Ask Doubt",
    "studentPortal.submitNewFeedback": "Ask a New Question / Doubt",
    "studentPortal.describeFeedbackPlaceholder": "Describe your question or doubt in detail...",
    "studentPortal.feedbackSuccess": "Question submitted successfully!",
    "studentPortal.feedbackFailure": "Failed to submit question",
    "studentPortal.noFeedbackYet": "No Doubts Asked Yet",
    "studentPortal.tapSubmitFeedback": "Tap 'Ask Doubt' to ask a question to your subject teacher.",
    "studentPortal.adminResponse": "Teacher Response",
    "studentPortal.selectSubject": "Select Subject",
    "studentPortal.assignedTeacher": "Assigned Teacher",
    "studentPortal.noTeacherAssigned": "No teacher assigned",
    "studentPortal.feedbackHistory": "Questions History",
    "studentPortal.briefTitlePlaceholder": "Brief title for your question"
}

# Tamil updates
ta_updates = {
    "dashboard.feedback": "சந்தேகங்கள் & கேள்விகள்",
    "dashboard.studentParentFeedback": "சந்தேகங்கள் & கேள்விகள் போர்டல்",
    "studentPortal.myFeedback": "சந்தேகங்கள் & கேள்விகள்",
    "studentPortal.submitFeedback": "சந்தேகம் கேட்கவும்",
    "studentPortal.submitNewFeedback": "புதிய கேள்வி / சந்தேகம் கேட்கவும்",
    "studentPortal.describeFeedbackPlaceholder": "உங்கள் கேள்வி அல்லது சந்தேகத்தை விரிவாக விவரிக்கவும்...",
    "studentPortal.feedbackSuccess": "கேள்வி வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
    "studentPortal.feedbackFailure": "கேள்வியைச் சமர்ப்பிப்பதில் தோல்வி",
    "studentPortal.noFeedbackYet": "இதுவரை எந்த சந்தேகங்களும் கேட்கப்படவில்லை",
    "studentPortal.tapSubmitFeedback": "உங்கள் பாட ஆசிரியரிடம் கேள்வி கேட்க 'சந்தேகம் கேட்கவும்' என்பதைத் தட்டவும்.",
    "studentPortal.adminResponse": "ஆசிரியர் பதில்",
    "studentPortal.selectSubject": "பாடம் தேர்ந்தெடுக்கவும்",
    "studentPortal.assignedTeacher": "ஒதுக்கப்பட்ட ஆசிரியர்",
    "studentPortal.noTeacherAssigned": "ஆசிரியர் ஒதுக்கப்படவில்லை",
    "studentPortal.feedbackHistory": "கேள்விகள் வரலாறு",
    "studentPortal.briefTitlePlaceholder": "உங்கள் கேள்வியின் சுருக்கமான தலைப்பு"
}

update_locale_file("locales/en.json", en_updates)
update_locale_file("locales/ta.json", ta_updates)
