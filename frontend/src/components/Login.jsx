import { useEffect, useState } from 'react';
import './Login.css';
import { useLoginMutation } from '../Redux/api';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ added
  const [error, setError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const logoutMsg = sessionStorage.getItem('gg_logout_msg');
    if (logoutMsg) {
      setLogoutMessage(logoutMsg);
      sessionStorage.removeItem('gg_logout_msg');
      setTimeout(() => setLogoutMessage(''), 3000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    try {
      const result = await login({ email, password }).unwrap();

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result));

      navigate("/Dashboard");

    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <div className="login-logo">🌿</div>
          <h1>Glow Green CRM</h1>
          <p>Sign in to your account</p>
        </div>


        {logoutMessage && (
          <div style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
          }}>
            {logoutMessage}
          </div>
        )}


        <form onSubmit={handleSubmit} className="login-form">

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>


          {/* ✅ Password With Show Hide */}
          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

            </div>

          </div>


          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >

            {isLoading && (
              <span className="login-spinner" />
            )}

            {isLoading
              ? 'Signing in...'
              : 'Sign In'
            }

          </button>


        </form>

      </div>
    </div>
  );
}

export default Login;