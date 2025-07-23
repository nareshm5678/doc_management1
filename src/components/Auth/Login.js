import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileText, User, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', username: 'admin', password: 'admin123' },
    { role: 'Supervisor (HR)', username: 'supervisor1', password: 'super123' },
    { role: 'Supervisor (IT)', username: 'supervisor2', password: 'super123' },
    { role: 'Operator (HR)', username: 'operator1', password: 'oper123' },
    { role: 'Operator (IT)', username: 'operator2', password: 'oper123' }
  ];

  const fillDemo = (username, password) => {
    setFormData({ username, password });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-container">
            <FileText className="login-icon" size={52} />
            <div className="brand-text">
              <h1>Document Management</h1>
              <p>Digital Documentation & Record Management</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <div className="input-container">
              <User className="input-icon" size={20} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                aria-label="Password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading || !formData.username || !formData.password}
            aria-label="Sign in to your account"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="demo-section">
          <button
            type="button"
            className="demo-toggle"
            onClick={() => setShowDemo(!showDemo)}
            disabled={loading}
            aria-expanded={showDemo}
            aria-controls="demo-credentials"
          >
            <span>Try Demo Accounts</span>
            <span className={`demo-arrow ${showDemo ? 'expanded' : ''}`}>▼</span>
          </button>
          
          <div 
            id="demo-credentials" 
            className={`demo-credentials ${showDemo ? 'show' : ''}`}
            aria-hidden={!showDemo}
          >
            <p className="demo-description">
              Click any account below to auto-fill login credentials:
            </p>
            <div className="demo-grid">
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  type="button"
                  className="demo-card"
                  onClick={() => fillDemo(cred.username, cred.password)}
                  disabled={loading}
                  aria-label={`Use ${cred.role} demo account`}
                >
                  <div className="demo-role">{cred.role}</div>
                  <div className="demo-credentials-text">
                    <span className="demo-username">{cred.username}</span>
                    <span className="demo-separator">•</span>
                    <span className="demo-password">{cred.password}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
