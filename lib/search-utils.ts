const bgToEnMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'u', 
    'ь': 'y', 'ю': 'yu', 'я': 'ya'
};

const commonTerms: { [key: string]: string } = {
    'бебе в кола': 'baby in car',
    'бебе': 'baby',
    'монстър': 'monster',
    'мерцедес': 'mercedes',
    'бмв': 'bmw',
    'ауди': 'audi',
    'фолксваген': 'volkswagen',
    'в кола': 'in car'
};

export function transliterate(text: string): string {
    return text.toLowerCase().split('').map(char => bgToEnMap[char] || char).join('');
}

export function normalizeSearch(text: string): string[] {
    const original = text.toLowerCase().trim();
    const results = [original];

    // Check common terms
    for (const [bg, en] of Object.entries(commonTerms)) {
        if (original.includes(bg)) {
            results.push(original.replace(bg, en));
        }
    }

    // Add transliteration
    const transliterated = transliterate(original);
    if (transliterated !== original) {
        results.push(transliterated);
    }

    return results;
}
