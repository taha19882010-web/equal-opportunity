import { useCallback, useRef, useState } from 'react';

/** In-page replacements for alert() and confirm(). */
export function useUI() {
  const [toast, setToast] = useState('');
  const [dlg, setDlg] = useState(null);
  const timer = useRef();

  const say = useCallback((m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 7000);
  }, []);

  const ask = useCallback((m) => new Promise((res) => setDlg({ m, res })), []);
  const close = (v) => { dlg.res(v); setDlg(null); };

  const ui = (
    <>
      {dlg && (
        <div id="dlg" role="dialog" aria-modal="true">
          <div className="dbox">
            <p>{dlg.m}</p>
            <div className="row">
              <button className="btn" onClick={() => close(true)}>موافق</button>
              <button className="btn ghost" autoFocus onClick={() => close(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div id="toast" role="status">{toast}</div>}
    </>
  );
  return { say, ask, ui };
}
