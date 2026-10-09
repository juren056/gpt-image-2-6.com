import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sharedKeys = {
  es: [
    'Generador Qwen Image 3.0: crea imágenes con IA online',
    'Crea imágenes con texto nítido a partir de una idea. Usa Qwen Image 3.0 con indicaciones guiadas, acceso verificado, historial privado y precios transparentes por créditos.',
    'Crear gratis',
    'Describe tu idea con palabras sencillas, elige el formato y consigue una imagen lista para usar con Qwen Image 3.',
    'Crear gratis',
    '¿Listo para dar vida a tu primera idea?',
    'Regístrate gratis, recibe créditos de bienvenida y convierte tus ideas en imágenes en cuestión de segundos.',
    'Crear una cuenta gratis',
    'Planes y precios de Qwen Image',
    'Compara suscripciones mensuales, planes prepago con Alipay y paquetes de créditos sin renovación para Qwen Image 3.',
  ],
  ko: [
    'Qwen Image 3.0 생성기 — 온라인 AI 이미지 만들기',
    '아이디어를 선명한 텍스트가 담긴 AI 이미지로 만들어 보세요. 안내형 프롬프트, 검증된 모델, 비공개 기록과 투명한 크레딧 요금을 제공합니다.',
    '무료로 시작하기',
    '평소 쓰는 말로 아이디어를 설명하고 형식을 고르면 Qwen Image 3가 완성도 높은 이미지로 만들어 드립니다.',
    '무료로 만들기',
    '첫 이미지를 만들어 볼까요?',
    '무료 가입 후 시작 크레딧을 받고, 아이디어를 몇 초 만에 이미지로 바꿔 보세요.',
    '무료 계정 만들기',
    'Qwen Image 요금제 및 크레딧',
    'Qwen Image 3 월간 구독, Alipay 선불 이용권, 자동 갱신 없는 일회성 크레딧 팩을 비교해 보세요.',
  ],
  ja: [
    'Qwen Image 3.0 画像生成AI — オンラインで作成',
    'アイデアから文字まで美しいAI画像に。ガイド付きプロンプト、検証済みモデル、非公開の履歴、わかりやすいクレジット料金で利用できます。',
    '無料で始める',
    'いつもの言葉でイメージを説明し、形式を選ぶだけ。Qwen Image 3が仕上がりの整った画像を生成します。',
    '無料で作成する',
    '最初の一枚を作ってみませんか？',
    '無料登録でスタータークレジットを受け取り、アイデアをすぐにビジュアルにできます。',
    '無料アカウントを作成',
    'Qwen Imageの料金・クレジットプラン',
    '月額プラン、Alipayの前払いプラン、自動更新のないクレジットパックを比較できます。',
  ],
  de: [
    'Qwen Image 3.0 Generator – KI-Bilder online erstellen',
    'Erstelle detailreiche KI-Bilder mit sauberem Text: mit geführten Prompts, geprüftem Modellzugang, privatem Verlauf und transparenten Credit-Preisen.',
    'Kostenlos starten',
    'Beschreibe deine Idee in eigenen Worten, wähle ein Format und erstelle mit Qwen Image 3 ein professionelles Bild.',
    'Kostenlos erstellen',
    'Bereit für dein erstes Bild?',
    'Registriere dich kostenlos, sichere dir Start-Credits und verwandle deine Ideen in wenigen Sekunden in Bilder.',
    'Kostenloses Konto erstellen',
    'Qwen Image: Preise und Credit-Pakete',
    'Vergleiche Monatsabos, Alipay-Prepaid-Pläne und einmalige Credit-Pakete ohne automatische Verlängerung.',
  ],
  fr: [
    'Générateur Qwen Image 3.0 – Créez des images IA en ligne',
    'Créez des images IA riches en texte grâce à des prompts guidés, un accès vérifié au modèle, un historique privé et des tarifs en crédits transparents.',
    'Créer gratuitement',
    'Décrivez votre idée avec vos propres mots, choisissez un format et obtenez une image soignée avec Qwen Image 3.',
    'Créer gratuitement',
    'Prêt à créer votre première image ?',
    'Inscrivez-vous gratuitement, recevez des crédits de bienvenue et transformez vos idées en images en quelques secondes.',
    'Créer un compte gratuit',
    'Tarifs et crédits Qwen Image',
    'Comparez les abonnements mensuels, les formules prépayées Alipay et les packs de crédits sans renouvellement.',
  ],
  ar: [
    'مولّد Qwen Image 3.0 — أنشئ صورًا بالذكاء الاصطناعي عبر الإنترنت',
    'حوّل أفكارك إلى صور دقيقة وغنية بالنصوص، مع إرشادات واضحة ووصول موثّق للنموذج وسجل خاص وتسعير شفاف بالنقاط.',
    'ابدأ مجانًا',
    'صِف فكرتك بلغتك اليومية، واختر المقاس، ودع Qwen Image 3 ينشئ لك صورة متقنة.',
    'أنشئ مجانًا',
    'هل أنت مستعد لإنشاء صورتك الأولى؟',
    'أنشئ حسابًا مجانيًا، واحصل على نقاط ترحيبية، وحوّل أفكارك إلى صور خلال ثوانٍ.',
    'إنشاء حساب مجاني',
    'أسعار وباقات Qwen Image',
    'قارن بين الاشتراكات الشهرية والدفع المسبق عبر Alipay وباقات النقاط لمرة واحدة دون تجديد تلقائي.',
  ],
  pt: [
    'Gerador Qwen Image 3.0 — Crie imagens com IA online',
    'Crie imagens com texto nítido através de prompts guiados, acesso verificado ao modelo, histórico privado e preços transparentes por créditos.',
    'Começar grátis',
    'Descreva a sua ideia por palavras simples, escolha o formato e obtenha uma imagem cuidada com o Qwen Image 3.',
    'Criar grátis',
    'Pronto para criar a sua primeira imagem?',
    'Registe-se gratuitamente, receba créditos iniciais e transforme ideias em imagens em poucos segundos.',
    'Criar conta gratuita',
    'Preços e créditos do Qwen Image',
    'Compare subscrições mensais, planos pré-pagos Alipay e pacotes de créditos sem renovação automática.',
  ],
  it: [
    'Generatore Qwen Image 3.0 — Crea immagini IA online',
    'Crea immagini IA ricche di testo con prompt guidati, accesso verificato al modello, cronologia privata e prezzi a crediti trasparenti.',
    'Inizia gratis',
    'Descrivi la tua idea con parole semplici, scegli il formato e ottieni un’immagine curata con Qwen Image 3.',
    'Crea gratis',
    'Pronto a creare la tua prima immagine?',
    'Registrati gratis, ricevi i crediti iniziali e trasforma le tue idee in immagini in pochi secondi.',
    'Crea un account gratuito',
    'Prezzi e piani crediti Qwen Image',
    'Confronta abbonamenti mensili, formule prepagate Alipay e pacchetti di crediti senza rinnovo.',
  ],
  'zh-TW': [
    'Qwen Image 3.0 生成器｜線上建立 AI 圖片',
    '透過引導式提示詞與經驗證的模型，把想法變成文字清晰的 AI 圖片；創作紀錄保密，點數費用清楚透明。',
    '免費開始',
    '用日常語言描述想法、選擇圖片比例，Qwen Image 3 就能為你生成精緻成品。',
    '免費創作',
    '準備好建立第一張圖片了嗎？',
    '免費註冊並領取新手點數，幾秒內就能把想法變成視覺作品。',
    '建立免費帳號',
    'Qwen Image 價格與點數方案',
    '比較月繳訂閱、Alipay 預付會員，以及不會自動續訂的一次性點數包。',
  ],
  tr: [
    'Qwen Image 3.0 Oluşturucu — İnternetten Yapay Zekâ Görselleri Üretin',
    'Yönlendirmeli istemler, doğrulanmış model erişimi, gizli geçmiş ve şeffaf kredi ücretleriyle metni güçlü yapay zekâ görselleri üretin.',
    'Ücretsiz başlayın',
    'Fikrinizi günlük dille anlatın, biçimi seçin; Qwen Image 3 kullanıma hazır bir görsel oluştursun.',
    'Ücretsiz oluşturun',
    'İlk görselinizi oluşturmaya hazır mısınız?',
    'Ücretsiz kaydolun, başlangıç kredilerini alın ve fikirlerinizi saniyeler içinde görsele dönüştürün.',
    'Ücretsiz hesap açın',
    'Qwen Image Fiyatları ve Kredi Paketleri',
    'Aylık abonelikleri, Alipay ön ödemeli planları ve yenilenmeyen tek seferlik kredi paketlerini karşılaştırın.',
  ],
  vi: [
    'Trình tạo Qwen Image 3.0 — Tạo ảnh AI trực tuyến',
    'Tạo ảnh AI có chữ rõ nét với gợi ý từng bước, quyền truy cập mô hình đã xác minh, lịch sử riêng tư và mức phí tín dụng minh bạch.',
    'Bắt đầu miễn phí',
    'Mô tả ý tưởng bằng lời tự nhiên, chọn định dạng và để Qwen Image 3 tạo nên hình ảnh hoàn thiện.',
    'Tạo ảnh miễn phí',
    'Sẵn sàng tạo bức ảnh đầu tiên?',
    'Đăng ký miễn phí, nhận tín dụng khởi đầu và biến ý tưởng thành hình ảnh chỉ trong vài giây.',
    'Tạo tài khoản miễn phí',
    'Bảng giá và gói tín dụng Qwen Image',
    'So sánh gói tháng, gói trả trước qua Alipay và gói tín dụng mua một lần không tự động gia hạn.',
  ],
  nl: [
    'Qwen Image 3.0-generator — Maak online AI-afbeeldingen',
    'Maak AI-afbeeldingen met scherpe tekst via begeleide prompts, geverifieerde modeltoegang, een privégeschiedenis en transparante creditprijzen.',
    'Gratis beginnen',
    'Beschrijf je idee in gewone woorden, kies een formaat en maak met Qwen Image 3 een professioneel beeld.',
    'Gratis maken',
    'Klaar om je eerste afbeelding te maken?',
    'Meld je gratis aan, ontvang startcredits en zet je ideeën binnen enkele seconden om in beeld.',
    'Gratis account maken',
    'Prijzen en creditbundels voor Qwen Image',
    'Vergelijk maandabonnementen, prepaidplannen via Alipay en eenmalige creditbundels zonder verlenging.',
  ],
  th: [
    'Qwen Image 3.0 — สร้างภาพ AI ออนไลน์',
    'สร้างภาพ AI ที่มีข้อความคมชัดด้วยพรอมต์แนะนำ การเข้าถึงโมเดลที่ผ่านการตรวจสอบ ประวัติส่วนตัว และราคาเครดิตที่โปร่งใส',
    'เริ่มใช้ฟรี',
    'อธิบายไอเดียด้วยภาษาที่ใช้จริง เลือกรูปแบบ แล้วให้ Qwen Image 3 สร้างภาพที่พร้อมใช้งาน',
    'สร้างฟรี',
    'พร้อมสร้างภาพแรกแล้วหรือยัง?',
    'สมัครฟรี รับเครดิตเริ่มต้น และเปลี่ยนไอเดียให้เป็นภาพได้ในไม่กี่วินาที',
    'สร้างบัญชีฟรี',
    'ราคาและแพ็กเกจเครดิต Qwen Image',
    'เปรียบเทียบสมาชิกรายเดือน แพ็กเกจเติมเงินผ่าน Alipay และเครดิตแบบซื้อครั้งเดียวที่ไม่ต่ออายุอัตโนมัติ',
  ],
  pl: [
    'Generator Qwen Image 3.0 — Twórz obrazy AI online',
    'Twórz obrazy AI z wyraźnym tekstem dzięki podpowiedziom, zweryfikowanemu dostępowi do modelu, prywatnej historii i przejrzystym cenom kredytów.',
    'Zacznij bezpłatnie',
    'Opisz pomysł własnymi słowami, wybierz format i stwórz dopracowany obraz za pomocą Qwen Image 3.',
    'Twórz bezpłatnie',
    'Gotowy na swój pierwszy obraz?',
    'Załóż bezpłatne konto, odbierz kredyty na start i zamieniaj pomysły w obrazy w kilka sekund.',
    'Załóż bezpłatne konto',
    'Cennik i pakiety kredytów Qwen Image',
    'Porównaj abonamenty miesięczne, plany przedpłacone Alipay i jednorazowe pakiety kredytów bez odnowienia.',
  ],
  hu: [
    'Qwen Image 3.0 képgenerátor — AI-képek online',
    'Készíts szövegekben is pontos AI-képeket vezetett promptokkal, ellenőrzött modell-hozzáféréssel, privát előzményekkel és átlátható kreditárakkal.',
    'Kezdd ingyen',
    'Írd le az ötleted hétköznapi szavakkal, válassz formátumot, a Qwen Image 3 pedig elkészíti a kidolgozott képet.',
    'Alkoss ingyen',
    'Készen állsz az első képedre?',
    'Regisztrálj ingyen, vedd át a kezdő krediteket, és alakítsd képpé az ötleteidet másodpercek alatt.',
    'Ingyenes fiók létrehozása',
    'Qwen Image árak és kreditcsomagok',
    'Hasonlítsd össze a havi előfizetéseket, az Alipay-előrefizetést és a megújulás nélküli kreditcsomagokat.',
  ],
};

const keys = [
  'common.metadata.title',
  'common.metadata.description',
  'common.nav.get_started',
  'landing.hero.subheadline',
  'landing.hero.cta',
  'landing.cta.headline',
  'landing.cta.subheadline',
  'landing.cta.button',
  'landing.pricing.title',
  'landing.pricing.description',
];

const workflowRefinements = {
  es: [
    'Generar imagen',
    'Creando tu imagen…',
    '1. Describe la imagen que quieres',
    'Regístrate',
  ],
  ko: [
    '이미지 생성',
    '이미지를 만드는 중…',
    '1. 원하는 이미지를 설명해 주세요',
    '회원가입',
  ],
  ja: [
    '画像を生成',
    '画像を生成しています…',
    '1. 作りたい画像を説明してください',
    '新規登録',
  ],
  de: [
    'Bild erstellen',
    'Bild wird erstellt…',
    '1. Beschreibe dein gewünschtes Bild',
    'Registrieren',
  ],
  fr: [
    'Générer l’image',
    'Création de votre image…',
    '1. Décrivez l’image que vous souhaitez',
    'S’inscrire',
  ],
  ar: [
    'إنشاء الصورة',
    'جارٍ إنشاء صورتك…',
    '1. صِف الصورة التي تريدها',
    'إنشاء حساب',
  ],
  pt: [
    'Gerar imagem',
    'A criar a sua imagem…',
    '1. Descreva a imagem que pretende',
    'Criar conta',
  ],
  it: [
    'Genera immagine',
    'Creazione dell’immagine…',
    '1. Descrivi l’immagine che desideri',
    'Registrati',
  ],
  'zh-TW': ['生成圖片', '正在生成圖片…', '1. 描述你想建立的圖片', '註冊'],
  tr: [
    'Görsel oluştur',
    'Görseliniz oluşturuluyor…',
    '1. İstediğiniz görseli anlatın',
    'Kaydol',
  ],
  vi: [
    'Tạo ảnh',
    'Đang tạo ảnh của bạn…',
    '1. Mô tả hình ảnh bạn muốn tạo',
    'Đăng ký',
  ],
  nl: [
    'Afbeelding maken',
    'Je afbeelding wordt gemaakt…',
    '1. Beschrijf de afbeelding die je wilt',
    'Registreren',
  ],
  th: [
    'สร้างภาพ',
    'กำลังสร้างภาพของคุณ…',
    '1. อธิบายภาพที่คุณต้องการ',
    'สมัครสมาชิก',
  ],
  pl: [
    'Wygeneruj obraz',
    'Tworzenie obrazu…',
    '1. Opisz obraz, który chcesz stworzyć',
    'Zarejestruj się',
  ],
  hu: [
    'Kép létrehozása',
    'A kép készül…',
    '1. Írd le, milyen képet szeretnél',
    'Regisztráció',
  ],
};

const workflowKeys = [
  'landing.generator.generate',
  'landing.generator.generating',
  'landing.generator.prompt_label',
  'common.sign.sign_up_title',
];

const locales = process.argv.slice(2);
for (const locale of locales.length ? locales : Object.keys(sharedKeys)) {
  const file = path.resolve(`messages/${locale}.json`);
  let messages;
  try {
    messages = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    continue;
  }
  keys.forEach((key, index) => {
    messages[key] = sharedKeys[locale][index];
  });
  workflowKeys.forEach((key, index) => {
    messages[key] = workflowRefinements[locale][index];
  });
  if (locale === 'ko') {
    for (const key of Object.keys(messages)) {
      if (key === '$schema' || key.includes('card')) continue;
      messages[key] = messages[key]
        .replaceAll('신용 기록', '크레딧 내역')
        .replaceAll('신용기록', '크레딧 내역')
        .replaceAll('신용 비용', '크레딧 비용')
        .replaceAll('신용 가격', '크레딧 요금')
        .replaceAll('신용 계획', '크레딧 요금제')
        .replaceAll('신용 팩', '크레딧 팩')
        .replaceAll('신용 값', '크레딧 값')
        .replaceAll('신용 한도', '크레딧 한도');
    }
  }
  if (locale === 'de') {
    for (const key of Object.keys(messages)) {
      if (key === '$schema') continue;
      messages[key] = messages[key]
        .replaceAll('Kreditkosten', 'Credit-Kosten')
        .replaceAll('Kreditpreisen', 'Credit-Preisen')
        .replaceAll('Kreditwerte', 'Credit-Werte')
        .replaceAll('Kredithistorie', 'Credit-Verlauf')
        .replaceAll('Kreditzuschuss', 'Credit-Guthaben')
        .replaceAll('Kreditpläne', 'Credit-Pakete');
    }
  }
  await writeFile(file, `${JSON.stringify(messages, null, 2)}\n`, 'utf8');
  console.log(`${locale}: localized overrides applied`);
}
