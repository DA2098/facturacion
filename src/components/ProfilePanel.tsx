// ═══════════════════════════════════════════════════════════════
// ProfilePanel — edición de perfil por usuario autenticado
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Camera, Mail, Building2, BadgeAlert, LockKeyhole, UserRound, Phone, MapPinned, Barcode, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { updateUsuario, updateUsuarioWithError } from '../services/db.ts';
import type { Usuario } from '../types/index.ts';

type ProfilePanelProps = {
  title?: string;
  subtitle?: string;
};

export default function ProfilePanel({
  title = 'Tu perfil',
  subtitle = 'Edita tu información personal desde aquí.',
}: ProfilePanelProps) {
  const { user, updateSessionUser } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileEmpresa, setProfileEmpresa] = useState('');
  const [profileRuc, setProfileRuc] = useState('');
  const [profileTelefono, setProfileTelefono] = useState('');
  const [profileDireccion, setProfileDireccion] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileName(user.nombre);
    setProfileImage(user.profile_image_url || '');
    setProfileEmpresa(user.empresa || '');
    setProfileRuc(user.ruc || '');
    setProfileTelefono(user.telefono || '');
    setProfileDireccion(user.direccion || '');
    setProfilePassword('');
    setProfileMsg('');
  }, [user]);

  if (!user) return null;

  async function handleProfileImage(file: File | null) {
    if (!file) return;
    
    // Crear una imagen redimensionada
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Redimensionar si es muy grande (máx 500x500)
      if (width > 500 || height > 500) {
        const ratio = Math.min(500 / width, 500 / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convertir a JPEG con compresión y reducir calidad si es necesario
      const compress = (quality: number) => canvas.toDataURL('image/jpeg', quality);
      let dataUrl = compress(0.8);
      const maxBytes = 400 * 1024; // 400 KB
      let q = 0.8;
      while (dataUrl.length > maxBytes && q > 0.2) {
        q -= 0.15;
        dataUrl = compress(q);
      }
      setProfileImage(dataUrl);
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!profileName.trim()) {
      setProfileMsg('El nombre no puede estar vacío');
      return;
    }

    setSavingProfile(true);
    setProfileMsg('');

    const payload: Partial<Usuario> = {
      nombre: profileName.trim(),
      profile_image_url: profileImage,
      empresa: profileEmpresa,
      ruc: profileRuc,
      telefono: profileTelefono,
      direccion: profileDireccion,
    };

    if (profilePassword.trim()) payload.password = profilePassword.trim();

    const resp = await updateUsuarioWithError(user.id, payload);
    if (resp.error) {
      setProfileMsg(resp.error);
      setSavingProfile(false);
      return;
    }

    const updated = resp.usuario!;
    updateSessionUser({ ...user, ...updated });
    setProfilePassword('');
    setProfileMsg('Perfil actualizado correctamente');
    setSavingProfile(false);
  }

  return (
    <div className="profile-panel">
      <div className="dash-box profile-box">
        <div className="profile-head">
          <div
            className={`profile-avatar ${profileImage ? 'profile-avatar-img' : ''}`}
            style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
          >{profileImage ? '' : user.nombre.charAt(0)}</div>
          <div>
            <h2 className="box-title">{title}</h2>
            <p className="page-sub">{subtitle}</p>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item"><Mail size={14} /><span>{user.email}</span></div>
          <div className="profile-info-item"><BadgeAlert size={14} /><span>Rol: {user.rol}</span></div>
          <div className="profile-info-item"><Building2 size={14} /><span>{user.empresa || 'Sin empresa'}</span></div>
          <div className="profile-info-item"><Barcode size={14} /><span>{user.ruc || 'Sin RUC'}</span></div>
          <div className="profile-info-item"><Phone size={14} /><span>{user.telefono || 'Sin teléfono'}</span></div>
          <div className="profile-info-item"><MapPinned size={14} /><span>{user.direccion || 'Sin dirección'}</span></div>
        </div>

        <div className="profile-form-grid">
          <div className="form-col form-col-full">
            <label className="form-label">Nombre</label>
            <input value={profileName} onChange={e => setProfileName(e.target.value)} className="form-input" />
          </div>

          <div className="form-col form-col-full">
            <label className="form-label">Imagen de perfil</label>
            <div className="image-upload-wrapper">
              <input type="file" accept="image/*" onChange={e => void handleProfileImage(e.target.files?.[0] || null)} className="form-input" />
              {profileImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage('')}
                  className="btn btn-danger btn-sm"
                  title="Eliminar imagen de perfil"
                >
                  <Trash2 size={14} /> Borrar imagen
                </button>
              )}
            </div>
            <p className="form-help">Usa una imagen ligera para que cargue rápido.</p>
          </div>

          <div className="form-col">
            <label className="form-label">Empresa</label>
            <input value={profileEmpresa} onChange={e => setProfileEmpresa(e.target.value)} className="form-input" />
          </div>
          <div className="form-col">
            <label className="form-label">RUC</label>
            <input value={profileRuc} onChange={e => setProfileRuc(e.target.value)} className="form-input" />
          </div>
          <div className="form-col">
            <label className="form-label">Teléfono</label>
            <input value={profileTelefono} onChange={e => setProfileTelefono(e.target.value)} className="form-input" />
          </div>
          <div className="form-col">
            <label className="form-label">Dirección</label>
            <input value={profileDireccion} onChange={e => setProfileDireccion(e.target.value)} className="form-input" />
          </div>

          <div className="form-col form-col-full">
            <label className="form-label">Nueva contraseña</label>
            <input
              type="password"
              value={profilePassword}
              onChange={e => setProfilePassword(e.target.value)}
              className="form-input"
              placeholder="Dejar en blanco si no deseas cambiarla"
            />
          </div>
        </div>

        <div className="form-actions profile-actions">
          <p className="profile-msg"><LockKeyhole size={14} /> {profileMsg || ' '}</p>
          <button onClick={() => void saveProfile()} disabled={savingProfile} className="btn btn-primary">
            <Camera size={16} /> {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}