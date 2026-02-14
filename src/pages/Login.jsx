import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../auth/AuthContext";
import SketchTitleComponent from "../components/SketchTitleComponent";
import SketchInput from "../components/SketchInput";
import SketchButton from "../components/SketchButton";
import { useToast } from "../toast/CustomToastHook";
import { logger } from "../utils/Logger";
import { LOGIN_CONFIG as CONFIG } from "../config/LabelConfig";

const Login = () => {

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showSuccessToast, showErrorToast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (id, value) => setFormData(prev => ({ ...prev, [id]: value }));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {

      const [response] = await Promise.all([
        login(formData.email, formData.password),
        new Promise(res => setTimeout(res, 500))
      ]);

      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logSuccess, response);
      showSuccessToast(CONFIG.messages.success);
      navigate("/");

    } catch (err) {

      setLoading(false);
      setError(CONFIG.messages.uiError);
      logger(CONFIG.fileName, CONFIG.methods.handleSubmit, CONFIG.messages.logFail, err.message);
      showErrorToast(CONFIG.messages.error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-1">
      <SketchTitleComponent isLogin={true} className="mb-6 ml-22" />
      
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-6">
        {CONFIG.fields.map((field) => (
          <SketchInput
            key={field.id}
            {...field}
            value={formData[field.id]}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        ))}

        {error && <div className="text-red-600 font-gloria text-center animate-bounce">{error}</div>}

        <SketchButton
          text={CONFIG.ui.loginButton.loginButtonText}
          color={CONFIG.ui.loginButton.loginButtonColor}
          isLoading={loading}
        />

        <button type="button" onClick={() => navigate("/register")} className="font-gloria text-gray-500 text-sm">
          No account? Register here
        </button>
      </form>
    </div>
  );
};

export default Login;
