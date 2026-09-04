import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/chat', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMsg(error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google กรุณาลองใหม่อีกครั้ง');
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="logo-pulse">กยศ.</div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="login-page" id="login-page">
      {/* Background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-card glass-strong">
        <div className="login-logo">กยศ.</div>
        
        <h1 className="gradient-text">กยศ. Chatbot</h1>
        
        <p className="login-subtitle">
          ระบบแชทบอทอัจฉริยะ สำหรับให้คำแนะนำเกี่ยวกับ
          <br />
          กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)
        </p>
        
        <p className="login-university">
          มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
        </p>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(225, 29, 72, 0.1)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--color-brand-rose)',
            fontSize: 'var(--text-sm)',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          id="google-login-btn"
          aria-label="เข้าสู่ระบบด้วย Google"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        <div className="login-footer">
          <p>
            ⚠️ ระบบนี้ให้คำแนะนำเบื้องต้นเกี่ยวกับ กยศ. เท่านั้น
            <br />
            ไม่สามารถเข้าถึงข้อมูลส่วนบุคคลหรือยอดหนี้ได้
          </p>
        </div>
      </div>
    </div>
  );
}
