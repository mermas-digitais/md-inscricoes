import { useState, useCallback } from "react";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface FormField {
  value: any;
  rules: ValidationRule[];
  error?: string;
}

export interface FormState {
  [key: string]: FormField;
}

export function useFormValidation(initialState: FormState) {
  const [formState, setFormState] = useState<FormState>(initialState);

  const validateField = useCallback(
    (fieldName: string, value: any): string | undefined => {
      const field = formState[fieldName];
      if (!field) return undefined;

      for (const rule of field.rules) {
        // Required validation
        if (rule.required && (!value || value.toString().trim() === "")) {
          return rule.message;
        }

        // Skip other validations if field is empty and not required
        if (!value || value.toString().trim() === "") {
          continue;
        }

        // Min length validation
        if (rule.minLength && value.toString().length < rule.minLength) {
          return rule.message;
        }

        // Max length validation
        if (rule.maxLength && value.toString().length > rule.maxLength) {
          return rule.message;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value.toString())) {
          return rule.message;
        }

        // Custom validation
        if (rule.custom && !rule.custom(value)) {
          return rule.message;
        }
      }

      return undefined;
    },
    [formState]
  );

  const setFieldValue = useCallback(
    (fieldName: string, value: any) => {
      setFormState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
          error: validateField(fieldName, value),
        },
      }));
    },
    [validateField]
  );

  const validateAllFields = useCallback((): boolean => {
    let isValid = true;
    const newFormState = { ...formState };

    Object.keys(formState).forEach((fieldName) => {
      const error = validateField(fieldName, formState[fieldName].value);
      newFormState[fieldName] = {
        ...newFormState[fieldName],
        error,
      };
      if (error) {
        isValid = false;
      }
    });

    setFormState(newFormState);
    return isValid;
  }, [formState, validateField]);

  const resetForm = useCallback(() => {
    const resetState: FormState = {};
    Object.keys(formState).forEach((fieldName) => {
      resetState[fieldName] = {
        ...formState[fieldName],
        value: "",
        error: undefined,
      };
    });
    setFormState(resetState);
  }, [formState]);

  const getFieldProps = useCallback(
    (fieldName: string) => ({
      value: formState[fieldName]?.value || "",
      error: formState[fieldName]?.error,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFieldValue(fieldName, e.target.value),
    }),
    [formState, setFieldValue]
  );

  return {
    formState,
    setFieldValue,
    validateAllFields,
    resetForm,
    getFieldProps,
    isValid: Object.values(formState).every(
      (field) => !field.error && field.value
    ),
  };
}
