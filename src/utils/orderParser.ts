export interface ParsedOrder {
    quantity: number;
    product: string;
    customer: string;
    originalText: string;
}

// Specific products that beat generic terms
const SPECIFIC_PRODUCTS: Record<string, string> = {
    'negroni': 'Gelo Negroni',
    'negronis': 'Gelo Negroni',
    'whisky': 'Gelo Whisky',
    'esfera': 'Esfera',
    'esferas': 'Esfera',
    'cubo': 'Gelo (Cubo)',
    'cubos': 'Gelo (Cubo)',
};

// Generic terms that fallback to "Gelo (Saco)" ONLY if no specific product is found
const GENERIC_TRIGGERS = ['gelo', 'saco', 'sacos', 'pacote', 'pacotes'];

// Words to ignore when cleaning up customer name
const FILLER_WORDS = ['para', 'o', 'a', 'do', 'da', 'de', 'entregar', 'manda', 'mandar', 'cliente', 'separar', 'por', 'favor'];

// Map written numbers to digits
const NUMBER_WORDS: Record<string, number> = {
    'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3, 'quatro': 4,
    'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'quinze': 15,
    'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19, 'vinte': 20,
    'trinta': 30, 'quarenta': 40, 'cinquenta': 50, 'sessenta': 60
};

export function parseOrderText(text: string): ParsedOrder | null {
    if (!text) return null;

    const lowerText = text.toLowerCase();

    // 1. Extract Quantity
    let quantity = 1; // Default

    // Check for digits first
    const numberMatch = lowerText.match(/(\d+)/);
    if (numberMatch) {
        quantity = parseInt(numberMatch[0], 10);
    } else {
        // Check for number words
        for (const [word, value] of Object.entries(NUMBER_WORDS)) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            if (regex.test(lowerText)) {
                quantity = value;
                break;
            }
        }
    }

    // 2. Extract Product (Priority Logic)
    let product = 'Desconhecido';
    let foundSpecific = false;

    // A. Check Specific Products First
    for (const [keyword, standardizedName] of Object.entries(SPECIFIC_PRODUCTS)) {
        if (lowerText.includes(keyword)) {
            product = standardizedName;
            foundSpecific = true;
            break; // Stop at first specific match (e.g. found 'negroni')
        }
    }

    // B. If no specific product, check for generics
    if (!foundSpecific) {
        for (const trigger of GENERIC_TRIGGERS) {
            if (lowerText.includes(trigger)) {
                product = 'Gelo (Saco)';
                break;
            }
        }
    }

    // 3. Extract Customer
    // Strategy: Remove the quantity and product related words, and filler words. What remains is likely the customer.
    // Or, look for "para [CUSTOMER]" pattern.

    let customer = 'Balcão'; // Default

    // Split text into words
    const words = lowerText.split(' ');
    const potentialCustomerWords = [];

    for (const word of words) {
        // Skip number
        if (/\d+/.test(word)) continue;

        // Skip specific product keywords
        let isProductKeyword = false;
        for (const k of Object.keys(SPECIFIC_PRODUCTS)) {
            if (word.includes(k)) isProductKeyword = true;
        }
        if (isProductKeyword) continue;

        // Skip generic triggers
        if (GENERIC_TRIGGERS.includes(word) || GENERIC_TRIGGERS.some(t => word.includes(t))) continue;

        // Skip number words
        if (NUMBER_WORDS[word]) continue;

        // Check fillers
        if (FILLER_WORDS.includes(word)) {
            continue;
        }

        potentialCustomerWords.push(word);
    }

    // Capitalize standardized customer name
    if (potentialCustomerWords.length > 0) {
        // Basic Title Case
        customer = potentialCustomerWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return {
        quantity,
        product,
        customer,
        originalText: text
    };
}
