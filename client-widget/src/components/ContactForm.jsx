import React, { useState } from 'react';

const ContactForm = ({ config, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    config.fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} là bắt buộc`;
      }

      // Validate email
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Email không đúng định dạng';
        }
      }

      // Validate phone
      if (field.type === 'tel' && formData[field.name]) {
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Số điện thoại không đúng định dạng';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Chuẩn bị dữ liệu form
      const submitData = {};
      config.fields.forEach(field => {
        submitData[field.name] = formData[field.name] || '';
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleInputChange,
      className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        errors[field.name] ? 'border-red-500' : 'border-gray-300'
      }`,
      placeholder: field.label
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={3}
            maxLength={500}
          />
        );
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">-- Chọn {field.label} --</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            {...commonProps}
            type={field.type || 'text'}
            maxLength={field.type === 'tel' ? 15 : 100}
          />
        );
    }
  };

  return (
    <div className="contact-form">
      <div className="form-header">
        <h3>Liên hệ hỗ trợ</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="close-button"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div className="form-body">
        <p className="form-description">
          Vui lòng điền thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map(field => (
            <div key={field.name} className="form-field">
              <label htmlFor={field.name} className="field-label">
                {field.label}
                {field.required && <span className="required-star">*</span>}
              </label>
              {renderField(field)}
              {errors[field.name] && (
                <span className="error-message">{errors[field.name]}</span>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Đang gửi...
              </>
            ) : (
              'Bắt đầu chat'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;