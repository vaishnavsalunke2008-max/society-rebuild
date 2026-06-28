export type Lang = "en" | "hi" | "mr" | "te" | "ta";

type TranslationMap = Record<string, Record<Lang, string>>;

export const translations: TranslationMap = {
  // ── Navigation ────────────────────────────────────────────
  "nav.updates":    { en: "Updates",    hi: "अपडेट",      mr: "अपडेट्स",    te: "నవీకరణలు",       ta: "புதுப்பிப்பு" },
  "nav.community":  { en: "Community",  hi: "समुदाय",     mr: "समुदाय",      te: "సమాజం",          ta: "சமூகம்" },
  "nav.complaints": { en: "Complaints", hi: "शिकायतें",   mr: "तक्रारी",    te: "ఫిర్యాదులు",     ta: "புகார்கள்" },
  "nav.events":     { en: "Events",     hi: "कार्यक्रम",  mr: "कार्यक्रम", te: "ఈవెంట్లు",       ta: "நிகழ்வுகள்" },
  "nav.chat":       { en: "Chat",       hi: "चैट",        mr: "चॅट",         te: "చాట్",           ta: "அரட்டை" },
  "nav.notices":    { en: "Notices",    hi: "नोटिस",      mr: "सूचना",       te: "నోటీసులు",       ta: "அறிவிப்புகள்" },
  "nav.messages":   { en: "Messages",   hi: "संदेश",      mr: "संदेश",       te: "సందేశాలు",       ta: "செய்திகள்" },

  // ── Page: Updates ─────────────────────────────────────────
  "updates.title":    { en: "Updates",                  hi: "अपडेट",              mr: "अपडेट्स",           te: "నవీకరణలు",              ta: "புதுப்பிப்புகள்" },
  "updates.subtitle": { en: "Notices & Announcements",  hi: "नोटिस और घोषणाएं",   mr: "नोटीस आणि घोषणा",  te: "నోటీసులు & ప్రకటనలు",  ta: "அறிவிப்புகள்" },
  "updates.empty":    { en: "No notices yet",           hi: "कोई नोटिस नहीं",     mr: "कोणतीही सूचना नाही", te: "నోటీసులు లేవు",       ta: "அறிவிப்புகள் இல்லை" },
  "updates.emptySub": { en: "Check back later for society announcements", hi: "बाद में देखें", mr: "नंतर तपासा", te: "తర్వాత తనిఖీ చేయండి", ta: "பின்னர் சரிபார்க்கவும்" },

  // ── Page: Community ───────────────────────────────────────
  "community.title":    { en: "Community",          hi: "समुदाय",          mr: "समुदाय",          te: "సమాజం",           ta: "சமூகம்" },
  "community.subtitle": { en: "Residents feed",     hi: "निवासियों की फ़ीड", mr: "रहिवाशांचा फीड", te: "నివాసుల ఫీడ్",    ta: "குடியிருப்பாளர்கள்" },
  "community.post":     { en: "Post",               hi: "पोस्ट",           mr: "पोस्ट",           te: "పోస్ట్",          ta: "இடுகை" },
  "community.share":    { en: "Share",              hi: "शेयर करें",       mr: "शेअर करा",       te: "షేర్ చేయి",       ta: "பகிர்" },
  "community.whats":    { en: "What's on your mind?", hi: "क्या सोच रहे हैं?", mr: "काय वाटते?",  te: "మీ మనసులో ఏముంది?", ta: "என்ன நினைக்கிறீர்கள்?" },
  "community.photo":    { en: "Photo",              hi: "फ़ोटो",            mr: "फोटो",            te: "ఫోటో",            ta: "புகைப்படம்" },
  "community.comment":  { en: "Comment",            hi: "टिप्पणी",         mr: "टिप्पणी",         te: "వ్యాఖ్య",         ta: "கருத்து" },
  "community.empty":    { en: "No posts yet",       hi: "कोई पोस्ट नहीं",  mr: "कोणतीही पोस्ट नाही", te: "పోస్ట్లు లేవు",  ta: "இடுகைகள் இல்லை" },
  "community.emptySub": { en: "Be the first to share something!", hi: "पहले शेयर करें!", mr: "प्रथम शेअर करा!", te: "మొదటిగా పంచుకోండి!", ta: "முதலில் பகிரவும்!" },

  // ── Page: Complaints ──────────────────────────────────────
  "complaints.title":    { en: "Complaints",         hi: "शिकायतें",        mr: "तक्रारी",         te: "ఫిర్యాదులు",      ta: "புகார்கள்" },
  "complaints.subtitle": { en: "Raise & track issues", hi: "समस्याएं दर्ज करें", mr: "समस्या नोंदवा", te: "సమస్యలు నమోదు చేయండి", ta: "சிக்கல்களை பதிவு செய்யவும்" },
  "complaints.raise":    { en: "Raise",              hi: "दर्ज करें",       mr: "नोंद करा",        te: "దాఖలు",           ta: "பதிவு" },
  "complaints.new":      { en: "New Complaint",      hi: "नई शिकायत",       mr: "नवीन तक्रार",    te: "కొత్త ఫిర్యాదు",  ta: "புதிய புகார்" },
  "complaints.title2":   { en: "Title",              hi: "शीर्षक",          mr: "शीर्षक",          te: "శీర్షిక",         ta: "தலைப்பு" },
  "complaints.desc":     { en: "Describe the issue...", hi: "समस्या बताएं...", mr: "समस्या वर्णन करा...", te: "సమస్యను వివరించండి...", ta: "சிக்கலை விவரிக்கவும்..." },
  "complaints.submit":   { en: "Submit",             hi: "जमा करें",        mr: "सबमिट करा",      te: "సమర్పించు",       ta: "சமர்ப்பி" },
  "complaints.empty":    { en: "No complaints raised", hi: "कोई शिकायत नहीं", mr: "कोणतीही तक्रार नाही", te: "ఫిర్యాదులు లేవు", ta: "புகார்கள் இல்லை" },
  "complaints.emptySub": { en: "Tap \"+Raise\" to report an issue", hi: "\"+दर्ज करें\" दबाएं", mr: "\"+नोंद करा\" टॅप करा", te: "\"+దాఖలు\" నొక్కండి", ta: "\"+பதிவு\" அழுத்தவும்" },
  "complaints.status.pending":     { en: "Pending",     hi: "लंबित",     mr: "प्रलंबित",  te: "పెండింగ్",     ta: "நிலுவை" },
  "complaints.status.in_progress": { en: "In Progress", hi: "जारी है",   mr: "प्रगतीत",  te: "పురోగతిలో",    ta: "செயல்பாட்டில்" },
  "complaints.status.resolved":    { en: "Resolved",    hi: "हल हुआ",   mr: "सोडवले",   te: "పరిష్కరించబడింది", ta: "தீர்க்கப்பட்டது" },

  // ── Page: Events ──────────────────────────────────────────
  "events.title":    { en: "Society Events",      hi: "सोसाइटी कार्यक्रम", mr: "सोसायटी कार्यक्रम", te: "సొసైటీ ఈవెంట్లు",  ta: "சமூக நிகழ்வுகள்" },
  "events.subtitle": { en: "Upcoming activities", hi: "आगामी गतिविधियां",   mr: "आगामी उपक्रम",      te: "రాబోయే కార్యక్రమాలు", ta: "வரவிருக்கும் நிகழ்வுகள்" },
  "events.upcoming": { en: "Upcoming",            hi: "आगामी",              mr: "येणारे",            te: "రాబోయే",           ta: "வரவிருக்கும்" },
  "events.past":     { en: "Past",                hi: "पिछले",              mr: "मागील",             te: "గత",               ta: "கடந்த" },
  "events.rsvp":     { en: "RSVP — I'm attending", hi: "मैं आऊंगा",         mr: "मी येतो",           te: "నేను వస్తున్నాను",  ta: "நான் வருகிறேன்" },
  "events.going":    { en: "Going!",              hi: "जा रहे हैं!",        mr: "येत आहे!",          te: "వస్తున్నాను!",      ta: "போகிறேன்!" },
  "events.attending":{ en: "attending",           hi: "उपस्थित",            mr: "उपस्थित",           te: "హాజరవుతున్నారు",    ta: "கலந்துகொள்கின்றனர்" },
  "events.empty":    { en: "No events yet",       hi: "कोई कार्यक्रम नहीं", mr: "कोणताही कार्यक्रम नाही", te: "ఈవెంట్లు లేవు",  ta: "நிகழ்வுகள் இல்லை" },
  "events.emptySub": { en: "Events will appear here when created", hi: "कार्यक्रम यहां दिखेंगे", mr: "कार्यक्रम येथे दिसतील", te: "ఈవెంట్లు ఇక్కడ కనిపిస్తాయి", ta: "நிகழ்வுகள் இங்கே தோன்றும்" },

  // ── Page: Chat ────────────────────────────────────────────
  "chat.title":      { en: "Chat",                    hi: "चैट",              mr: "चॅट",              te: "చాట్",             ta: "அரட்டை" },
  "chat.subtitle":   { en: "Message the admin",       hi: "एडमिन को मैसेज करें", mr: "अॅडमिनला मेसेज करा", te: "అడ్మిన్‌కు మెసేజ్ చేయండి", ta: "நிர்வாகியிடம் தொடர்பு கொள்ளுங்கள்" },
  "chat.new":        { en: "New",                     hi: "नया",              mr: "नवीन",              te: "కొత్తది",           ta: "புதிய" },
  "chat.subject":    { en: "Subject",                 hi: "विषय",             mr: "विषय",              te: "విషయం",            ta: "விஷயம்" },
  "chat.message":    { en: "Write your message...",   hi: "संदेश लिखें...",   mr: "संदेश लिहा...",    te: "మీ సందేశం రాయండి...", ta: "உங்கள் செய்தியை எழுதுங்கள்..." },
  "chat.send":       { en: "Send Message",            hi: "संदेश भेजें",      mr: "संदेश पाठवा",      te: "సందేశం పంపు",      ta: "செய்தி அனுப்பு" },
  "chat.empty":      { en: "No conversations",        hi: "कोई बातचीत नहीं",  mr: "कोणतीही संभाषणे नाहीत", te: "సంభాషణలు లేవు", ta: "உரையாடல்கள் இல்லை" },
  "chat.emptySub":   { en: "Tap \"+New\" to message the admin", hi: "\"+नया\" दबाएं", mr: "\"+नवीन\" टॅप करा", te: "\"+కొత్తది\" నొక్కండి", ta: "\"+புதிய\" அழுத்தவும்" },
  "chat.type":       { en: "Type a message...",       hi: "संदेश टाइप करें...", mr: "संदेश टाइप करा...", te: "సందేశం టైప్ చేయండి...", ta: "செய்தி தட்டவும்..." },
  "chat.newConv":    { en: "New Conversation",        hi: "नई बातचीत",        mr: "नवीन संभाषण",      te: "కొత్త సంభాషణ",      ta: "புதிய உரையாடல்" },

  // ── Admin: Complaints ─────────────────────────────────────
  "admin.complaints.title":    { en: "Complaint Management", hi: "शिकायत प्रबंधन", mr: "तक्रार व्यवस्थापन", te: "ఫిర్యాదు నిర్వహణ", ta: "புகார் மேலாண்மை" },
  "admin.complaints.subtitle": { en: "Review and resolve issues", hi: "समस्याएं समीक्षा करें", mr: "समस्या पुनरावलोकन करा", te: "సమస్యలను సమీక్షించండి", ta: "சிக்கல்களை தீர்க்கவும்" },
  "admin.complaints.filter.all":         { en: "All",         hi: "सभी",      mr: "सर्व",    te: "అన్నీ",      ta: "அனைத்தும்" },
  "admin.complaints.filter.pending":     { en: "Pending",     hi: "लंबित",    mr: "प्रलंबित", te: "పెండింగ్", ta: "நிலுவை" },
  "admin.complaints.filter.in_progress": { en: "In Progress", hi: "जारी है",  mr: "प्रगतीत", te: "పురోగతిలో", ta: "செயல்பாட்டில்" },
  "admin.complaints.filter.resolved":    { en: "Resolved",    hi: "हल हुआ",  mr: "सोडवले",  te: "పరిష్కరించబడింది", ta: "தீர்க்கப்பட்டது" },

  // ── Admin: Notices ────────────────────────────────────────
  "admin.notices.title":    { en: "Send Notice",          hi: "नोटिस भेजें",      mr: "नोटीस पाठवा",        te: "నోటీసు పంపు",          ta: "அறிவிப்பு அனுப்பு" },
  "admin.notices.subtitle": { en: "Publish announcements", hi: "घोषणाएं प्रकाशित करें", mr: "घोषणा प्रकाशित करा", te: "ప్రకటనలు ప్రచురించండి", ta: "அறிவிப்புகளை வெளியிடவும்" },
  "admin.notices.new":      { en: "New",                  hi: "नया",               mr: "नवीन",                te: "కొత్తది",               ta: "புதிய" },
  "admin.notices.publish":  { en: "Publish",              hi: "प्रकाशित करें",     mr: "प्रकाशित करा",       te: "ప్రచురించు",            ta: "வெளியிடு" },
  "admin.notices.empty":    { en: "No notices published", hi: "कोई नोटिस नहीं",   mr: "कोणतीही सूचना नाही", te: "నోటీసులు లేవు",         ta: "அறிவிப்புகள் இல்லை" },
  "admin.notices.emptySub": { en: "Tap \"+New\" to create a notice", hi: "\"+नया\" दबाएं", mr: "\"+नवीन\" टॅप करा", te: "\"+కొత్తది\" నొక్కండి", ta: "\"+புதிய\" அழுத்தவும்" },
  "admin.notices.title2":   { en: "Title",                hi: "शीर्षक",            mr: "शीर्षक",              te: "శీర్షిక",               ta: "தலைப்பு" },
  "admin.notices.body":     { en: "Notice body...",        hi: "नोटिस की सामग्री...", mr: "नोटिसची सामग्री...", te: "నోటీసు విషయం...",      ta: "அறிவிப்பு உள்ளடக்கம்..." },
  "admin.notices.image":    { en: "Image",                hi: "छवि",               mr: "प्रतिमा",             te: "చిత్రం",                ta: "படம்" },
  "admin.notices.cat.general":     { en: "General",     hi: "सामान्य",   mr: "सामान्य",   te: "సాధారణ",    ta: "பொதுவான" },
  "admin.notices.cat.urgent":      { en: "Urgent",      hi: "तत्काल",    mr: "तातडीचे",   te: "అత్యవసరం",  ta: "அவசரம்" },
  "admin.notices.cat.event":       { en: "Event",       hi: "कार्यक्रम", mr: "कार्यक्रम", te: "ఈవెంట్",    ta: "நிகழ்வு" },
  "admin.notices.cat.maintenance": { en: "Maintenance", hi: "रखरखाव",   mr: "देखभाल",    te: "నిర్వహణ",   ta: "பராமரிப்பு" },

  // ── Admin: Events ─────────────────────────────────────────
  "admin.events.title":    { en: "Manage Events",      hi: "कार्यक्रम प्रबंधन", mr: "कार्यक्रम व्यवस्थापन", te: "ఈవెంట్లు నిర్వహించు",   ta: "நிகழ்வுகளை நிர்வகி" },
  "admin.events.subtitle": { en: "Create & organize events", hi: "कार्यक्रम बनाएं", mr: "कार्यक्रम तयार करा", te: "ఈవెంట్లు సృష్టించండి", ta: "நிகழ்வுகளை உருவாக்கவும்" },
  "admin.events.add":      { en: "Add",                hi: "जोड़ें",              mr: "जोडा",                te: "జోడించు",               ta: "சேர்க்கவும்" },
  "admin.events.create":   { en: "Create Event",       hi: "कार्यक्रम बनाएं",    mr: "कार्यक्रम तयार करा", te: "ఈవెంట్ సృష్టించు",     ta: "நிகழ்வை உருவாக்கு" },
  "admin.events.name":     { en: "Event name",         hi: "कार्यक्रम का नाम",   mr: "कार्यक्रमाचे नाव",   te: "ఈవెంట్ పేరు",          ta: "நிகழ்வு பெயர்" },
  "admin.events.desc":     { en: "Description (optional)", hi: "विवरण (वैकल्पिक)", mr: "वर्णन (पर्यायी)",  te: "వివరణ (ఐచ్ఛికం)",      ta: "விளக்கம் (விருப்பமான)" },
  "admin.events.location": { en: "Location (optional)", hi: "स्थान (वैकल्पिक)",  mr: "ठिकाण (पर्यायी)",   te: "స్థానం (ఐచ్ఛికం)",     ta: "இடம் (விருப்பமான)" },
  "admin.events.empty":    { en: "No events created",  hi: "कोई कार्यक्रम नहीं", mr: "कोणताही कार्यक्रम नाही", te: "ఈవెంట్లు లేవు",      ta: "நிகழ்வுகள் இல்லை" },
  "admin.events.emptySub": { en: "Tap \"+Add\" to create an event", hi: "\"+जोड़ें\" दबाएं", mr: "\"+जोडा\" टॅप करा", te: "\"+జోడించు\" నొక్కండి", ta: "\"+சேர்\" அழுத்தவும்" },

  // ── Admin: Messages ───────────────────────────────────────
  "admin.messages.title":    { en: "Messages",              hi: "संदेश",              mr: "संदेश",              te: "సందేశాలు",              ta: "செய்திகள்" },
  "admin.messages.subtitle": { en: "Resident conversations", hi: "निवासी बातचीत",   mr: "रहिवासी संभाषणे",   te: "నివాసి సంభాషణలు",      ta: "குடியிருப்பாளர் உரையாடல்கள்" },
  "admin.messages.unread":   { en: "unread",                hi: "अपठित",              mr: "न वाचलेले",          te: "చదవబడలేదు",             ta: "படிக்காத" },
  "admin.messages.empty":    { en: "No messages",           hi: "कोई संदेश नहीं",    mr: "कोणतेही संदेश नाहीत", te: "సందేశాలు లేవు",         ta: "செய்திகள் இல்லை" },
  "admin.messages.emptySub": { en: "Resident messages will appear here", hi: "निवासी संदेश यहां दिखेंगे", mr: "रहिवासी संदेश येथे दिसतील", te: "నివాసి సందేశాలు ఇక్కడ కనిపిస్తాయి", ta: "குடியிருப்பாளர் செய்திகள் இங்கே தோன்றும்" },
  "admin.messages.reply":    { en: "Reply to resident...",  hi: "निवासी को जवाब दें...", mr: "रहिवाशाला उत्तर द्या...", te: "నివాసికి జవాబు ఇవ్వండి...", ta: "குடியிருப்பாளருக்கு பதிலளிக்கவும்..." },

  // ── Sidebar ───────────────────────────────────────────────
  "sidebar.darkMode":     { en: "Dark Mode",      hi: "डार्क मोड",    mr: "डार्क मोड",    te: "డార్క్ మోడ్",   ta: "இருண்ட முறை" },
  "sidebar.lightMode":    { en: "Light Mode",     hi: "लाइट मोड",     mr: "लाइट मोड",     te: "లైట్ మోడ్",    ta: "வெளிர் முறை" },
  "sidebar.language":     { en: "Language",       hi: "भाषा",          mr: "भाषा",          te: "భాష",           ta: "மொழி" },
  "sidebar.feedback":     { en: "Send Feedback",  hi: "फीडबैक भेजें", mr: "अभिप्राय पाठवा", te: "అభిప్రాయం పంపు", ta: "கருத்து அனுப்பு" },
  "sidebar.signedAs":     { en: "Signed in as",   hi: "के रूप में लॉग इन", mr: "म्हणून साइन इन", te: "గా సైన్ ఇన్ అయ్యారు", ta: "என்று உள்நுழைந்தீர்கள்" },
  "sidebar.switchRole":   { en: "Switch role in AuthContext.tsx", hi: "भूमिका बदलें", mr: "भूमिका बदला", te: "పాత్ర మార్చండి", ta: "பாத்திரத்தை மாற்றவும்" },

  // ── Avatar Dropdown ───────────────────────────────────────
  "avatar.profile":  { en: "Profile",   hi: "प्रोफ़ाइल", mr: "प्रोफाइल", te: "ప్రొఫైల్", ta: "சுயவிவரம்" },
  "avatar.signOut":  { en: "Sign Out",  hi: "साइन आउट",  mr: "साइन आउट", te: "సైన్ అవుట్", ta: "வெளியேறு" },

  // ── Common ────────────────────────────────────────────────
  "common.loading":    { en: "Loading...",  hi: "लोड हो रहा है...", mr: "लोड होत आहे...", te: "లోడ్ అవుతోంది...", ta: "ஏற்றுகிறது..." },
  "common.noData":     { en: "No data",     hi: "कोई डेटा नहीं",   mr: "कोणताही डेटा नाही", te: "డేటా లేదు",     ta: "தரவு இல்லை" },
  "common.flat":       { en: "Flat",        hi: "फ्लैट",            mr: "फ्लॅट",           te: "ఫ్లాట్",          ta: "அபார்ட்மென்ட்" },
  "common.admin":      { en: "Admin",       hi: "एडमिन",            mr: "अॅडमिन",          te: "అడ్మిన్",          ta: "நிர்வாகி" },
  "common.resident":   { en: "Resident",    hi: "निवासी",           mr: "रहिवासी",         te: "నివాసి",           ta: "குடியிருப்பாளர்" },
  "common.security":   { en: "Security",    hi: "सुरक्षा",          mr: "सुरक्षा",         te: "భద్రత",            ta: "பாதுகாப்பு" },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry["en"] ?? key;
}
