import os

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_len = len(content)
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if len(content) != original_len or any(old in content for old in replacements.keys()):
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully updated {filepath}")
    else:
        print(f"No changes made in {filepath}")

# 1. Update LoginScreen.tsx
login_replacements = {
    "const isTamil = i18n.language === 'ta';": "const isTamil = i18n.language?.startsWith('ta');"
}
replace_in_file("components/LoginScreen.tsx", login_replacements)

# 2. Update NotificationCenter.tsx
notif_replacements = {
    "i18n.language === 'ta' ? 'ta-IN' : 'en-IN'": "i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN'"
}
replace_in_file("components/NotificationCenter.tsx", notif_replacements)

# 3. Update TeacherDashboard.tsx
teacher_replacements = {
    "i18n.language === 'ta' ? 'ta-IN' : 'en-IN'": "i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN'"
}
replace_in_file("components/teacher/TeacherDashboard.tsx", teacher_replacements)

# 4. Update ParentDashboard.tsx (both language checks and PARENT_QUOTES)
# Let's read ParentDashboard.tsx to do replacements
parent_path = "components/ParentDashboard.tsx"
if os.path.exists(parent_path):
    with open(parent_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace language checks
    content = content.replace("i18n.language === 'ta' ? 'ta-IN' : 'en-IN'", "i18n.language?.startsWith('ta') ? 'ta-IN' : 'en-IN'")

    # Replace PARENT_QUOTES array with bilingual version
    old_quotes = """// Daily motivational message for parents
const PARENT_QUOTES = [
    { quote: "A child's education is a partnership between school and home.", author: "EDUCORE-OMEGA" },
    { quote: "The more you know, the more you grow - together.", author: "Parent Portal" },
    { quote: "Trust, transparency, and togetherness build great futures.", author: "EDUCORE-OMEGA" },
    { quote: "Support your child's learning journey with patience and love.", author: "School Principal" },
];"""

    new_quotes = """// Daily motivational message for parents
const PARENT_QUOTES = [
    { 
        en: { quote: "A child's education is a partnership between school and home.", author: "EDUCORE-OMEGA" },
        ta: { quote: "ஒரு குழந்தையின் கல்வி என்பது பள்ளிக்கும் வீட்டிற்கும் இடையிலான கூட்டாண்மை.", author: "எடுகோர்-ஒமேகா" }
    },
    { 
        en: { quote: "The more you know, the more you grow - together.", author: "Parent Portal" },
        ta: { quote: "நீங்கள் எவ்வளவு அதிகமாக அறிந்துகொள்கிறீர்களோ, அவ்வளவு அதிகமாக ஒன்றாக வளர்கிறீர்கள்.", author: "பெற்றோர் தளம்" }
    },
    { 
        en: { quote: "Trust, transparency, and togetherness build great futures.", author: "EDUCORE-OMEGA" },
        ta: { quote: "நம்பிக்கை, வெளிப்படைத்தன்மை மற்றும் ஒற்றுமை ஆகியவை சிறந்த எதிர்காலத்தை உருவாக்குகின்றன.", author: "எடுகோர்-ஒமேகா" }
    },
    { 
        en: { quote: "Support your child's learning journey with patience and love.", author: "School Principal" },
        ta: { quote: "உங்கள் குழந்தையின் கற்றல் பயணத்தை பொறுமையுடனும் அன்புடனும் ஆதரியுங்கள்.", author: "பள்ளி முதல்வர்" }
    },
];"""

    content = content.replace(old_quotes, new_quotes)

    # Replace dailyQuote selection line
    content = content.replace(
        "const dailyQuote = PARENT_QUOTES[new Date().getDate() % PARENT_QUOTES.length];",
        "const selectedQuoteObj = PARENT_QUOTES[new Date().getDate() % PARENT_QUOTES.length];\n    const dailyQuote = i18n.language?.startsWith('ta') ? selectedQuoteObj.ta : selectedQuoteObj.en;"
    )

    with open(parent_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated components/ParentDashboard.tsx")
