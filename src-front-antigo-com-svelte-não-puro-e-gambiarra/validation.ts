/**
 * Frontend Validation Utilities
 * 
 * Provides validation functions for user input and data integrity
 */

/**
 * Validate appearance ID
 */
export function validateAppearanceId(id: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(id)) {
    return { valid: false, error: 'ID must be an integer' };
  }
  
  if (id <= 0) {
    return { valid: false, error: 'ID must be greater than 0' };
  }
  
  if (id > 999999) {
    return { valid: false, error: 'ID must be less than 1,000,000' };
  }
  
  return { valid: true };
}

/**
 * Validate brightness value (0-255)
 */
export function validateBrightness(brightness: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(brightness)) {
    return { valid: false, error: 'Brightness must be an integer' };
  }
  
  if (brightness < 0 || brightness > 255) {
    return { valid: false, error: 'Brightness must be between 0 and 255' };
  }
  
  return { valid: true };
}

/**
 * Validate color value (0x000000 - 0xFFFFFF)
 */
export function validateColor(color: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(color)) {
    return { valid: false, error: 'Color must be an integer' };
  }
  
  if (color < 0 || color > 0xFFFFFF) {
    return { valid: false, error: 'Color must be between 0x000000 and 0xFFFFFF' };
  }
  
  return { valid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string, 
  maxLength: number, 
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  if (value.length > maxLength) {
    return { 
      valid: false, 
      error: `${fieldName} exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate file path
 */
export function validateFilePath(path: string): { valid: boolean; error?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path is required' };
  }
  
  if (path.trim().length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }
  
  // Basic path validation (more comprehensive validation should be done on backend)
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) {
    return { valid: false, error: 'Path contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (value < min || value > max) {
    return { 
      valid: false, 
      error: `${fieldName} must be between ${min} and ${max}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  validate(value: any): { valid: boolean; error?: string };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate form data with multiple fields
 */
export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule[]>): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule.validate(value);
      if (!result.valid) {
        errors[field] = result.error!;
        break; // Stop at first error for this field
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') {
        return { valid: false, error: 'This field is required' };
      }
      return { valid: true };
    }
  }),
  
  minLength: (min: number): ValidationRule => ({
    validate: (value: string) => {
      if (typeof value === 'string' && value.length < min) {
        return { valid: false, error: `Minimum length is ${min} characters` };
      }
      return { valid: true };
    }
  }),
  
  maxLength: (max: number): ValidationRule => ({
    validate: (value: string) => {
      if (typeof value === 'string' && value.length > max) {
        return { valid: false, error: `Maximum length is ${max} characters` };
      }
      return { valid: true };
    }
  }),
  
  range: (min: number, max: number): ValidationRule => ({
    validate: (value: number) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { valid: false, error: 'Must be a valid number' };
      }
      if (value < min || value > max) {
        return { valid: false, error: `Must be between ${min} and ${max}` };
      }
      return { valid: true };
    }
  }),
  
  integer: (): ValidationRule => ({
    validate: (value: number) => {
      if (!Number.isInteger(value)) {
        return { valid: false, error: 'Must be an integer' };
      }
      return { valid: true };
    }
  }),
  
  positive: (): ValidationRule => ({
    validate: (value: number) => {
      if (typeof value !== 'number' || value <= 0) {
        return { valid: false, error: 'Must be a positive number' };
      }
      return { valid: true };
    }
  })
};
