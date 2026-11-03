import { fileUrl } from './api.js';

export default function Attachment({ file, onRemove }) {
  if (!file) return null;
  const isImage = file.mime.startsWith('image/');
  const url = fileUrl(file.id);
  return (
    <div className="attach">
      {isImage
        ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={file.name} /></a>
        : <span aria-hidden="true">📄</span>}
      <a href={url} target="_blank" rel="noopener noreferrer">{file.name}</a>
      <span className="note">({Math.max(1, Math.round(file.size / 1024))} ك.ب)</span>
      {onRemove && <button className="btn del sm" type="button" onClick={onRemove}>إزالة</button>}
    </div>
  );
}
