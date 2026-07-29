import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      navigate('/home', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigate]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      gap: 20,
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </div>
      <div style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>
        蜜蜂影视
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
        精彩影视，触手可及
      </div>
      <div style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        position: 'absolute',
        bottom: 40,
      }}>
        {count}s 后自动进入
      </div>
    </div>
  );
}
