import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  msg: string;
  onYes: () => void;
  onNo: () => void;
}

export default function Confirm({ open, msg, onYes, onNo }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onNo}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <AlertTriangle size={36} className="confirm-icon" />
        <p className="confirm-msg">{msg}</p>
        <div className="confirm-btns">
          <button onClick={onNo} className="btn btn-ghost">Cancelar</button>
          <button onClick={onYes} className="btn btn-danger">Eliminar</button>
        </div>
      </div>
    </div>
  );
}
