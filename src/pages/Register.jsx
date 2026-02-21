import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../service/UserService';
import SketchTitleComponent from '../components/SketchTitleComponent';
import SketchInput from '../components/SketchInput';
import SketchButton from '../components/SketchButton';
import { useToast } from '../toast/CustomToastHook';
import { REGISTER_CONFIG as CONFIG } from '../config/LabelConfig';
import { logger } from '../utils/Logger';
import SketchLoader from '../components/SketchLoader';
import { motion } from 'framer-motion';

const dropIn = {
  hidden: { y: -50, opacity: 0 },
  visible: (custom) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: custom * 0.2,
      type: "spring",
      stiffness: 40,
    },
  }),
};

const Register = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  const [formData, setFormData] = useState({ username: '', email: '', passwordHash: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatus({ type: '', message: '' });

    const username = formData.username.trim();
    if (!username) {
      setStatus({ type: 'error', message: 'Username cannot be blank' });
      showErrorToast('Username cannot be blank');
      return;
    }
    if (username.length > 24) {
      setStatus({ type: 'error', message: 'Username must be 24 characters or less' });
      showErrorToast('Username must be 24 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
      setStatus({ type: 'error', message: 'Username can only contain letters, numbers, underscores and spaces' });
      showErrorToast('Username can only contain letters, numbers, underscores and spaces');
      return;
    }

    setLoading(true);
    try {
      const [response] = await Promise.all([
        registerUser(formData),
        new Promise((res) => setTimeout(res, 1000))
      ]);

      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logSuccess, response);
      setStatus({ type: 'success', message: CONFIG.messages.success });
      showSuccessToast(CONFIG.messages.success);
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      const errorMsg = err.message || CONFIG.messages.error;
      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logFail, err.message);
      setStatus({ type: 'error', message: errorMsg });
      showErrorToast(errorMsg);

    } finally {

      setLoading(false);
    }
  };

  if (loading && !status.message) {
    return <SketchLoader message="Registering..." />;
  }

  if (isTransitioning) {
    return <SketchLoader message="Loading..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-1">
      <motion.div variants={dropIn} initial="hidden" animate="visible" custom={1} className="mb-6">
        <SketchTitleComponent isRegister={true} />
      </motion.div>
      <motion.form variants={dropIn} initial="hidden" animate="visible" custom={2} onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-5">

        {CONFIG.fields.map((field) => (
          <SketchInput
            key={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={(e) => handleChange(field.id, e.target.value)}
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

        <motion.button
          variants={dropIn} initial="hidden" animate="visible" custom={3}
          type="button"
          onClick={() => { setIsTransitioning(true); navigate('/login'); }}
          className="font-gloria text-gray-500 hover:text-black transition-colors text-sm mb-4"
        >
          Already have an account? Login
        </motion.button>
      </motion.form>
    </div>
  );
};

export default Register;
