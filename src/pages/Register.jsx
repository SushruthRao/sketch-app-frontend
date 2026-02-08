import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../service/UserService';
import SketchTitleComponent from '../components/SketchTitleComponent';
import SketchInput from '../components/SketchInput';
import SketchButton from '../components/SketchButton';
import { REGISTER_CONFIG as CONFIG } from '../config/LabelConfig';
import { logger } from '../utils/Logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;

const validate = (formData) => {
  const errors = {};

  if (!formData.username.trim()) {
    errors.username = 'Username is required';
  } else if (formData.username.trim().length < 3 || formData.username.trim().length > 20) {
    errors.username = 'Username must be between 3 and 20 characters';
  } else if (!USERNAME_REGEX.test(formData.username.trim())) {
    errors.username = 'Only letters, numbers, and underscores allowed';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!formData.passwordHash) {
    errors.passwordHash = 'Password is required';
  } else if (formData.passwordHash.length < 8) {
    errors.passwordHash = 'Password must be at least 8 characters';
  } else if (!PASSWORD_REGEX.test(formData.passwordHash)) {
    errors.passwordHash = 'Must include uppercase, lowercase, digit, and special character';
  }

  return errors;
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', passwordHash: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    setErrors({});

    try {
      const [response] = await Promise.all([
        registerUser(formData),
        new Promise((res) => setTimeout(res, 1000))
      ]);

      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logSuccess, response);
      setStatus({ type: 'success', message: CONFIG.messages.success });
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logFail, err.message);

      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      }
      setStatus({ type: 'error', message: err.message || CONFIG.messages.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-1">
      <div className="mb-6">
        <SketchTitleComponent isRegister={true} />
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-5">

        {CONFIG.fields.map((field) => (
          <SketchInput
            key={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={(e) => handleChange(field.id, e.target.value)}
            error={errors[field.id] || ''}
          />
        ))}

        {status.message && (
          <div className={`font-gloria text-center text-sm animate-pulse ${
            status.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status.message}
          </div>
        )}

        <div className="mt-2">
          <SketchButton
            text={CONFIG.ui.registerButton.registerButtonText}
            color={CONFIG.ui.registerButton.registerButtonColor}
            onClick={handleSubmit}
            isLoading={loading}
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-gloria text-gray-500 hover:text-black transition-colors text-sm mb-4"
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
};

export default Register;
