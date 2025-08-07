import { useState, useCallback } from "react";
import { z } from "zod";

export type ZodSchema = z.ZodSchema<any>;

export interface FormState<T extends Record<string, any>> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

export function useZodForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: T
) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false,
  });

  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      try {
        // Valida apenas o campo específico usando pick
        const fieldSchema = z.object({ [name]: (schema as any).shape[name] });
        fieldSchema.parse({ [name]: value });
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.issues[0]?.message || "Erro de validação";
        }
        return "Erro de validação";
      }
    },
    [schema]
  );

  const validateAllFields = useCallback((): boolean => {
    try {
      schema.parse(formState.data);
      setFormState((prev) => ({
        ...prev,
        errors: {},
        isValid: true,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof T;
            errors[fieldName] = err.message;
          }
        });
        setFormState((prev) => ({
          ...prev,
          errors,
          isValid: false,
        }));
      }
      return false;
    }
  }, [schema, formState.data]);

  const setFieldValue = useCallback(
    (name: keyof T, value: any, shouldTouch: boolean = true) => {
      const error = validateField(name, value);

      setFormState((prev) => {
        const newData = {
          ...prev.data,
          [name]: value,
        };

        const newErrors = {
          ...prev.errors,
          [name]: error,
        };

        // Remover erro se não houver
        if (!error) {
          delete newErrors[name];
        }

        // Verificar se o formulário está válido
        let isFormValid = false;
        try {
          schema.parse(newData);
          isFormValid = Object.keys(newErrors).length === 0;
        } catch (schemaError) {
          isFormValid = false;
        }

        return {
          ...prev,
          data: newData,
          errors: newErrors,
          isValid: isFormValid,
          touched: shouldTouch
            ? {
                ...prev.touched,
                [name]: true,
              }
            : prev.touched,
        };
      });
    },
    [validateField, schema]
  );

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState((prev) => ({
      ...prev,
      isSubmitting,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      data: initialData,
      errors: {},
      touched: {},
      isValid: false,
      isSubmitting: false,
    });
  }, [initialData]);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: formState.data[name] || "",
      error: formState.errors[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setFieldValue(name, e.target.value),
    }),
    [formState.data, formState.errors, setFieldValue]
  );

  return {
    formState,
    setFieldValue,
    validateAllFields,
    setSubmitting,
    resetForm,
    getFieldProps,
  };
}
