import { useState } from 'react';
import {
  User as UserIcon, Lock, Save, Shield, Key, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { User } from '../../types';
import { api } from '../../services/api';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export default function ProfileSettings({ user, onUpdateUser }: ProfileSettingsProps) {
  const [isEditingInfo, setIsEditingInfo]         = useState(false);
  const [username, setUsername]                   = useState(user.username);
  const [firstName, setFirstName]                 = useState(user.first_name || '');
  const [lastName, setLastName]                   = useState(user.last_name  || '');
  const [currentPassword, setCurrentPassword]     = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showCurrent, setShowCurrent]             = useState(false);
  const [showNew, setShowNew]                     = useState(false);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [isSavingInfo, setIsSavingInfo]           = useState(false);
  const [isSavingPassword, setIsSavingPassword]   = useState(false);
  const [saveSuccess, setSaveSuccess]             = useState<string | null>(null);
  const [error, setError]                         = useState<string | null>(null);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSaveSuccess(null); }
    else { setSaveSuccess(msg); setError(null); setTimeout(() => setSaveSuccess(null), 3000); }
  };

  const handleUpdateInfo = async () => {
    setIsSavingInfo(true);
    setError(null);
    try {
      const res = await api.updateProfile({
        id: user.id,
        username,
        first_name: firstName,
        last_name:  lastName,
      });
      if (res.success) {
        onUpdateUser({ ...user, ...res.user });
        setIsEditingInfo(false);
        notify('¡Información actualizada correctamente!');
      } else {
        notify(res.message || 'Error al actualizar', true);
      }
    } catch (err: any) {
      notify(err.message || 'Error al actualizar', true);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      notify('Todos los campos de contraseña son obligatorios', true); return;
    }
    if (newPassword !== confirmPassword) {
      notify('Las nuevas contraseñas no coinciden', true); return;
    }
    setIsSavingPassword(true);
    setError(null);
    try {
      const res = await api.updateProfile({
        id: user.id,
        username,
        first_name:      firstName,
        last_name:       lastName,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        onUpdateUser({ ...user, ...res.user });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        notify('¡Contraseña actualizada correctamente!');
      } else {
        notify(res.message || 'Error al actualizar contraseña', true);
      }
    } catch (err: any) {
      notify(err.message || 'Error al actualizar contraseña', true);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle}
      className="p-1 hover:bg-zinc-200 rounded-md transition-colors text-zinc-400 hover:text-zinc-600">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Mi Perfil" subtitle="Gestiona tu información personal y seguridad" />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Información Personal ── */}
        <Card className="rounded-3xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <UserIcon size={22} className="text-amber-500" />
                Información Personal
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
                <Shield size={13} className="text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nombre" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  readOnly={!isEditingInfo}
                  variant={!isEditingInfo ? 'view' : 'default'} />
                <Input label="Apellido" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  readOnly={!isEditingInfo}
                  variant={!isEditingInfo ? 'view' : 'default'} />
                <div className="md:col-span-2">
                  <Input label="Nombre de Usuario" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuario_admin" icon={UserIcon}
                    readOnly={!isEditingInfo}
                    variant={!isEditingInfo ? 'view' : 'default'} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                {isEditingInfo ? (
                  <>
                    <Button variant="ghost" onClick={() => {
                      setIsEditingInfo(false);
                      setUsername(user.username);
                      setFirstName(user.first_name || '');
                      setLastName(user.last_name   || '');
                    }}>Cancelar</Button>
                    <Button onClick={handleUpdateInfo} loading={isSavingInfo}
                      icon={Save} className="px-8">
                      Guardar cambios
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setIsEditingInfo(true)}
                    className="px-8">
                    Editar info
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Seguridad ── */}
        <Card className="rounded-3xl">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2 mb-8">
              <Key size={22} className="text-amber-500" />
              Seguridad de la Cuenta
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Contraseña Actual"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••" icon={Lock}
                  rightElement={<PasswordToggle show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />} />
                <div className="hidden md:block" />
                <Input label="Nueva Contraseña"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" icon={Lock}
                  rightElement={<PasswordToggle show={showNew} onToggle={() => setShowNew(v => !v)} />} />
                <Input label="Confirmar Nueva Contraseña"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" icon={Lock}
                  rightElement={<PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                <Button variant="ghost" onClick={() => {
                  setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                }}>Limpiar</Button>
                <Button onClick={handleUpdatePassword} loading={isSavingPassword}
                  icon={Save} className="px-8">
                  Actualizar contraseña
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Feedback ── */}
        {(error || saveSuccess) && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${
            error
              ? 'bg-red-50 border-red-100 text-red-600'
              : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {error ? <Lock size={16} /> : <CheckCircle2 size={16} />}
            <span>{error || saveSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
}