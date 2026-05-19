import { useState } from 'react';
import { authApi, tokenStore } from '../utils/api';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ email: '', password: '', name: '', age: '', gender: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await authApi.login(form.email, form.password);
      } else {
        if (!form.name.trim())   { setError('이름을 입력해주세요.'); setLoading(false); return; }
        if (!form.age)           { setError('나이를 입력해주세요.'); setLoading(false); return; }
        if (!form.gender)        { setError('성별을 선택해주세요.'); setLoading(false); return; }
        const ageNum = parseInt(form.age, 10);
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
          setError('올바른 나이를 입력해주세요.'); setLoading(false); return;
        }
        data = await authApi.register(form.email, form.password, form.name, ageNum, form.gender);
      }
      tokenStore.set(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #CBD5E0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const genderBtnStyle = (val) => ({
    flex: 1, padding: '10px 0',
    border: `1px solid ${form.gender === val ? '#2E75B6' : '#CBD5E0'}`,
    borderRadius: 8, background: form.gender === val ? '#EBF4FF' : '#fff',
    color: form.gender === val ? '#2E75B6' : '#4A5568',
    fontWeight: form.gender === val ? 700 : 400,
    fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div className="card" style={{ maxWidth: 440, width: '100%' }}>
      <div className="card-header">
        <h1>🔐 {mode === 'login' ? '로그인' : '회원가입'}</h1>
        <p>PathFinder AI에 오신 것을 환영합니다</p>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>

          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
                  이름 <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input type="text" value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="홍길동" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2E75B6'}
                  onBlur={e => e.target.style.borderColor = '#CBD5E0'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
                    나이 <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input type="number" value={form.age}
                    onChange={e => update('age', e.target.value)}
                    placeholder="예: 28" min="5" max="120" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2E75B6'}
                    onBlur={e => e.target.style.borderColor = '#CBD5E0'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
                    성별 <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={genderBtnStyle('남')} onClick={() => update('gender', '남')}>남성</button>
                    <button type="button" style={genderBtnStyle('여')} onClick={() => update('gender', '여')}>여성</button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
              이메일
            </label>
            <input type="email" value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="example@email.com" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2E75B6'}
              onBlur={e => e.target.style.borderColor = '#CBD5E0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
              비밀번호
            </label>
            <input type="password" value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder={mode === 'register' ? '8자 이상' : '비밀번호 입력'} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2E75B6'}
              onBlur={e => e.target.style.borderColor = '#CBD5E0'}
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF5F5', border: '1px solid #FED7D7',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#C53030', marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#718096' }}>
          {mode === 'login' ? (
            <>계정이 없으신가요?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#2E75B6', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                회원가입
              </button>
            </>
          ) : (
            <>이미 계정이 있으신가요?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#2E75B6', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
