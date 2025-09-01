export function calculateQuestionnaireScore(values: Record<string, FormDataEntryValue>): number {
    return Object.values(values).reduce((total, value) => {
        if (typeof value === 'string') {
            if (value === 'on') {
                return total + 1;
            }
            const numeric = Number(value);
            if (!isNaN(numeric)) {
                return total + numeric;
            }
        }
        return total;
    }, 0);
}
