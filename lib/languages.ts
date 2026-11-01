export const LANGUAGES = [
  {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    locale: "en-US",
    native: "English",
    style: "chill, everyday English with light slang",
    refusal:
      "Ha, that's way outside my lane — I'm just here to chat like a normal person. Anyway, what's been the highlight of your day?",
    starters: [
      "Tell me about your weekend.",
      "What kind of music do you like?",
      "Help me practice ordering coffee.",
    ],
    quickReplies: ["That sounds fun!", "Tell me more.", "No way, really?"],
  },
  {
    code: "id",
    label: "Bahasa Indonesia",
    flag: "🇮🇩",
    locale: "id-ID",
    native: "Bahasa Indonesia",
    style: "gaul, santai, bahasa sehari-hari",
    refusal:
      "Haha, itu mah di luar urusanku, aku cuma mau ngobrol santai kayak orang biasa. Btw, hari ini ada cerita seru nggak?",
    starters: [
      "Cerita dong weekend kamu.",
      "Kamu suka musik apa?",
      "Ajak aku ngobrol soal makanan favorit.",
    ],
    quickReplies: ["Seru banget!", "Cerita lagi dong.", "Serius? Nggak mungkin."],
  },
  {
    code: "es",
    label: "Español",
    flag: "🇪🇸",
    locale: "es-ES",
    native: "español",
    style: "español casual con jerga cotidiana",
    refusal:
      "Jaja, eso está fuera de mi alcance, solo estoy aquí para charlar como una persona normal. ¿Qué tal tu día?",
    starters: [
      "Cuéntame de tu fin de semana.",
      "¿Qué música te gusta?",
      "Hablemos de tu comida favorita.",
    ],
    quickReplies: ["¡Qué guay!", "Cuéntame más.", "¿En serio?"],
  },
  {
    code: "fr",
    label: "Français",
    flag: "🇫🇷",
    locale: "fr-FR",
    native: "français",
    style: "français décontracté avec un peu d'argot",
    refusal:
      "Haha, ça sort carrément de mon domaine, je suis juste là pour discuter comme une personne normale. Sinon, ta journée s'est passée comment ?",
    starters: [
      "Raconte-moi ton week-end.",
      "Tu écoutes quoi comme musique ?",
      "Parlons de ton plat préféré.",
    ],
    quickReplies: ["Trop cool !", "Raconte encore.", "Sérieux ?"],
  },
  {
    code: "de",
    label: "Deutsch",
    flag: "🇩🇪",
    locale: "de-DE",
    native: "Deutsch",
    style: "lockeres Alltagsdeutsch mit etwas Slang",
    refusal:
      "Haha, das liegt echt außerhalb meiner Reichweite, ich bin nur zum lockeren Quatschen hier. Und, was war heute so los bei dir?",
    starters: [
      "Erzähl mal von deinem Wochenende.",
      "Was für Musik hörst du?",
      "Lass uns über dein Lieblingsessen reden.",
    ],
    quickReplies: ["Klingt cool!", "Erzähl mehr.", "Echt jetzt?"],
  },
  {
    code: "ja",
    label: "日本語",
    flag: "🇯🇵",
    locale: "ja-JP",
    native: "日本語",
    style: "カジュアルで日常的な日本語",
    refusal:
      "はは、それはちょっと僕の守備範囲外だよ。普通に雑談するためにここにいるだけなんだ。ところで、今日はどんな一日だった？",
    starters: ["週末は何してた？", "どんな音楽が好き？", "好きな食べ物について話そう。"],
    quickReplies: ["いいね！", "もっと聞かせて。", "え、本当？"],
  },
  {
    code: "ko",
    label: "한국어",
    flag: "🇰🇷",
    locale: "ko-KR",
    native: "한국어",
    style: "편하고 일상적인 한국어",
    refusal:
      "하하, 그건 좀 내 범위 밖이야. 난 그냥 평범하게 수다 떨러 왔을 뿐이야. 그나저나 오늘 하루 어땠어?",
    starters: ["주말에 뭐 했어?", "어떤 음악 좋아해?", "좋아하는 음식 얘기하자."],
    quickReplies: ["좋다!", "더 얘기해 줘.", "진짜?"],
  },
  {
    code: "zh",
    label: "中文",
    flag: "🇨🇳",
    locale: "zh-CN",
    native: "中文",
    style: "轻松、生活化的中文口语",
    refusal:
      "哈哈，这个我可帮不上忙，我就是来像普通人一样聊天的。对了，你今天过得怎么样？",
    starters: ["周末过得怎么样？", "你喜欢什么音乐？", "聊聊你最喜欢的食物吧。"],
    quickReplies: ["听起来不错！", "多说点。", "真的假的？"],
  },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function getLanguage(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isLanguageCode(code: string): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

const ALIASES: Record<LanguageCode, string[]> = {
  en: ["english", "inggris"],
  id: ["indonesian", "bahasa indonesia", "indonesia"],
  es: ["spanish", "español", "spanyol"],
  fr: ["french", "français", "prancis", "perancis"],
  de: ["german", "deutsch", "jerman"],
  ja: ["japanese", "日本語", "jepang", "jepun"],
  ko: ["korean", "한국어", "korea"],
  zh: ["chinese", "中文", "mandarin", "cina", "tiongkok"],
};

const SWITCH_INTENT =
  /\b(speak|talk|reply|answer|chat|bicara|ngomong|ngobrol|balas|jawab|pakai|pake|use|switch|ganti|ubah)\b/i;

export function detectRequestedLanguage(text: string): LanguageCode | null {
  const lower = text.toLowerCase();
  if (!SWITCH_INTENT.test(lower) && !/\bbahasa\b/i.test(lower)) return null;
  for (const [code, aliases] of Object.entries(ALIASES) as [LanguageCode, string[]][]) {
    if (aliases.some((a) => lower.includes(a))) return code;
  }
  return null;
}