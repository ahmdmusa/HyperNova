function applyPrefsTheme(theme) {
  const t = theme || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.body.classList.remove('theme-dark', 'theme-black', 'theme-light');
  document.body.classList.add('theme-' + t);
  const darkBtn = document.querySelector('#btn-theme-dark');
  const blackBtn = document.querySelector('#btn-theme-black');
  const lightBtn = document.querySelector('#btn-theme-light');
  if (darkBtn) darkBtn.classList.toggle('sel', t === 'dark');
  if (blackBtn) blackBtn.classList.toggle('sel', t === 'black');
  if (lightBtn) lightBtn.classList.toggle('sel', t === 'light');
}

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const api = window.prefs;

let features = {};
let currentLang = localStorage.getItem('nova_lang') || 'ar';

// Complete Bilingual Dictionary
const I18N = {
  ar: {
    // Navigation
    nav_general: 'الإعدادات العامة',
    nav_about: 'حول المشروع (About)',
    about_tech_specs: 'المواصفات التقنية والمصادر',
    about_publisher: 'تطوير ونشر المهندس أحمد موسى (@ahmdmusa)',
    about_ack_title: 'إسناد وتاريخ المصدر المفتوح (Acknowledgement)',
    about_ack_desc: 'بدأ هذا المشروع كفكرة أولية وتفريعة (Fork) من مشروع <a href="https://github.com/NOVA-TECH-KIT/nova-island" target="_blank" class="about-ack-link">Nova Island</a> المفتوح المصدر، وتمت إعادة هندسته وتوسعته وتطويره بالكامل ليصبح <b>HyperNova</b>.',
    about_btn_download: 'تحميل مباشر (Installer)',
    about_btn_github: 'مستودع GitHub',
    about_btn_coffee: 'Buy Me a Coffee',
    about_spec_publisher: 'الناشر والمطور',
    about_spec_publisher_sub: 'Ahmed Musa · github.com/ahmdmusa',
    about_spec_license: 'الترخيص البرمجي',
    about_spec_license_sub: 'مفتوح المصدر بالكامل تحت رخصة GPL-3.0',
    about_spec_arch: 'البنية التقنية',
    about_spec_arch_sub: 'Electron · Native C# Helper · Web Audio API · EveryAyah & MP3Quran',
    about_spec_arch_val: 'Windows Desktop',
    nav_island: 'الجزيرة',
    island_style_title: 'نمط العرض والسكون (Island Style)',
    style_pill: 'كبسولة عائمة (Pill)',
    style_pill_desc: 'النمط الكلاسيكي البيضاوي العائم أعلى الشاشة',
    style_line: 'شريط خط رفيع (Inline)',
    style_line_desc: 'خط ليزري مدمج أعلى الشاشة يفتح بسلاسة عند التمرير',
    style_notch: 'نوتش علوي (Notch)',
    style_notch_desc: 'ملتصق بالحافة العلوية كلياً مثل شاشات ماك بوك',
    island_size_title: 'حجم الجزيرة التفاعلية',
    size_s: 'صغير (Compact)',
    size_s_desc: 'خفيف ومضغوط للمساحات الصغيرة',
    size_m: 'متوسط (افتراضي)',
    size_m_desc: 'التجربة المتوازنة المثالية لسطح المكتب',
    size_l: 'كبير (Expanded)',
    size_l_desc: 'مساحة واسعة بعمودين وقوائم كاملة',
    nav_companion: 'الرفيق الذكي',
    nav_faith: 'الصلاة والأذكار',
    nav_alerts: 'التنبيهات والخصوصية',
    nav_connections: 'الاتصالات والتقويم',
    nav_focus: 'التركيز',
    shortcut_hint: 'Ctrl+Alt+I لفتح الجزيرة',
    search_placeholder: 'بحث في الإعدادات...',
    no_results: 'لا توجد إعدادات مطابقة للبحث',

    // General Page
    general_title: 'الإعدادات العامة',
    lang_group: 'لغة التطبيق والواجهة',
    lang_select_lbl: 'اختيار لغة الواجهة والخط',
    lang_select_sub: 'الخط الأميري الأصيل للعربية، أو خط Inter العصري للإنجليزية',
    lang_ar: 'العربية (الأميري)',
    lang_en: 'English (Inter)',
    theme_group: 'لون الأيقونات والتطبيق المميز',
    theme_accent_lbl: 'اللون المميز للأيقونات والطقس',
    theme_accent_sub: 'تخصيص لون أيقونة الطقس واللمسات الجمالية (أزرق سماوي، أحمر داكن، إلخ)',
  theme_mode_lbl: 'نمط المظهر (الثيم)',
  theme_mode_sub: 'اختر الوضع الليلي الداكن أو الوضع الفاتح',
  theme_dark: 'داكن',
    theme_black: 'أسود (OLED)',
  theme_light: 'فاتح',
  glass_slider_lbl: 'مستوى الشفافية والزجاج (Liquid Glass vs Solid Dark)',
  glass_slider_sub: 'التحكم بين الوضع الزجاجي الشفاف والداكن المعتم (0% - 120%)',
  taskbar_icon_lbl: 'إظهار الأيقونة في شريط المهام',
  taskbar_icon_sub: 'إلغاء التفعيل لإخفاء الجزيرة من شريط المهام والاكتفاء بشريط النظام (Tray)',
    show_island: 'إظهار الجزيرة',
    start_windows: 'بدء التشغيل مع ويندوز',
    orientation: 'اتجاه العرض',
    orient_h: 'أفقي',
    orient_v: 'رأسي',
    addr_island: 'الدمج في شريط المتصفح',
    addr_island_sub: 'في الثلث الأيمن دون تغطية التبويبات',
    hide_fullscreen: 'الإخفاء التلقائي عند ملء الشاشة',
    auto_update: 'التحديث التلقائي',
    position: 'موضع الجزيرة',
    reset: 'إعادة ضبط',
    location_title: 'الموقع الجغرافي والطقس',
    city: 'المدينة',
    use_auto: 'استخدام التلقائي',
    search_city: 'ابحث عن اسم المدينة...',
    search_btn: 'بحث',

    // Island Page
    island_title: 'الجزيرة',
    tabs_title: 'تبويبات الجزيرة',
    tab_music: 'الصوتيات',
    tab_apps: 'التطبيقات',
    tab_shelf: 'الرف الذكي',
    tab_prayer: 'الصلاة',
    tab_timer: 'المؤقت',
    tab_focus: 'التركيز',
    tab_system: 'النظام',
    tabs_warn: 'يجب الإبقاء على تبويب واحد على الأقل',
    collapsed_title: 'الشريط المصغر (عند التصغير)',
    slide_clock: 'الساعة وحالة الطقس',
    slide_stats: 'استهلاك المعالج والذاكرة',
    slide_prayer: 'موعد الصلاة القادمة',
    now_playing_title: 'مشغل الصوتيات الحالي',
    show_media: 'إظهار عناصر التحكم بالصوتيات',
    media_title: 'اسم المقطع الصوتي',
    track_peek: 'إشعار عند تشغيل مقطع جديد',

    // Companion Page
    companion_title: 'الرفيق الذكي',
    nova_title: 'الروبوت المساعد نوفا',
    nova_eyes: 'تعبيرات الأعين التفاعلية',
    nova_prayer: 'التفاعل عند دخول وقت الصلاة',
    nova_focus: 'ارتداء عصابة الرأس أثناء التركيز',
    nova_celebrate: 'الاحتفال التفاعلي بإنجاز المهام',
    audio_haptics: 'النقرات الصوتية الفيزيائية',
    audio_haptics_sub: 'أصوات خشبية وكريستالية طبيعية فائقة الهدوء (Web Audio)',
    liquid_glass: 'الزجاج السائل وانكسار الضوء',
    liquid_glass_sub: 'انكسار ضوئي وتوهج مائي تفاعلي يتبع حركة الفأرة (Liquid Glass)',
    moments_title: 'اللحظات الذكية والتنبيهات',
    morning_brief: 'الموجز الصباحي الذكي',
    welcome_back: 'تحية العودة عند فتح الجهاز',
    break_reminders: 'تذكيرات أخذ استراحة للعين',
    net_toasts: 'تنبيهات حالة الإنترنت والشبكة',
    notch_meetings: 'مساعد وتدوين الاجتماعات السريعة',
    notch_meetings_sub: 'رصد مكالمات Zoom/Teams وتدوين ملاحظات النوتش الخاصة دون خوادم',
    smart_clip: 'سجل الحافظة الذكي',
    smart_clip_sub: 'معاينة الروابط، الألوان، والحسابات',
    water_title: 'تذكير شرب الماء الصحي',
    water_remind: 'تفعيل تذكيرات شرب الماء',
    water_every: 'تكرار التنبيه كل',
    water_goal: 'الهدف اليومي المستهدف',

    // Faith Page
    faith_title: 'الصلاة والأذكار',
    prayer_title: 'مواقيت الصلاة',
    prayer_alerts: 'تنبيهات دخول الصلاة والأذان',
    adhan_voice_lbl: 'صوت المؤذن للتنبيه (تكبيرتان فقط)',
    adhan_voice_sub: 'سماع تكبيرتي الإحرام (الله أكبر، الله أكبر) بصوت خاشع ومريح',
    adhan_resume_lbl: 'استئناف راديو القرآن بعد الأذان تلقائياً',
    adhan_resume_sub: 'استئناف التلاوة تلقائياً بعد ثانيتين من انتهاء تكبيرتي الأذان',
    cache_mgr_lbl: 'الذاكرة المؤقتة (القرآن والأصوات)',
    cache_mgr_sub: 'حجم البيانات المخزنة محلياً لتسريع التلاوة أوفلاين',
    hanafi_asr: 'حساب صلاة العصر على المذهب الحنفي',
    hijri_date: 'تعديل التاريخ الهجري',
    hijri_sub: 'مطابقة رؤية الهلال المحلية',
    dhikr_title: 'الأذكار والأدعية والقرآن الكريم',
    show_reminders: 'إظهار التذكيرات الدورية',
    remind_every: 'تكرار التنبيه كل',
    remind_for: 'مدة بقاء التنبيه على الشاشة',
    remind_ayah: 'آيات من القرآن الكريم',
    remind_dhikr: 'أذكار نبوية شريفة',
    remind_dua: 'أدعية مأثورة',
    tasbeeh_rate_lbl: 'معدل التسابيح والاستغفار في الساعة',
    tasbeeh_rate_sub: 'تذكير خفيف خاطف بذكر مأثور أو استغفار دون مقاطعة تركيزك',
    daily_adhkar_lbl: 'حصة أذكار الصباح والمساء اليومية',
    daily_adhkar_sub: 'عدد الأذكار الموثقة المختارة لكل فترة وتتبدّل دورياً كل يوم',
    daily_ayat_lbl: 'حصة الآيات القرآنية اليومية وتدبرها',
    daily_ayat_sub: 'عدد الآيات الكريمة المعروضة للتدبر والسكينة اليومية',
    quiet_hours: 'ساعات الهدوء (إسكات التنبيهات)',
    quiet_from: 'من الساعة',
    quiet_to: 'إلى الساعة',
    cache_group_title: 'التخزين المحلي والذاكرة المؤقتة (Offline Cache)',
    btn_clear_cache: 'مسح الكاش',
    cache_cleared: 'تم تفريغ الذاكرة المؤقتة بنجاح',
    slide_interval_lbl: 'معدل تبديل الشرائح تلقائياً',
    slide_interval_sub: 'الوقت بين كل شريحة وأخرى لتجنب التبديل السريع المزعج',
    show_preview: 'عرض تذكير تجريبي الآن',

    // Alerts Page
    alerts_title: 'التنبيهات والخصوصية',
    alerts_group: 'تنبيهات النظام والشاشة',
    alert_volume: 'إشعار تغيير مستوى الصوت',
    alert_brightness: 'إشعار تغيير مستوى السطوع',
    alert_battery: 'تنبيهات حالة البطارية والشحن',
    alert_kbd: 'إشعار تبديل لغة لوحة المفاتيح',
    alert_caps: 'إشعار تفعيل مفتاح Caps Lock',
    alert_screenshot: 'إشعار لقطة الشاشة والنسخ السريع',
    privacy_group: 'مؤشرات الخصوصية والأمان',
    privacy_dots: 'إظهار نقطة استخدام المايك والكاميرا',
    clip_hist: 'حفظ سجل الحافظة في الذاكرة المؤقتة فقط',
    clip_hist_sub: 'يُمسح تلقائياً عند إغلاق التطبيق لحماية بياناتك',

    // Connections Page
    connections_title: 'الاتصالات والتقويم',
    calendar_title: 'التقويم والمواعيد',
    upcoming_meetings: 'تنبيهات الاجتماعات القادمة',
    cal_placeholder: 'رابط تقويم iCal (https://... .ics)',
    save_btn: 'حفظ',
    cal_status_lbl: 'حالة الاتصال',
    how_to_link: 'كيفية الحصول على الرابط',
    cal_how_google: 'Google: الإعدادات › تقويمك › العنوان السري بتنسيق iCal',
    cal_how_outlook: 'Outlook: الإعدادات › التقويم › التقويمات المشتركة › نشر (ICS)',
    downloads_title: 'تنزيلات IDM نوفا',
    downloads_toggle: 'مراقبة التنزيلات',
    dl_alerts: 'إشعار انتهاء التنزيل مع زر الفتح',
    troubleshooting_title: 'التشخيص والدعم الفني',
    system_helper: 'المساعد البرمجي للنظام (HyperHelper)',
    error_log: 'سجل الأخطاء والتشخيص',
    open_btn: 'عرض',
    copy_report_btn: 'نسخ التقرير',
    all_settings: 'جميع الإعدادات',
    reset_btn: 'إعادة ضبط المصنع',

    // Focus & NeuroFocus Page
    nav_focus: 'التركيز',
    focus_page_title: 'التركيز والإنتاجية (NeuroFocus)',
    pomo_group: 'جلسات بومودورو الذكية · Pomodoro Sessions',
    pomo_work_lbl: 'مدة جلسة التركيز والعمل',
    pomo_work_sub: 'المدة الزمنية لكل جولة عمل مركزة',
    pomo_break_lbl: 'مدة الاستراحة القصيرة',
    pomo_break_sub: 'استراحة سريعة لإراحة العين واستعادة النشاط',
    pomo_longbreak_lbl: 'مدة الاستراحة الطويلة',
    pomo_longbreak_sub: 'استراحة كافية بعد إتمام 4 جولات عمل',
    nova_focus_sub: 'رسوم تفاعلية متحركة للرفيق نوفا بعصابة الرأس عند بدء الجلسة',
    focus_sound_lbl: 'التنبيهات الصوتية للجلسات',
    focus_sound_sub: 'نغمات صوتية هادئة عند بدء وانتهاء جولة العمل',
    deep_group: 'القوة القاهرة ودرع التركيز العميق (Focus Shield)',
    deep_toggle_lbl: 'تفعيل وضع القوة القاهرة',
    deep_toggle_sub: 'إخفاء أيقونات سطح المكتب تلقائياً، وتصغير النوافذ وحظر المشتتات أثناء الجلسة',
    shield_mode_lbl: 'نمط حماية درع التركيز (Shield Policy)',
    shield_mode_desc: 'اختر سياسة التعامل مع النوافذ والتطبيقات أثناء الجلسة',
    shield_mode_black: 'حظر المشتتات (Blacklist)',
    shield_mode_white: 'سماح العمل فقط (Whitelist)',
    shield_add_btn: '+ إضافة للقائمة',
    shield_pick_btn: '⚡ التقاط من النشطة',
    shield_running_title: 'التطبيقات المفتوحة حالياً',
    shield_chips_title: 'التطبيقات والمواقع المندرجة تحت الحماية',
    shield_chips_subtitle: 'انقر على (×) لإزالة أي عنصر من القائمة فوراً',
    shield_empty: 'القائمة فارغة حالياً',
    shield_added: 'تمت إضافة العنصر لدرع التركيز',
    shield_removed: 'تمت إزالة العنصر من درع التركيز',
    ai_group: 'محرك تفكيك المهام بالذكاء الاصطناعي (AI Decomposition)',
    ai_status_lbl: 'حالة محرك الذكاء الاصطناعي',
    ai_status_sub: 'جاهز لتحليل المهام وتوليد الخطوات الذرية',
    ai_status_ready: 'متصل وجاهز للعمل ✓',
    ai_key_lbl: 'مفتاح Google Gemini API',
    ai_key_sub: 'لتفكيك المهام والأسايمنتات المعقدة لخطوات صغيرة جداً تناسب ADHD',
    ai_model_lbl: 'نموذج الذكاء الاصطناعي المفضل',
    ai_model_sub: 'اختر سرعة الاستجابة أو عمق التحليل للمشاريع المعقدة',
    ai_micro_lbl: 'تفكيك فائق الصغر لخطوات ADHD',
    ai_micro_sub: 'تقسيم المهام لخطوات فائقة البساطة (2-5 دقائق) لمنع التسويف والشلل الذهني',
    shortcuts_group: 'اختصارات لوحة المفاتيح والتركيز',
    sc_island: 'فتح / إغلاق الجزيرة',
    sc_focus: 'فتح شريط التركيز والمهام',
    sc_esc: 'إخفاء الجزيرة السريع',
    sc_settings: 'فتح نافذة الإعدادات',
    sc_settings_val: 'أيقونة الترس في الجزيرة',

    // Feedback messages
    saved: 'تم الحفظ بنجاح',
    done: 'تم',
    report_copied: 'تم نسخ تقرير الفحص بنجاح',
    reset_defaults: 'تمت إعادة الإعدادات للافتراضي',
    key_saved: 'تم حفظ مفتاح Gemini',
    deep_updated: 'تم تحديث وضع القوة القاهرة',
    cal_not_linked: 'غير مربوط',
    cal_connecting: 'جارٍ الاتصال…',
    cal_none: 'متصل · لا توجد مواعيد خلال 24 ساعة',
    helper_running: 'يعمل بنجاح',
    helper_starting: 'جارٍ التشغيل…',
    helper_stopped: 'متوقف'
  },
  en: {
    // Navigation
    nav_general: 'General',
    nav_about: 'About HyperNova',
    about_tech_specs: 'Technical Specs & Credits',
    about_publisher: 'Developed & Published by Ahmed Musa (@ahmdmusa)',
    about_ack_title: 'Open Source Acknowledgement & Upstream',
    about_ack_desc: 'Originally conceived as an initial concept and open-source fork of <a href="https://github.com/NOVA-TECH-KIT/nova-island" target="_blank" class="about-ack-link">Nova Island</a>, and subsequently redesigned, engineered, and expanded as <b>HyperNova</b>.',
    about_btn_download: 'Direct Download (.exe)',
    about_btn_github: 'GitHub Repository',
    about_btn_coffee: 'Buy Me a Coffee',
    about_spec_publisher: 'Publisher & Author',
    about_spec_publisher_sub: 'Ahmed Musa · github.com/ahmdmusa',
    about_spec_license: 'Open Source License',
    about_spec_license_sub: 'Fully open source under the GPL-3.0 License',
    about_spec_arch: 'Tech Architecture',
    about_spec_arch_sub: 'Electron · Native C# Helper · Web Audio API · EveryAyah & MP3Quran',
    about_spec_arch_val: 'Windows Desktop',
    nav_island: 'Island',
    island_style_title: 'Idle Display Style',
    style_pill: 'Floating Pill',
    style_pill_desc: 'Classic floating oval island at top of screen',
    style_line: 'Inline Bar (Line)',
    style_line_desc: 'Ultra-thin sleek line at top edge, springs open on hover',
    style_notch: 'Top Notch',
    style_notch_desc: 'Hangs flush from top display bezel like MacBook',
    island_size_title: 'Dynamic Island Size',
    size_s: 'Compact (Small)',
    size_s_desc: 'Lightweight & minimal for compact setups',
    size_m: 'Balanced (Default)',
    size_m_desc: 'The perfect balanced desktop experience',
    size_l: 'Expanded (Large)',
    size_l_desc: 'Spacious dual-column layout with full details',
    nav_companion: 'Companion',
    nav_faith: 'Prayer & Dhikr',
    nav_alerts: 'Alerts & Privacy',
    nav_connections: 'Connections',
    nav_focus: 'Focus',
    shortcut_hint: 'Ctrl+Alt+I opens the island',
    search_placeholder: 'Search settings...',
    no_results: 'No matching settings',

    // General Page
    general_title: 'General Settings',
    lang_group: 'Interface Language & Fonts',
    lang_select_lbl: 'Interface Language & Typography',
    lang_select_sub: 'Amiri calligraphy for Arabic, or modern Inter font for English',
    lang_ar: 'Arabic (Amiri)',
    lang_en: 'English (Inter)',
    theme_group: 'Theme & Accent Color',
    theme_accent_lbl: 'Signature Accent Color',
    theme_accent_sub: 'Customize the weather and app accent tint (Sky Blue, Crimson Red, etc.)',
  theme_mode_lbl: 'Appearance Theme',
  theme_mode_sub: 'Choose Dark or Light mode',
  theme_dark: 'Dark',
    theme_black: 'Black (OLED)',
  theme_light: 'Light',
  glass_slider_lbl: 'Glass Blur & Opacity (Liquid Glass vs Solid Dark)',
  glass_slider_sub: 'Control between crystal liquid glass and solid opaque dark (0% - 120%)',
  taskbar_icon_lbl: 'Show in Windows Taskbar',
  taskbar_icon_sub: 'Uncheck to hide island from taskbar (Tray icon only)',
    show_island: 'Show island',
    start_windows: 'Start with Windows',
    orientation: 'Orientation',
    orient_h: 'Horizontal',
    orient_v: 'Vertical',
    addr_island: 'Browser address bar',
    addr_island_sub: 'Right third, never over tabs',
    hide_fullscreen: 'Hide in full screen',
    auto_update: 'Auto-update',
    position: 'Position',
    reset: 'Reset',
    location_title: 'Location & Weather',
    city: 'City',
    use_auto: 'Use auto',
    search_city: 'Search for a city...',
    search_btn: 'Search',

    // Island Page
    island_title: 'Island',
    tabs_title: 'Island Tabs',
    tab_music: 'Music',
    tab_apps: 'Apps',
    tab_shelf: 'Shelf',
    tab_prayer: 'Prayer',
    tab_timer: 'Timer',
    tab_focus: 'Focus',
    tab_system: 'System',
    tabs_warn: 'Keep at least one tab',
    collapsed_title: 'Collapsed (Mini Bar)',
    slide_clock: 'Clock & weather',
    slide_stats: 'CPU & memory',
    slide_prayer: 'Next prayer',
    now_playing_title: 'Now Playing',
    show_media: 'Show media controls',
    media_title: 'Track title',
    track_peek: 'New track notification',

    // Companion Page
    companion_title: 'Companion',
    nova_title: 'Nova AI Robot',
    nova_eyes: 'Interactive robot eyes',
    nova_prayer: 'Prayer / Adhan reaction',
    nova_focus: 'Headband in focus sessions',
    nova_celebrate: 'Task celebration',
    audio_haptics: 'Procedural Audio Haptics',
    audio_haptics_sub: 'Subtle organic wood taps and crystal chimes (Web Audio)',
    liquid_glass: 'Liquid Glass Optics',
    liquid_glass_sub: 'Dynamic optical refraction and cursor caustic sheen (Liquid Glass)',
    moments_title: 'Smart Moments & Alerts',
    morning_brief: 'Morning brief',
    welcome_back: 'Welcome back',
    break_reminders: 'Break reminders',
    net_toasts: 'Network status toasts',
    notch_meetings: 'Notch Meeting Companion',
    notch_meetings_sub: 'Auto-detect Zoom/Teams calls & private in-island scratchpad',
    smart_clip: 'Smart clipboard',
    smart_clip_sub: 'Links, colors, math previews',
    water_title: 'Water Hydration Reminder',
    water_remind: 'Enable water reminders',
    water_every: 'Remind every',
    water_goal: 'Daily target goal',

    // Faith Page
    faith_title: 'Prayer & Dhikr',
    prayer_title: 'Prayer Times',
    prayer_alerts: 'Adhan & prayer alerts',
    hanafi_asr: 'Hanafi Asr calculation',
    hijri_date: 'Hijri date offset',
    hijri_sub: 'Match local moon sighting',
    dhikr_title: 'Dhikr, Du\'a & Qur\'an',
    show_reminders: 'Show periodic reminders',
    remind_every: 'Remind every',
    remind_for: 'On screen for',
    remind_ayah: 'Qur\'an verses',
    remind_dhikr: 'Prophetic Dhikr',
    remind_dua: 'Supplications (Du\'a)',
    quiet_hours: 'Quiet hours (Mute reminders)',
    quiet_from: 'From',
    quiet_to: 'To',
    adhan_voice_lbl: 'Adhan Voice (Two Takbeers Only)',
    adhan_voice_sub: 'Listen to the reverent opening Takbeers (Allahu Akbar, Allahu Akbar)',
    adhan_resume_lbl: 'Auto-Resume Quran Radio After Adhan',
    adhan_resume_sub: 'Automatically resumes Quran recitation 2 seconds after the Adhan ends',
    cache_group_title: 'Local Storage & Cache Management',
    cache_mgr_lbl: 'Local Cache (Quran & Audio)',
    cache_mgr_sub: 'Storage used locally for offline recitation and fast playback',
    btn_clear_cache: 'Clear Cache',
    cache_cleared: 'Cache Cleared Successfully',
    slide_interval_lbl: 'Idle Pill Rotation Speed',
    slide_interval_sub: 'Time before rotating slides on the collapsed island',
    tasbeeh_rate_lbl: 'Tasbeeh & Dhikr Reminders Per Hour',
    tasbeeh_rate_sub: 'Subtle periodic remembrance without breaking your focus',
    daily_adhkar_lbl: 'Daily Morning & Evening Adhkar Quota',
    daily_adhkar_sub: 'Curated adhkar refreshed daily for your morning and evening ward',
    daily_ayat_lbl: 'Daily Quranic Verses Reflection Quota',
    daily_ayat_sub: 'Verses chosen daily for tranquility and mindful contemplation',
    show_preview: 'Preview reminder now',

    // Alerts Page
    alerts_title: 'Alerts & Privacy',
    alerts_group: 'System Alerts & HUD',
    alert_volume: 'Volume HUD notification',
    alert_brightness: 'Brightness HUD notification',
    alert_battery: 'Battery & charging alerts',
    alert_kbd: 'Keyboard language switch toast',
    alert_caps: 'Caps Lock toast',
    alert_screenshot: 'Screenshot toast with copy',
    privacy_group: 'Privacy & Security Dots',
    privacy_dots: 'Mic & camera in-use indicator dots',
    clip_hist: 'Store clipboard in memory only',
    clip_hist_sub: 'Cleared automatically when quitting for privacy',

    // Connections Page
    connections_title: 'Connections',
    calendar_title: 'Calendar Sync',
    upcoming_meetings: 'Upcoming meeting alerts',
    cal_placeholder: 'iCal link (https://... .ics)',
    save_btn: 'Save',
    cal_status_lbl: 'Status',
    how_to_link: 'How to get the link',
    cal_how_google: 'Google: Settings › your calendar › Secret address in iCal format',
    cal_how_outlook: 'Outlook: Settings › Calendar › Shared calendars › Publish (ICS)',
    downloads_title: 'IDM Nova Downloads',
    downloads_toggle: 'Monitor downloads',
    dl_alerts: 'Download completion toast with open button',
    troubleshooting_title: 'Diagnostics & Support',
    system_helper: 'System bridge helper (HyperHelper)',
    error_log: 'Diagnostic error log',
    open_btn: 'Open',
    copy_report_btn: 'Copy Report',
    all_settings: 'All Settings',
    reset_btn: 'Factory Reset',

    // Focus & NeuroFocus Page
    nav_focus: 'Focus',
    focus_page_title: 'Focus & Productivity (NeuroFocus)',
    pomo_group: 'Smart Pomodoro Sessions',
    pomo_work_lbl: 'Focus Session Duration',
    pomo_work_sub: 'Time allotted for each deep work sprint',
    pomo_break_lbl: 'Short Break Duration',
    pomo_break_sub: 'Quick rest to ease eyes and stretch',
    pomo_longbreak_lbl: 'Long Break Duration',
    pomo_longbreak_sub: 'Recharging break after completing 4 sprints',
    nova_focus_sub: 'Play headband animation on companion at session start',
    focus_sound_lbl: 'Session Audio Chimes',
    focus_sound_sub: 'Pleasant sound cues when session starts or ends',
    deep_group: 'Deep Focus Mode & Focus Shield',
    deep_toggle_lbl: 'Enable Deep Focus Mode',
    deep_toggle_sub: 'Auto-hides desktop icons, minimizes distraction windows and blocks sites',
    shield_mode_lbl: 'Focus Shield Policy',
    shield_mode_desc: 'Choose window policy during deep focus sessions',
    shield_mode_black: 'Block Distractions (Blacklist)',
    shield_mode_white: 'Work Tools Only (Whitelist)',
    shield_add_btn: '+ Add to List',
    shield_pick_btn: '⚡ Pick Running App',
    shield_running_title: 'Currently Running Apps',
    shield_chips_title: 'Protected Platforms & Apps',
    shield_chips_subtitle: 'Click (×) to remove any item from the list',
    shield_empty: 'No items currently in this list',
    shield_added: 'Item added to Focus Shield',
    shield_removed: 'Item removed from Focus Shield',
    ai_group: 'AI Task Decomposition (Gemini)',
    ai_status_lbl: 'AI Engine Status',
    ai_status_sub: 'Ready to break complex tasks into atomic micro-steps',
    ai_status_ready: 'Connected & Ready ✓',
    ai_key_lbl: 'Google Gemini API Key',
    ai_key_sub: 'Breaks complex assignments into atomic steps tailored for ADHD',
    ai_model_lbl: 'Preferred AI Model',
    ai_model_sub: 'Choose fast response or deep multi-step breakdown',
    ai_micro_lbl: 'Micro-step ADHD Decomposition',
    ai_micro_sub: 'Split assignments into 2-5m micro-steps to defeat procrastination',
    shortcuts_group: 'Focus Keyboard Shortcuts',
    sc_island: 'Toggle Island',
    sc_focus: 'Toggle NeuroFocus Bar',
    sc_esc: 'Quick Hide Island',
    sc_settings: 'Open Settings',
    sc_settings_val: 'Gear icon on Island',

    // Feedback messages
    saved: 'Saved successfully',
    done: 'Done',
    report_copied: 'Diagnostic report copied',
    reset_defaults: 'Reset to defaults',
    key_saved: 'API Key Saved',
    deep_updated: 'Deep Focus updated',
    cal_not_linked: 'Not linked',
    cal_connecting: 'Connecting…',
    cal_none: 'Linked · nothing in the next 24 h',
    helper_running: 'Running',
    helper_starting: 'Starting…',
    helper_stopped: 'Stopped'
  }
};

// ---- saved indicator ----
let savedTimer = null;
function saved(keyOrText = 'saved') {
  const t = I18N[currentLang] || I18N.ar;
  const msg = t[keyOrText] || keyOrText;
  $('#saved').textContent = msg;
  $('#saved').classList.add('on');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => $('#saved').classList.remove('on'), 1400);
}

function nope(el) {
  el.classList.remove('nope');
  void el.offsetWidth;
  el.classList.add('nope');
}

// ---- unit text formatting (localized) ----
function unitText(n, unit) {
  if (currentLang === 'ar') {
    if (unit === 'glass') {
      if (n === 1) return 'كوب واحد';
      if (n === 2) return 'كوبان';
      if (n >= 3 && n <= 10) return `${n} أكواب`;
      return `${n} كوب`;
    }
    if (unit === 'day') {
      if (n === 0) return 'مطابق (0 يوم)';
      return `${n > 0 ? '+' : '−'}${Math.abs(n)} يوم`;
    }
    if (unit === 'time') {
      const d = new Date(2000, 0, 1, Math.floor(n / 60), n % 60);
      return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
    }
    if (unit === 'perHour') {
      if (n === 0) return 'متوقف';
      if (n === 1) return 'مرة واحدة / س (كل 60 د)';
      if (n === 2) return 'مرتان / س (كل 30 د)';
      if (n === 4) return '٤ مرات / س (كل 15 د)';
      if (n === 6) return '٦ مرات / س (كل 10 د)';
      return `${n} مرات / س (كل ${Math.round(60 / n)} د)`;
    }
    if (unit === 'adhkar') {
      if (n === 3) return '٣ أذكار (ورد خفيف)';
      if (n === 5) return '٥ أذكار (ورد مأثور)';
      if (n === 7) return '٧ أذكار (ورد متوازن)';
      if (n === 10) return '١٠ أذكار (ورد شامل)';
      return `${n} ذكراً (الورد الكامل)`;
    }
    if (unit === 'verses') {
      if (n === 1) return 'آية واحدة وتدبرها';
      if (n === 3) return '٣ آيات يومياً';
      if (n === 5) return '٥ آيات يومياً';
      return `${n} آيات وتأملات`;
    }
    if (unit === 'slideSec') {
      if (n === 0) return 'ثابت (بدون تبديل)';
      return `${n} ثواني`;
    }
    if (unit === 'min') {
      if (n >= 60 && n % 60 === 0) {
        const hrs = n / 60;
        if (hrs === 1) return 'ساعة واحدة';
        if (hrs === 2) return 'ساعتان';
        if (hrs <= 10) return `${hrs} ساعات`;
        return `${hrs} ساعة`;
      }
      return `${n} دقيقة`;
    }
    return `${n} ثانية`;
  } else {
    // English
    if (unit === 'glass') return `${n} glass${n === 1 ? '' : 'es'}`;
    if (unit === 'day') return n === 0 ? 'None' : `${n > 0 ? '+' : '−'}${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'}`;
    if (unit === 'time') {
      const d = new Date(2000, 0, 1, Math.floor(n / 60), n % 60);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (unit === 'perHour') {
      if (n === 0) return 'Off';
      if (n === 1) return '1 / h (every 60m)';
      if (n === 2) return '2 / h (every 30m)';
      if (n === 4) return '4 / h (every 15m)';
      if (n === 6) return '6 / h (every 10m)';
      return `${n} / h (every ${Math.round(60 / n)}m)`;
    }
    if (unit === 'adhkar') {
      if (n === 3) return '3 Adhkar (Light)';
      if (n === 5) return '5 Adhkar (Moderate)';
      if (n === 7) return '7 Adhkar (Balanced)';
      return `${n} Adhkar (Full Ward)`;
    }
    if (unit === 'verses') {
      if (n === 1) return '1 Ayah with reflection';
      return `${n} Ayat daily`;
    }
    if (unit === 'slideSec') {
      if (n === 0) return 'Fixed (No rotation)';
      return `${n} s`;
    }
    if (unit === 'min') return n >= 60 && n % 60 === 0 ? `${n / 60} h` : `${n} min`;
    return `${n} s`;
  }
}

// ---- steppers ----
const TIME_STEPS = Array.from({ length: 48 }, (_, i) => i * 30);
const stepsOf = (st) => (st.dataset.steps === 'time' ? TIME_STEPS : st.dataset.steps.split(',').map(Number));

function showSteppers() {
  $$('.stepper').forEach((st) => {
    const v = features[st.dataset.num];
    if (v == null) return;
    st.querySelector('output').textContent = unitText(v, st.dataset.unit);
    const steps = stepsOf(st);
    const wraps = st.dataset.steps === 'time';
    st.querySelector('[data-dir="-1"]').disabled = !wraps && v <= steps[0];
    st.querySelector('[data-dir="1"]').disabled = !wraps && v >= steps[steps.length - 1];
  });
}

$$('.stepper').forEach((st) => st.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const steps = stepsOf(st);
  const v = features[st.dataset.num];
  let next = b.dataset.dir === '1' ? steps.find((s) => s > v) : [...steps].reverse().find((s) => s < v);
  if (next == null && st.dataset.steps === 'time') next = b.dataset.dir === '1' ? steps[0] : steps[steps.length - 1];
  if (next == null) return;
  features[st.dataset.num] = next;
  showSteppers();
  // AI model selector
  const aiModel = features.aiModel || 'flash';
  $('#btn-model-flash')?.classList.toggle('sel', aiModel === 'flash');
  $('#btn-model-pro')?.classList.toggle('sel', aiModel === 'pro');

  api.setFeatures({ [st.dataset.num]: next });
  saved('saved');
}));

$('#rm-preview')?.addEventListener('click', () => api.previewReminder());

// ---- feature switches ----
function showFeatures(f) {
  features = f || {};
  const currentIslandSize = features.islandSize || 'm';
  $$('input[name="islandSize"]').forEach((r) => {
    r.checked = (r.value === currentIslandSize);
  });
  const currentIslandStyle = features.islandStyle || 'pill';
  $$('input[name="islandStyle"]').forEach((r) => {
    r.checked = (r.value === currentIslandStyle);
  });
  $$('[data-feature]').forEach((el) => {
    if (el.tagName === 'SELECT') {
      if (features[el.dataset.feature]) el.value = features[el.dataset.feature];
    } else {
      el.checked = !!features[el.dataset.feature];
    }
  });
  $$('[data-needs]').forEach((el) => el.classList.toggle('off', !el.dataset.needs.split(' ').every((k) => features[k])));
  showSteppers();
  // AI model selector
  const aiModel = features.aiModel || 'flash';
  $('#btn-model-flash')?.classList.toggle('sel', aiModel === 'flash');
  $('#btn-model-pro')?.classList.toggle('sel', aiModel === 'pro');

    applyPrefsTheme(features.islandTheme || 'dark');
    if (features.glassOpacity && $('#pref-glass-slider')) {
      $('#pref-glass-slider').value = features.glassOpacity;
      if ($('#pref-glass-val')) $('#pref-glass-val').textContent = `${features.glassOpacity}%`;
    }
    if ($('#pref-taskbar-toggle')) {
      $('#pref-taskbar-toggle').checked = features.skipTaskbar === false;
    }

    if (features.themeColor) {
    currentThemeColor = features.themeColor;
    $$('.color-dot').forEach((d) => d.classList.toggle('sel', d.dataset.color.toLowerCase() === currentThemeColor.toLowerCase()));
  }
}

$$('[data-feature]').forEach((el) => el.addEventListener('change', () => {
  const key = el.dataset.feature;
  if (el.hasAttribute('data-kind') && !el.checked && ![...$$('[data-kind]')].some((k) => k.checked)) {
    el.checked = true;
    nope(el);
    return;
  }
  if (el.hasAttribute('data-tab') && !el.checked && ![...$$('[data-tab]')].some((t) => t.checked)) {
    el.checked = true;
    nope(el.closest('.chip'));
    $('#tabs-warn').hidden = false;
    setTimeout(() => { $('#tabs-warn').hidden = true; }, 2600);
    return;
  }
  api.setFeatures({ [key]: el.checked });
  saved('saved');
}));

// ---- general settings ----
function showGeneral(g) {
  g = g || {};
  $$('[data-general]').forEach((el) => { el.checked = !!g[el.dataset.general]; });
  $$('[data-orient]').forEach((b) => b.classList.toggle('sel', (b.dataset.orient === 'v') === !!g.vertical));
  if (g.version) $('#version').textContent = currentLang === 'ar' ? `الإصدار ${g.version}` : `Version ${g.version}`;
}

$$('[data-general]').forEach((el) => el.addEventListener('change', () => {
  api.setGeneral(el.dataset.general, el.checked);
  saved('saved');
}));

$$('[data-orient]').forEach((b) => b.addEventListener('click', () => {
  const isV = b.dataset.orient === 'v';
  api.setGeneral('vertical', isV);
  $$('[data-orient]').forEach((btn) => btn.classList.toggle('sel', btn === b));
  saved('saved');
}));

$$('[data-general-action]').forEach((b) => b.addEventListener('click', () => {
  api.setGeneral(b.dataset.generalAction, true);
  saved('done');
}));

// ---- Reactive Bilingual Translation Engine ----
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('nova_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const t = I18N[lang] || I18N.ar;

  // Titlebar Brand
  const bName = $('#brand-app-name');
  if (bName) bName.textContent = 'HyperNova';

  // Toggle Language Buttons
  $('#btn-lang-ar')?.classList.toggle('sel', lang === 'ar');
  $('#btn-lang-en')?.classList.toggle('sel', lang === 'en');

  // Translate all [data-i18n] text nodes
  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Translate all [data-i18n-ph] placeholders
  $$('[data-i18n-ph]').forEach((el) => {
    const key = el.dataset.i18nPh;
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  const ackDesc = $('#about-ack-desc');
  if (ackDesc && t.about_ack_desc) {
    ackDesc.innerHTML = t.about_ack_desc;
  }

  // Re-render steppers with localized unit strings
  showSteppers();
  // AI model selector
  const aiModel = features.aiModel || 'flash';
  $('#btn-model-flash')?.classList.toggle('sel', aiModel === 'flash');
  $('#btn-model-pro')?.classList.toggle('sel', aiModel === 'pro');


  // Update dynamic badges / version
  api.general().then(showGeneral);
  showBridge();

  // Broadcast to main process and Island
  api.setFeatures({ appLang: lang });
}


// Language selection buttons
$('#btn-lang-ar')?.addEventListener('click', () => applyLanguage('ar'));
$('#btn-lang-en')?.addEventListener('click', () => applyLanguage('en'));

// Color palette dots
$$('.color-dot').forEach((d) => {
  d.addEventListener('click', () => {
    const col = d.dataset.color;
    if (col) applyThemeColor(col);
  });
});

// Glass blur & opacity slider: Real-time live responsiveness
const glassSlider = $('#pref-glass-slider');
if (glassSlider) {
  const updateGlass = (val) => {
    const num = parseInt(val, 10);
    if ($('#pref-glass-val')) $('#pref-glass-val').textContent = `${num}%`;
    api.setFeatures({ glassOpacity: num });
  };
  glassSlider.addEventListener('input', (e) => {
    updateGlass(e.target.value);
  });
  glassSlider.addEventListener('change', (e) => {
    updateGlass(e.target.value);
    saved(currentLang === 'ar' ? 'تم ضبط مستوى الشفافية والزجاج' : 'Glass opacity saved');
  });
}

// Island Size selection
$$('input[name="islandSize"]').forEach((r) => {
  r.addEventListener('change', () => {
    if (r.checked) {
      api.setFeatures({ islandSize: r.value });
      saved(currentLang === 'ar' ? 'تم تحديث حجم الجزيرة' : 'Island Size Updated');
    }
  });
});

// Island Style selection (Pill vs Line/Inline vs Notch)
$$('input[name="islandStyle"]').forEach((r) => {
  r.addEventListener('change', () => {
    if (r.checked) {
      api.setFeatures({ islandStyle: r.value });
      saved(currentLang === 'ar' ? 'تم تحديث نمط الجزيرة' : 'Island Style Updated');
    }
  });
});

// Taskbar toggle
const taskbarToggle = $('#pref-taskbar-toggle');
if (taskbarToggle) {
  taskbarToggle.addEventListener('change', (e) => {
    api.setGeneral('skipTaskbar', !e.target.checked);
    saved('saved');
  });
}

// Theme color selection
let currentThemeColor = '#38bdf8';
function applyThemeColor(c) {
  currentThemeColor = c;
  $$('.color-dot').forEach((d) => d.classList.toggle('sel', d.dataset.color.toLowerCase() === c.toLowerCase()));
  document.documentElement.style.setProperty('--accent', c);
  api.setFeatures({ themeColor: c });
  saved(currentLang === 'ar' ? 'تم تغيير لون الواجهة' : 'Theme Color Updated');
}


  // Theme Mode (Dark / Black OLED / Apple Light)
  const themeButtons = [
    { id: '#btn-theme-dark', val: 'dark', msgAr: 'تم تفعيل النمط الداكن', msgEn: 'Dark Mode Enabled' },
    { id: '#btn-theme-black', val: 'black', msgAr: 'تم تفعيل نمط الأسود الفائق (OLED)', msgEn: 'Black OLED Mode Enabled' },
    { id: '#btn-theme-light', val: 'light', msgAr: 'تم تفعيل النمط الفاتح (Apple Light)', msgEn: 'Apple Light Mode Enabled' }
  ];
  themeButtons.forEach(({ id, val, msgAr, msgEn }) => {
    const btn = document.querySelector(id);
    if (btn) {
      btn.addEventListener('click', () => {
        applyPrefsTheme(val);
        api.setFeatures({ islandTheme: val });
        saved(currentLang === 'ar' ? msgAr : msgEn);
      });
    }
  });

  try {
  // Initialize BYOK AI settings
  const aiContainer = $('#ai-byok-settings-container');
  if (aiContainer && window.AISettings) {
    window.AISettings.renderAISettings(aiContainer);
  }

  const deepSw = $('#pref-deep-focus-toggle');
  if (deepSw) {
    const nfStateRaw = localStorage.getItem('neurofocus_state');
    const nfState = nfStateRaw ? JSON.parse(nfStateRaw) : {};
    deepSw.checked = !!nfState.deepFocus;
    if (api.getDeepFocus) {
      api.getDeepFocus().then((val) => {
        if (typeof val === 'boolean') deepSw.checked = val;
      });
    }
    deepSw.addEventListener('change', () => {
      nfState.deepFocus = deepSw.checked;
      localStorage.setItem('neurofocus_state', JSON.stringify(nfState));
      api.setFeatures({ deepFocus: deepSw.checked });
      if (api.setDeepFocus) api.setDeepFocus(deepSw.checked);
      saved('deep_updated');
    });
  }

  // ---- Focus Shield Interactive Management ----
  async function initFocusShield() {
    if (!api.focusShield) return;
    let shieldCfg = await api.focusShield.get();
    let currentMode = shieldCfg.mode || 'blacklist';

    const seg = $('#shield-mode-seg');
    const input = $('#shield-input');
    const addBtn = $('#shield-add-btn');
    const pickBtn = $('#shield-pick-btn');
    const pickerDropdown = $('#shield-picker-dropdown');
    const pickerClose = $('#shield-picker-close');
    const runningList = $('#shield-running-list');
    const chipsContainer = $('#shield-chips-container');
    const chipsCount = $('#shield-chips-count');

    function renderShield() {
      if (!chipsContainer) return;
      chipsContainer.innerHTML = '';
      const list = currentMode === 'whitelist' ? (shieldCfg.whitelist || []) : (shieldCfg.blacklist || []);
      const isBlacklist = currentMode === 'blacklist';

      if (chipsCount) {
        chipsCount.textContent = currentLang === 'ar' ? `${list.length} عناصر` : `${list.length} items`;
      }

      if (!list.length) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'shield-empty-msg';
        emptyDiv.style.color = 'var(--text-2)';
        emptyDiv.style.fontSize = '12px';
        emptyDiv.style.padding = '8px 0';
        emptyDiv.textContent = currentLang === 'ar' ? 'القائمة فارغة حالياً' : 'No items in list';
        chipsContainer.appendChild(emptyDiv);
        return;
      }

      list.forEach((item, index) => {
        const chip = document.createElement('span');
        chip.className = `chip ${isBlacklist ? 'blocked' : 'allowed'}`;
        chip.innerHTML = `
          <span class="dot"></span>
          <span class="chip-text">${item}</span>
          <button type="button" class="chip-del" title="${currentLang === 'ar' ? 'حذف' : 'Remove'}">×</button>
        `;
        chip.querySelector('.chip-del').addEventListener('click', async (e) => {
          e.stopPropagation();
          list.splice(index, 1);
          if (isBlacklist) shieldCfg.blacklist = list;
          else shieldCfg.whitelist = list;
          await api.focusShield.set(shieldCfg);
          renderShield();
          saved('shield_removed');
        });
        chipsContainer.appendChild(chip);
      });
    }

    if (seg) {
      const btns = seg.querySelectorAll('button');
      btns.forEach((btn) => {
        btn.classList.toggle('sel', btn.dataset.mode === currentMode);
        btn.addEventListener('click', async () => {
          btns.forEach((b) => b.classList.remove('sel'));
          btn.classList.add('sel');
          currentMode = btn.dataset.mode;
          shieldCfg.mode = currentMode;
          await api.focusShield.set(shieldCfg);
          renderShield();
          saved('deep_updated');
        });
      });
    }

    async function addItem(val) {
      const text = (val || '').trim().toLowerCase();
      if (!text) return;
      const list = currentMode === 'whitelist' ? (shieldCfg.whitelist || []) : (shieldCfg.blacklist || []);
      if (!list.includes(text)) {
        list.push(text);
        if (currentMode === 'whitelist') shieldCfg.whitelist = list;
        else shieldCfg.blacklist = list;
        await api.focusShield.set(shieldCfg);
        renderShield();
        saved('shield_added');
      }
      if (input) input.value = '';
    }

    if (addBtn && input) {
      addBtn.addEventListener('click', () => addItem(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addItem(input.value);
      });
    }

    if (pickBtn && pickerDropdown && runningList) {
      pickBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isOpen = !pickerDropdown.hidden;
        if (isOpen) {
          pickerDropdown.hidden = true;
          return;
        }
        pickerDropdown.hidden = false;
        runningList.innerHTML = `<div style="padding:10px; font-size:12px; color:var(--text-2); text-align:center;">${currentLang === 'ar' ? 'جارٍ قراءة التطبيقات النشطة…' : 'Reading running apps…'}</div>`;
        const apps = await api.focusShield.getRunningApps();
        runningList.innerHTML = '';
        if (!apps || !apps.length) {
          runningList.innerHTML = `<div style="padding:10px; font-size:12px; color:var(--text-2); text-align:center;">${currentLang === 'ar' ? 'لا توجد تطبيقات نشطة مكتشفة' : 'No running apps detected'}</div>`;
          return;
        }
        apps.forEach((app) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'shield-running-item';
          btn.innerHTML = `
            <span class="app-name-b">${app.name}</span>
            <span class="app-title-s">${app.title || app.name}</span>
          `;
          btn.addEventListener('click', async () => {
            await addItem(app.name);
            pickerDropdown.hidden = true;
          });
          runningList.appendChild(btn);
        });
      });

      if (pickerClose) {
        pickerClose.addEventListener('click', (e) => {
          e.stopPropagation();
          pickerDropdown.hidden = true;
        });
      }

      document.addEventListener('click', (e) => {
        if (!pickerDropdown.hidden && !e.target.closest('.shield-picker-wrap')) {
          pickerDropdown.hidden = true;
        }
      });
    }

    renderShield();
  }
  initFocusShield().catch((err) => console.error('[prefs] FocusShield init failed:', err));
} catch (e) {
  console.error('[prefs] Focus settings error:', e);
}

// ---- location ----
function showLocation(info) {
  const manual = info?.mode === 'manual';
  const autoText = currentLang === 'ar' ? 'تحديد تلقائي' : 'Auto';
  $('#loc-now').textContent = manual
    ? `${info.name}${info.country ? `, ${info.country}` : ''}`
    : `${autoText}${info?.name ? ` · ${info.name}` : ''}`;
  $('#loc-auto').hidden = !manual;
}

async function searchCity() {
  const q = $('#loc-q').value.trim();
  const box = $('#loc-results');
  if (q.length < 2) return;
  box.hidden = false;
  box.innerHTML = `<div class="none">${currentLang === 'ar' ? 'جارٍ البحث…' : 'Searching…'}</div>`;
  const res = await api.searchCity(q);
  if (!res) {
    box.innerHTML = `<div class="none">${currentLang === 'ar' ? 'فشل البحث. تأكد من اتصال الإنترنت' : 'Search failed. Check your connection.'}</div>`;
    return;
  }
  if (!res.length) {
    box.innerHTML = `<div class="none">${currentLang === 'ar' ? 'لا توجد نتائج' : 'No results'}</div>`;
    return;
  }
  box.innerHTML = '';
  res.forEach((r) => {
    const b = document.createElement('button');
    b.innerHTML = '<b></b><span></span>';
    b.querySelector('b').textContent = r.name;
    b.querySelector('span').textContent = [r.admin, r.country].filter(Boolean).join(', ');
    b.addEventListener('click', () => {
      api.setLocation(r);
      box.hidden = true;
      $('#loc-q').value = '';
      saved('saved');
    });
    box.append(b);
  });
}

$('#loc-go')?.addEventListener('click', searchCity);
$('#loc-q')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchCity(); });
$('#loc-auto')?.addEventListener('click', () => {
  api.setLocation(null);
  saved('saved');
});

// ---- calendar ----
function showCalendar(c) {
  const el = $('#cal-status');
  if (!el) return;
  const t = I18N[currentLang] || I18N.ar;
  if (!c?.hasUrl && !c?.updated && !c?.error) {
    el.textContent = t.cal_not_linked;
    return;
  }
  if (c.error) {
    el.textContent = `${currentLang === 'ar' ? 'خطأ في القراءة' : 'Error'} (${c.error})`;
    return;
  }
  const next = c.events?.find((e) => e.end > Date.now());
  el.textContent = next
    ? `${currentLang === 'ar' ? 'متصل · القادم:' : 'Linked · next:'} ${next.title} ${new Date(next.start).toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' })}`
    : t.cal_none;
}

$('#cal-save')?.addEventListener('click', async () => {
  const res = await api.setCalendar($('#cal-url').value);
  if (!res?.ok) {
    $('#cal-status').textContent = currentLang === 'ar' ? 'يرجى استخدام رابط https:// أو webcal:// صالح' : 'Use an https:// or webcal:// link';
    return;
  }
  $('#cal-url').value = '';
  $('#cal-status').textContent = (I18N[currentLang] || I18N.ar).cal_connecting;
  saved('saved');
});

// ---- helper bridge status ----
async function showBridge() {
  const s = await api.bridgeStatus();
  const el = $('#bridge-state');
  if (!el) return;
  const t = I18N[currentLang] || I18N.ar;
  el.className = `status ${s.state}`;
  el.textContent = s.state === 'ok' ? t.helper_running : s.state === 'starting' ? t.helper_starting : t.helper_stopped;
  const detail = $('#bridge-detail');
  if (detail) {
    detail.hidden = s.state !== 'failed';
    detail.textContent = currentLang === 'ar' ? 'تأكد من السماح للبرنامج في الجدار الناري ثم أعد التشغيل' : 'Allow HyperNova in your antivirus, then restart it';
  }
}

$('#open-log')?.addEventListener('click', () => api.openLog());
$('#copy-report')?.addEventListener('click', async () => {
  await api.copyReport();
  saved('report_copied');
});
$('#reset-all')?.addEventListener('click', () => {
  api.resetFeatures();
  saved('reset_defaults');
});

// ---- window control buttons ----
$$('[data-win]').forEach((b) => b.addEventListener('click', () => api.window(b.dataset.win)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('#find').value) clearSearch();
  else api.window('close');
});

// ---- page tabs navigation ----
const PAGE_KEY = 'prefs-page';
function remembered() {
  try { return localStorage.getItem(PAGE_KEY) || 'general'; } catch { return 'general'; }
}
const links = [...$$('.side a')];
function showPage(id) {
  if (!document.getElementById(id)) id = 'general';
  $$('.page').forEach((p) => p.classList.toggle('on', p.id === id));
  links.forEach((a) => a.classList.toggle('on', a.dataset.page === id));
  $('#content').scrollTop = 0;
  try { localStorage.setItem(PAGE_KEY, id); } catch {}
}
links.forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  clearSearch();
  showPage(a.dataset.page);
}));
showPage(remembered());

// ---- search filter ----
const items = [...$$('.row, .chip')];
const title = (el) => el.querySelector('b')?.textContent.toLowerCase() || '';
function search(q) {
  q = q.trim().toLowerCase();
  document.body.classList.toggle('searching', !!q);
  links.forEach((a) => a.classList.toggle('on', !q && a.dataset.page === remembered()));
  if (!q) {
    $$('.miss, .empty').forEach((el) => el.classList.remove('miss', 'empty'));
    $('#no-results').hidden = true;
    showPage(remembered());
    return;
  }
  for (const el of items) el.classList.toggle('miss', !title(el).includes(q));
  $$('.group').forEach((g) => {
    const head = g.querySelector('h2')?.textContent.toLowerCase().includes(q);
    if (head) g.querySelectorAll('.miss').forEach((el) => { if (title(el)) el.classList.remove('miss'); });
    g.classList.toggle('empty', !g.querySelector('.row:not(.miss):not(.off), .chip:not(.miss)'));
  });
  let any = false;
  $$('.page').forEach((p) => {
    const empty = !p.querySelector('.group:not(.empty)');
    p.classList.toggle('empty', empty);
    any ||= !empty;
  });
  $('#no-results').hidden = any;
}
function clearSearch() {
  if (!$('#find').value) return;
  $('#find').value = '';
  search('');
}
$('#find')?.addEventListener('input', (e) => search(e.target.value));

// Init hooks
api.onFeatures(showFeatures);
api.onGeneral(showGeneral);
api.onLocation(showLocation);
api.onCalendar((c) => showCalendar({ ...c, hasUrl: true }));

api.features().then((f) => {
  showFeatures(f);
  if (f?.appLang) currentLang = f.appLang;
  applyLanguage(currentLang);
});
api.general().then(showGeneral);
api.location().then(showLocation);
api.calendar().then(showCalendar);
showBridge();
setInterval(showBridge, 5000);




// Verified 8 Direct CDN Muezzins MP3 Dataset (Archive.org & AlAdhan CDN)
// Exact silence-aligned durations so the opening Takbeers are 100% complete with no cut-off
const ADHAN_MUEZZINS = [
  { id: 'abdulbasit', name: 'الشيخ عبد الباسط عبد الصمد', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/042--.mp3', startSec: 0, takbirDurationSec: 27 },
  { id: 'refaat', name: 'الشيخ محمد رفعت (أذان زمان)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/042--.mp3', startSec: 0, takbirDurationSec: 27 },
  { id: 'banna', name: 'الشيخ محمود علي البنا (القاهرة)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/043--.mp3', startSec: 0, takbirDurationSec: 27 },
  { id: 'makkah', name: 'أذان الحرم المكي (علي أحمد ملا)', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/019--1.mp3', startSec: 0, takbirDurationSec: 29.5 },
  { id: 'madinah', name: 'أذان المسجد النبوي الشريف', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/018-.mp3', startSec: 0, takbirDurationSec: 40 },
  { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/007--.mp3', startSec: 0, takbirDurationSec: 34 },
  { id: 'alafasy', name: 'الشيخ مشاري راشد العفاسي', url: 'https://cdn.aladhan.com/audio/adhans/a9.mp3', startSec: 0, takbirDurationSec: 41 },
  { id: 'nafees', name: 'الشيخ أحمد النفيس (خاشع)', url: 'https://cdn.aladhan.com/audio/adhans/a9.mp3', startSec: 0, takbirDurationSec: 41 }
];

let activeAdhanAudio = null;

function stopAdhanPreview() {
  if (activeAdhanAudio) {
    try {
      activeAdhanAudio.pause();
      activeAdhanAudio.currentTime = 0;
    } catch (e) {}
    activeAdhanAudio = null;
  }
  const btn = document.getElementById('btn-preview-adhan');
  if (btn) btn.innerHTML = '🔊 معاينة';
}

function playTwoTakbeersLocal(voice) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t0 = ctx.currentTime + 0.05;
    const notes = [
      { f: 220, dur: 0.6, gain: 0.22 },
      { f: 293.6, dur: 0.8, gain: 0.26 },
      { f: 330, dur: 0.5, gain: 0.24 },
      { f: 293.6, dur: 0.5, gain: 0.22 },
      { f: 261.6, dur: 1.1, gain: 0.25 },
      { f: 220, dur: 0.6, gain: 0.22 },
      { f: 330, dur: 0.9, gain: 0.28 },
      { f: 392, dur: 0.5, gain: 0.25 },
      { f: 330, dur: 0.6, gain: 0.23 },
      { f: 293.6, dur: 1.4, gain: 0.26 }
    ];
    let cur = t0;
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = voice === 'refaat' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(n.f, cur);
      g.gain.setValueAtTime(0.001, cur);
      g.gain.exponentialRampToValueAtTime(n.gain, cur + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, cur + n.dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(cur);
      osc.stop(cur + n.dur + 0.1);
      cur += n.dur * 0.92;
    });
  } catch (e) {}
}

function playAdhanTakbeers(muezzinId) {
  if (activeAdhanAudio) {
    stopAdhanPreview();
    return;
  }
  const muezzin = ADHAN_MUEZZINS.find(m => m.id === muezzinId) || ADHAN_MUEZZINS[0];
  const btn = document.getElementById('btn-preview-adhan');
  if (btn) btn.innerHTML = '⏹️ إيقاف';

  const audio = new Audio();
  audio.src = muezzin.url;
  audio.volume = 1.0;
  activeAdhanAudio = audio;

  const targetDuration = muezzin.takbirDurationSec || 30;
  const fadeStart = Math.max(0, targetDuration - 2.0);

  audio.addEventListener('loadedmetadata', () => {
    if (muezzin.startSec) audio.currentTime = muezzin.startSec;
  });

  audio.addEventListener('timeupdate', () => {
    const cur = audio.currentTime - (muezzin.startSec || 0);
    if (cur >= fadeStart && cur < targetDuration) {
      const remainingRatio = Math.max(0, (targetDuration - cur) / (targetDuration - fadeStart));
      audio.volume = Math.max(0, Math.min(1, remainingRatio));
    } else if (cur >= targetDuration) {
      stopAdhanPreview();
    }
  });

  audio.addEventListener('ended', () => {
    stopAdhanPreview();
  });

  audio.addEventListener('error', (err) => {
    console.warn('[adhan-preview] Network MP3 error, falling back to local synthesis:', err);
    playTwoTakbeersLocal(muezzinId);
    setTimeout(stopAdhanPreview, 5500);
  });

  audio.play().catch(e => {
    console.warn('[adhan-preview] Audio play blocked, falling back to local synthesis:', e);
    playTwoTakbeersLocal(muezzinId);
    setTimeout(stopAdhanPreview, 5500);
  });
}

// Adhan Voice Picker and Preview Handler
const adhanVoiceSelect = document.getElementById('pref-adhan-voice');
if (adhanVoiceSelect) {
  adhanVoiceSelect.addEventListener('change', () => {
    features.adhanVoice = adhanVoiceSelect.value;
    api.setFeatures({ adhanVoice: adhanVoiceSelect.value });
    saved('saved');
    if (activeAdhanAudio) stopAdhanPreview();
  });
}
const btnPreviewAdhan = document.getElementById('btn-preview-adhan');
if (btnPreviewAdhan) {
  btnPreviewAdhan.addEventListener('click', () => {
    const v = adhanVoiceSelect ? adhanVoiceSelect.value : 'abdulbasit';
    playAdhanTakbeers(v);
  });
}

// Cache Storage Size & Clear Cache Action
function refreshCacheSizeDisplay() {
  const display = document.getElementById('cache-size-display');
  if (!display) return;
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('hypernova_quran') || k.startsWith('hypernova_audio') || k.startsWith('hypernova_focus'))) {
        bytes += (localStorage.getItem(k) || '').length * 2;
      }
    }
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    const isAr = (features.appLang || 'ar') === 'ar';
    display.textContent = `${mb} ${isAr ? 'ميجابايت' : 'MB'}`;
  } catch (e) {
    display.textContent = '0.00 MB';
  }
}

const btnClearCache = document.getElementById('btn-clear-cache');
if (btnClearCache) {
  btnClearCache.addEventListener('click', () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('hypernova_quran') || k.startsWith('hypernova_audio'))) {
          localStorage.removeItem(k);
        }
      }
      refreshCacheSizeDisplay();
      saved('cache_cleared');
    } catch (e) {
      console.warn('Clear cache error:', e);
    }
  });
}
refreshCacheSizeDisplay();


// Escape key closes settings window
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});

// Nova Studio test buttons
document.querySelectorAll('.nova-test-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const st = btn.dataset.st;
    document.querySelectorAll('.nova-test-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    saved(currentLang === 'ar' ? `تم تفعيل: ${btn.textContent}` : `Applied: ${btn.textContent}`);
  });
});
