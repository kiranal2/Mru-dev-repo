// Simple formula evaluator for calculated columns

export interface EvaluationContext {
  [key: string]: any;
}

export function evaluateFormula(
  expression: string,
  context: EvaluationContext
): number | string | null {
  try {
    let processedExpression = expression.trim();

    if (!processedExpression) {
      console.warn("Empty expression provided to evaluateFormula");
      return null;
    }

    // Create a map of field keys (case-insensitive) to their values
    const fieldMap = new Map<string, number>();
    const fieldKeys = Object.keys(context);

    for (const key of fieldKeys) {
      const value = context[key];
      let numValue: number;

      if (typeof value === "number") {
        numValue = value;
      } else if (typeof value === "string") {
        // Try to parse as number, handle empty strings and null
        numValue = value === "" || value === null || value === undefined ? 0 : parseFloat(value);
      } else {
        numValue = 0;
      }

      if (isNaN(numValue)) {
        numValue = 0;
      }

      // Store both original case and uppercase for matching
      fieldMap.set(key, numValue);
      fieldMap.set(key.toUpperCase(), numValue);
      fieldMap.set(key.toLowerCase(), numValue);
    }

    // Replace field names in expression (case-insensitive, word boundaries)
    // Sort keys by length (longest first) to avoid partial matches
    const sortedKeys = Array.from(fieldMap.keys()).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const numValue = fieldMap.get(key) || 0;
      processedExpression = processedExpression.replace(regex, numValue.toString());
    }

    // Check if expression is valid (only numbers, operators, and parentheses)
    const validExpression = /^[\d\s+\-*/().]+$/.test(processedExpression);
    if (!validExpression) {
      console.warn("Invalid expression after field replacement:", processedExpression);
      throw new Error("Invalid expression");
    }

    // Evaluate the expression
    const result = Function(`"use strict"; return (${processedExpression})`)();

    if (typeof result !== "number" || !isFinite(result)) {
      console.warn("Formula evaluation resulted in non-numeric or infinite value:", result);
      return null;
    }

    return result;
  } catch (error) {
    console.error("Error evaluating formula:", expression, error);
    return null;
  }
}

export function validateFormula(
  expression: string,
  availableFields: string[]
): { valid: boolean; error?: string } {
  try {
    if (!expression.trim()) {
      return { valid: false, error: "Formula cannot be empty" };
    }

    let testExpression = expression.trim();
    for (const field of availableFields) {
      const regex = new RegExp(`\\b${field}\\b`, "g");
      testExpression = testExpression.replace(regex, "1");
    }

    const validChars = /^[\d\s+\-*/().]+$/.test(testExpression);
    if (!validChars) {
      return {
        valid: false,
        error: "Formula contains invalid characters. Use only +, -, *, /, (), and field names.",
      };
    }

    try {
      Function(`"use strict"; return (${testExpression})`)();
    } catch {
      return {
        valid: false,
        error: "Invalid formula syntax. Check parentheses and operators.",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to validate formula",
    };
  }
}
