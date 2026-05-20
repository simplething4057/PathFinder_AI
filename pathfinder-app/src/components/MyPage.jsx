import { useState } from 'react';
import { userApi, authApi } from '../utils/api';

export default function MyPage({ user, onUpdate, onClose }) {
  const [form, setForm] = useState({
    age:         user.age         ?? '',
    gender:      user.gender      ?? '',
    occupation:  user.occupation  ?? '',
    family_info: user.family_info ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  // 비밀번호 변경
  const [pwOpen,    setPwOpen]    = useState(false);
  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updatePw = (k, v) => setPwForm(p => ({ ...p, [k]: v }));

  const handlePasswordChange = async () => {
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.'); return;
    }
    if (pwForm.next.length < 8) {
      setPwError('새 비밀번호는 8자 이상이어야 합니다.'); return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setPwSuccess(false); setPwOpen(false); }, 2000);
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { user: updated } = await userApi.updateProfile(form);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
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
    flex: 1, padding: '8px 0',
    border: `1px solid ${form.gender === val ? '#2E75B6' : '#CBD5E0'}`,
    borderRadius: 8, background: form.gender === val ? '#EBF4FF' : '#fff',
    color: form.gender === val ? '#2E75B6' : '#4A5568',
    fontWeight: form.gender === val ? 700 : 400,
    fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div className="card" style={{ maxWidth: 480, width: '100%' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>👤 마이페이지</h1>
          <p>{user.email}</p>
        </div>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#A0AEC0', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      <div className="card-body">
        {/* 기본 정보 (읽기 전용) */}
        <div style={{
          background: '#F7FAFC', borderRadius: 8, padding: '12px 16px',
          marginBottom: 20, fontSize: 13, color: '#4A5568',
        }}>
          <strong style={{ color: '#2D3748' }}>{user.name}</strong>
          <span style={{ marginLeft: 10, color: '#718096' }}>
            {user.age ? `${user.age}세` : ''} {user.gender ? `· ${user.gender}성` : ''}
          </span>
        </div>

        {/* 나이 + 성별 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>나이</label>
            <input type="number" value={form.age}
              onChange={e => update('age', e.target.value)}
              placeholder="예: 28" min="5" max="120" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2E75B6'}
              onBlur={e => e.target.style.borderColor = '#CBD5E0'}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>성별</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={genderBtnStyle('남')} onClick={() => update('gender', '남')}>남성</button>
              <button type="button" style={genderBtnStyle('여')} onClick={() => update('gender', '여')}>여성</button>
            </div>
          </div>
        </div>

        {/* 직업 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
            직업 <span style={{ fontWeight: 400, color: '#A0AEC0' }}>(선택)</span>
          </label>
          <input type="text" value={form.occupation}
            onChange={e => update('occupation', e.target.value)}
            placeholder="예: 직장인, 학생, 자영업 등" style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#2E75B6'}
            onBlur={e => e.target.style.borderColor = '#CBD5E0'}
          />
        </div>

        {/* 가족관계 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 6 }}>
            가족관계 <span style={{ fontWeight: 400, color: '#A0AEC0' }}>(선택)</span>
          </label>
          <textarea value={form.family_info}
            onChange={e => update('family_info', e.target.value)}
            placeholder="예: 부모님과 거주, 기혼 자녀 2명, 독거 등 가족 구성을 자유롭게 적어주세요."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = '#2E75B6'}
            onBlur={e => e.target.style.borderColor = '#CBD5E0'}
          />
          <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
            * 검사 결과 해석에 참고용으로만 활용됩니다.
          </div>
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

        {/* 비밀번호 변경 아코디언 */}
        <div style={{
          border: '1px solid #E2E8F0', borderRadius: 8,
          marginBottom: 16, overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => { setPwOpen(o => !o); setPwError(''); setPwSuccess(false); }}
            style={{
              width: '100%', padding: '11px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: pwOpen ? '#EBF4FF' : '#F7FAFC',
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#2D3748',
            }}
          >
            <span>🔐 비밀번호 변경</span>
            <span style={{ fontSize: 10, color: '#A0AEC0' }}>{pwOpen ? '▲' : '▼'}</span>
          </button>

          {pwOpen && (
            <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0' }}>
              {['current', 'next', 'confirm'].map((key, i) => (
                <div key={key} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', display: 'block', marginBottom: 4 }}>
                    {key === 'current' ? '현재 비밀번호' : key === 'next' ? '새 비밀번호' : '새 비밀번호 확인'}
                  </label>
                  <input
                    type="password"
                    value={pwForm[key]}
                    onChange={e => updatePw(key, e.target.value)}
                    placeholder={key === 'current' ? '현재 비밀번호 입력' : '8자 이상'}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2E75B6'}
                    onBlur={e => e.target.style.borderColor = '#CBD5E0'}
                  />
                </div>
              ))}

              {pwError && (
                <div style={{ fontSize: 12, color: '#C53030', marginTop: 10 }}>⚠️ {pwError}</div>
              )}
              {pwSuccess && (
                <div style={{ fontSize: 12, color: '#38A169', marginTop: 10 }}>✓ 비밀번호가 변경되었습니다.</div>
              )}

              <button
                className="btn-primary"
                onClick={handlePasswordChange}
                disabled={pwSaving}
                style={{ marginTop: 12, fontSize: 13 }}
              >
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ flex: 1, opacity: saving ? 0.7 : 1 }}>
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
          </button>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', border: '1px solid #CBD5E0',
              borderRadius: 8, background: '#fff', color: '#4A5568',
              fontSize: 14, cursor: 'pointer',
            }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
