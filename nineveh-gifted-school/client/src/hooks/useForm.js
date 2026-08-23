import { useState, useCallback } from 'react';

export function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (touched[name]) {
      const validationErrors = validate({ ...values, [name]: type === 'checkbox' ? checked : value });
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  }, [values, validate, touched]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const validationErrors = validate(values);
    setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
  }, [values, validate]);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    
    const validationErrors = validate(values);
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    setErrors(validationErrors);
    
    if (hasErrors) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    setValues,
    setErrors
  };
}