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

export function getLevenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

export function findClosestMatch(term: string, dictionary: string[]): string | null {
    if (term.length < 3) return null;
    
    let closest: string | null = null;
    let minDistance = 3; // Threshold for typo (max 2 characters difference for short words)

    for (const word of dictionary) {
        if (Math.abs(term.length - word.length) > minDistance) continue;
        
        const dist = getLevenshteinDistance(term.toLowerCase(), word.toLowerCase());
        if (dist > 0 && dist < minDistance) {
            minDistance = dist;
            closest = word;
        }
    }
    
    return closest;
}

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
