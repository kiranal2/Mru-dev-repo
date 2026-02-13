// Shared in-memory storage for dynamic sheets
// In production, this would connect to a database
export const sheetsStorage = new Map<string, any>();
