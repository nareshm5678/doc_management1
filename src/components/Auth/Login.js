import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileText, User, Lock, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    { role: 'Admin', username: 'admin' },
    { role: 'Supervisor (HR)', username: 'supervisor1' },
    { role: 'Supervisor (IT)', username: 'supervisor2' },
    { role: 'Operator (HR)', username: 'operator1' },
    { role: 'Operator (IT)', username: 'operator2' }
  ];

  const fillDemo = (username, password) => {
    setFormData({ username, password });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FileText className="login-icon" size={48} />
          <h1>Document Management System</h1>
          <p>Digital Documentation & Record Management</p>
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
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <LogIn size={20} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-section">
          <h3>Demo Credentials</h3>
          <div className="demo-credentials">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="demo-item">
                <span className="demo-role">{cred.role}:</span>
                <button
                  type="button"
                  className="demo-button"
                  onClick={() => fillDemo(cred.username, cred.password)}
                  disabled={loading}
                >
                  {cred.username} / {cred.password}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
