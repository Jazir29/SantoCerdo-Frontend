import { useState, useEffect } from 'react';
import {
    User as UserIcon, Lock, Save, Shield, UserPlus,
    Users as UsersIcon, Edit2, Trash2, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { User } from '../../types';
import { api } from '../../services/api';

interface UserManagementProps {
    currentUser: User;
}

const ROLES = ['Administrador', 'Vendedor', 'Producción'];

export default function UserManagement({ currentUser }: UserManagementProps) {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Administrador');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.getUsers();
            setAllUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFirstName(''); setLastName(''); setUsername('');
        setPassword(''); setConfirmPassword('');
        setRole('Administrador');
        setFormError(null);
        setShowPass(false); setShowConfirm(false);
    };

    const openCreate = () => {
        resetForm();
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setUsername(u.username);
        setPassword('');
        setConfirmPassword('');
        setRole(u.role);
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!firstName || !lastName || !username || !role) {
            setFormError('Nombre, apellido, usuario y rol son obligatorios'); return;
        }
        if (!editingUser && !password) {
            setFormError('La contraseña es obligatoria para nuevos usuarios'); return;
        }
        if (password && password !== confirmPassword) {
            setFormError('Las contraseñas no coinciden'); return;
        }

        setIsSaving(true);
        setFormError(null);
        try {
            if (editingUser) {
                await api.updateUser(editingUser.id, {
                    username, first_name: firstName, last_name: lastName,
                    role, ...(password ? { password } : {}),
                });
            } else {
                await api.createUser({
                    username, password,
                    first_name: firstName, last_name: lastName, role,
                });
            }
            setFormSuccess(true);
            setIsFormOpen(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
            setTimeout(() => setFormSuccess(false), 3000);
        } catch (err: any) {
            setFormError(err.message || 'Error al guardar usuario');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (u: User) => {
        if (u.id === currentUser.id) return;
        if (!confirm(`¿Eliminar al usuario "${u.username}"?`)) return;
        try {
            await api.deleteUser(u.id);
            fetchUsers();
        } catch (err) {
            console.error(err);
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
            <PageHeader title="Gestión de Usuarios"
                subtitle="Administra los accesos y roles del personal del sistema" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* ── Tabla de usuarios ── */}
                <div className="xl:col-span-2">
                    <Card className="rounded-3xl">
                        <CardContent className="p-0">
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <UsersIcon size={18} className="text-zinc-400" />
                                    Usuarios Registrados
                                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs font-bold rounded-full">
                                        {allUsers.length}
                                    </span>
                                </h3>
                                <Button size="sm" onClick={openCreate} icon={UserPlus}>
                                    Nuevo Usuario
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-zinc-50/50">
                                            <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Usuario</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Nombre</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Rol</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {isLoading ? (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm">Cargando usuarios...</td></tr>
                                        ) : allUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-600 font-bold text-xs border border-zinc-200">
                                                            {u.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-zinc-900 text-sm">{u.username}</span>
                                                        {u.id === currentUser.id && (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Tú</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600">
                                                    {u.first_name ? `${u.first_name} ${u.last_name}` : u.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'Administrador' ? 'bg-amber-100 text-amber-700' :
                                                            u.role === 'Vendedor' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-zinc-100 text-zinc-700'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="sm"
                                                            icon={Edit2}
                                                            onClick={() => openEdit(u)}
                                                            className="h-8 w-8 !px-0 !py-0"
                                                        />
                                                        <Button variant="ghost" size="sm"
                                                            icon={Trash2}
                                                            onClick={() => handleDelete(u)}
                                                            disabled={u.id === currentUser.id}
                                                            className="h-8 w-8 !px-0 !py-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {formSuccess && (
                                <div className="mx-6 mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                    <CheckCircle2 size={16} />
                                    {editingUser ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Panel lateral ── */}
                <div>
                    {isFormOpen ? (
                        <Card className="rounded-3xl border-2 border-dashed border-zinc-200 sticky top-6">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                        <UserPlus size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900">
                                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                        </h3>
                                        <p className="text-xs text-zinc-400">
                                            {editingUser ? 'Modifica los datos del usuario' : 'Registra un nuevo acceso al sistema'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Input label="Nombre" value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" size="sm" />
                                    <Input label="Apellido" value={lastName}
                                        onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" size="sm" />
                                    <Input label="Usuario" value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="ej. jgarcia" icon={UserIcon} size="sm" />

                                    <div className="h-px bg-zinc-100" />

                                    <Input
                                        label={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••" icon={Lock} size="sm"
                                        rightElement={<PasswordToggle show={showPass} onToggle={() => setShowPass(v => !v)} />} />
                                    {(!editingUser || password) && (
                                        <Input
                                            label="Confirmar contraseña"
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••" icon={Lock} size="sm"
                                            rightElement={<PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Rol</label>
                                        <select value={role} onChange={(e) => setRole(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all">
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    {formError && (
                                        <p className="text-xs text-red-500 font-medium px-1">{formError}</p>
                                    )}

                                    <div className="pt-2 space-y-2">
                                        <Button onClick={handleSubmit} loading={isSaving}
                                            icon={Save} className="w-full">
                                            {editingUser ? 'Guardar cambios' : 'Registrar usuario'}
                                        </Button>
                                        <Button variant="ghost" onClick={() => {
                                            setIsFormOpen(false);
                                            setEditingUser(null);
                                            resetForm();
                                        }} className="w-full">
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 mx-auto shadow-sm">
                                <Shield size={30} />
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-900">Panel de Control</h4>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Selecciona un usuario para editar o crea uno nuevo.
                                </p>
                            </div>
                            <Button onClick={openCreate} icon={UserPlus} className="w-full">
                                Nuevo Usuario
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}