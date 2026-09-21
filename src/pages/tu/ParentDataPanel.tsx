import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Link2, X, Search, UserPlus, CheckCircle, GraduationCap, Phone, Mail, MapPin } from 'lucide-react';
import { getClasses } from '../../domains/academic/services';
import { getStudentsByClassIdResult } from '../../domains/student/services';
import { AcademicClass } from '../../domains/academic/types';

interface LinkedStudentInfo {
  relationId: string;
  studentId: string;
  studentName: string;
  className: string;
  relationRole: string;
}

interface ParentItem {
  id: string;
  userId?: string;
  fullName: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  waNumber?: string;
  address?: string;
}

export default function ParentDataPanel() {
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [relationsMap, setRelationsMap] = useState<Record<string, LinkedStudentInfo[]>>({});
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParentQuery, setSearchParentQuery] = useState('');

  // Link Student Modal State
  const [linkingParent, setLinkingParent] = useState<ParentItem | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [relationRole, setRelationRole] = useState<'Ayah' | 'Ibu' | 'Wali'>('Ayah');
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Parent Modal State
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [newParentForm, setNewParentForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [savingParent, setSavingParent] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch parents from both 'parents' collection and 'users' where role == 'parent'
      const parentsList: ParentItem[] = [];
      const parentIdsSeen = new Set<string>();

      try {
        const pSnap = await getDocs(collection(db, 'parents'));
        pSnap.forEach(d => {
          const data = d.data();
          parentIdsSeen.add(d.id);
          parentsList.push({
            id: d.id,
            userId: data.userId || d.id,
            fullName: data.fullName || data.name || 'Orang Tua',
            email: data.email || '-',
            phoneNumber: data.phoneNumber || data.waNumber || '-',
            address: data.address || '-'
          });
        });
      } catch (err) {
        console.warn('Error fetching parents collection:', err);
      }

      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'parent')));
        uSnap.forEach(d => {
          if (!parentIdsSeen.has(d.id)) {
            const data = d.data();
            parentIdsSeen.add(d.id);
            parentsList.push({
              id: d.id,
              userId: data.uid || d.id,
              fullName: data.fullName || data.name || 'Orang Tua',
              email: data.email || '-',
              phoneNumber: data.phoneNumber || data.waNumber || '-',
              address: data.address || '-'
            });
          }
        });
      } catch (err) {
        console.warn('Error fetching users collection for parents:', err);
      }

      setParents(parentsList);

      // 2. Fetch classes
      try {
        const classRes = await getClasses();
        if (classRes.isSuccess && classRes.getValue().length > 0) {
          setClasses(classRes.getValue());
        } else {
          setClasses([]);
        }
      } catch {
        setClasses([]);
      }

      // 3. Fetch all students for reference
      const studentMap: Record<string, any> = {};
      try {
        const sSnap = await getDocs(collection(db, 'students'));
        sSnap.forEach(d => {
          studentMap[d.id] = { id: d.id, ...d.data() };
        });
        const suSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        suSnap.forEach(d => {
          if (!studentMap[d.id]) {
            studentMap[d.id] = { id: d.id, ...d.data() };
          }
        });
      } catch (err) {
        console.warn('Error fetching students:', err);
      }
      setAllStudents(Object.values(studentMap));

      // 4. Fetch relations
      const rels: Record<string, LinkedStudentInfo[]> = {};
      try {
        const rSnap = await getDocs(collection(db, 'parent_student_relations'));
        rSnap.forEach(d => {
          const data = d.data();
          const pId = data.parentId;
          const sId = data.studentId;
          const student = studentMap[sId];
          const item: LinkedStudentInfo = {
            relationId: d.id,
            studentId: sId,
            studentName: student?.name || student?.fullName || 'Siswa',
            className: student?.className || '-',
            relationRole: data.relationRole || 'Orang Tua'
          };
          if (!rels[pId]) rels[pId] = [];
          rels[pId].push(item);
        });
      } catch (err) {
        console.warn('Error fetching relations:', err);
      }

      setRelationsMap(rels);
    } catch (err) {
      console.error('Fatal error loading parent panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch students when a class is selected in the link modal
  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      return;
    }
    const fetchStudentsForClass = async () => {
      setLoadingClassStudents(true);
      try {
        const res = await getStudentsByClassIdResult(selectedClassId);
        if (res.isSuccess && res.getValue().length > 0) {
          setClassStudents(res.getValue());
        } else {
          const matched = allStudents.filter(
            s => s.classId === selectedClassId || s.className === selectedClassId
          );
          setClassStudents(matched);
        }
      } catch {
        setClassStudents([]);
      } finally {
        setLoadingClassStudents(false);
      }
    };
    fetchStudentsForClass();
  }, [selectedClassId, allStudents]);

  // Open Link Modal
  const openLinkModal = (parent: ParentItem) => {
    setLinkingParent(parent);
    setLinkMessage(null);
    setSelectedClassId(classes[0]?.id || 'cls_11_ipa');
    setStudentSearchQuery('');
    setSelectedStudentId('');
    setRelationRole('Ayah');
  };

  // Submit Link Student
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingParent || !selectedStudentId) return;

    setLinkMessage(null);
    try {
      const relationId = `rel_${Date.now()}`;
      const relData = {
        id: relationId,
        parentId: linkingParent.id,
        studentId: selectedStudentId,
        relationRole,
        isPrimary: true,
        accessPermissions: ['view_only', 'attendance_read', 'grade_read', 'finance_read', 'notification_read'],
        createdAt: Date.now()
      };

      // Save to Firestore
      await setDoc(doc(db, 'parent_student_relations', relationId), relData, { merge: true });

      // Update local state immediately
      const chosenStudent = classStudents.find(s => s.id === selectedStudentId) || allStudents.find(s => s.id === selectedStudentId);
      const newRelationItem: LinkedStudentInfo = {
        relationId,
        studentId: selectedStudentId,
        studentName: chosenStudent?.name || chosenStudent?.fullName || 'Siswa',
        className: chosenStudent?.className || 'XI-IPA',
        relationRole
      };

      setRelationsMap(prev => ({
        ...prev,
        [linkingParent.id]: [...(prev[linkingParent.id] || []), newRelationItem]
      }));

      setLinkMessage({ type: 'success', text: 'Berhasil menghubungkan orang tua dengan data siswa!' });
      setTimeout(() => {
        setLinkingParent(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setLinkMessage({ type: 'error', text: err.message || 'Gagal menyimpan relasi.' });
    }
  };

  // Add Parent Submit
  const handleAddParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentForm.fullName || !newParentForm.email) return;

    setSavingParent(true);
    try {
      const parentId = `parent_${Date.now()}`;
      const parentRecord: ParentItem = {
        id: parentId,
        userId: parentId,
        fullName: newParentForm.fullName,
        email: newParentForm.email,
        phoneNumber: newParentForm.phoneNumber || '-',
        waNumber: newParentForm.phoneNumber || '-',
        address: newParentForm.address || '-'
      };

      // Save to parents collection
      await setDoc(doc(db, 'parents', parentId), {
        id: parentId,
        userId: parentId,
        fullName: newParentForm.fullName,
        email: newParentForm.email,
        phoneNumber: newParentForm.phoneNumber,
        address: newParentForm.address,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Save to users collection
      await setDoc(doc(db, 'users', parentId), {
        id: parentId,
        uid: parentId,
        name: newParentForm.fullName,
        fullName: newParentForm.fullName,
        email: newParentForm.email,
        phoneNumber: newParentForm.phoneNumber,
        waNumber: newParentForm.phoneNumber,
        role: 'parent',
        roles: ['parent'],
        isActive: true,
        createdAt: Date.now()
      });

      setParents(prev => [parentRecord, ...prev]);
      setShowAddParentModal(false);
      setNewParentForm({ fullName: '', email: '', phoneNumber: '', address: '' });
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data orang tua.');
    } finally {
      setSavingParent(false);
    }
  };

  const filteredParents = parents.filter(p =>
    (p.fullName || p.name || '').toLowerCase().includes(searchParentQuery.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchParentQuery.toLowerCase()) ||
    (p.phoneNumber || p.waNumber || '').includes(searchParentQuery)
  );

  const filteredClassStudents = classStudents.filter(s =>
    (s.name || s.fullName || '').toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 rounded-full border-t-transparent mx-auto mb-3"></div>
        <p className="text-gray-500 font-medium">Memuat data orang tua...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-600" />
              Data Orang Tua & Wali Murid
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola akun orang tua murid dan tautan relasi dengan data siswa aktif.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddParentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Akun Orang Tua
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama orang tua, email, atau no. WhatsApp..."
            value={searchParentQuery}
            onChange={e => setSearchParentQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>

        {/* Parents Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-4">Nama Orang Tua</th>
                <th className="py-3.5 px-4">Kontak (Email / WA)</th>
                <th className="py-3.5 px-4">Siswa / Anak Terhubung</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredParents.map(parent => {
                const linkedStudents = relationsMap[parent.id] || [];
                return (
                  <tr key={parent.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                          {(parent.fullName || parent.name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {parent.fullName || parent.name}
                          </div>
                          {parent.address && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{parent.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{parent.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{parent.phoneNumber || parent.waNumber || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {linkedStudents.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {linkedStudents.map((rel, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-bold">{rel.studentName}</span>
                              <span className="text-blue-500">({rel.className})</span>
                              <span className="text-[10px] bg-blue-200/60 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                {rel.relationRole}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                          Belum terhubung siswa
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openLinkModal(parent)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200/60 active:scale-95"
                      >
                        <Link2 className="w-3.5 h-3.5 text-orange-600" />
                        {linkedStudents.length > 0 ? 'Hubungkan Siswa Lain' : 'Hubungkan Siswa'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredParents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">Belum ada akun orang tua yang terdaftar</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                      Data orang tua akan muncul secara otomatis saat wali murid melakukan login menggunakan Akun Google dan terdaftar di sistem.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: HUBUNGKAN DENGAN SISWA */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setLinkingParent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-orange-600" />
                Hubungkan dengan Siswa
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Menautkan akun orang tua: <strong className="text-gray-800">{linkingParent.fullName || linkingParent.name}</strong>
              </p>
            </div>

            {linkMessage && (
              <div
                className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2 ${
                  linkMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {linkMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {linkMessage.text}
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Kelas Siswa
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  2. Hubungan Keluarga
                </label>
                <select
                  value={relationRole}
                  onChange={e => setRelationRole(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali</option>
                </select>
              </div>

              {selectedClassId && (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    3. Cari & Pilih Siswa
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ketik nama siswa..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      value={studentSearchQuery}
                      onChange={e => setStudentSearchQuery(e.target.value)}
                    />
                  </div>

                  {loadingClassStudents ? (
                    <div className="text-xs text-gray-500 p-3 border border-gray-100 rounded-xl bg-gray-50 text-center">
                      Memuat daftar siswa...
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    >
                      <option value="">-- Pilih Nama Siswa --</option>
                      {filteredClassStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.fullName} ({s.nisn || s.email || 'Siswa'})
                        </option>
                      ))}
                    </select>
                  )}

                  {!loadingClassStudents && filteredClassStudents.length === 0 && (
                    <p className="text-xs text-red-500">
                      Tidak ada siswa yang cocok dengan filter pencarian pada kelas ini.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setLinkingParent(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all active:scale-95"
                >
                  Simpan Relasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN ORANG TUA */}
      {showAddParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setShowAddParentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                Tambah Akun Orang Tua
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Daftarkan akun orang tua/wali baru ke dalam pangkalan data.
              </p>
            </div>

            <form onSubmit={handleAddParentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Orang Tua / Wali *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Bpk. Hendro Widayat"
                  value={newParentForm.fullName}
                  onChange={e => setNewParentForm({ ...newParentForm, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: wali.murid@gmail.com"
                  value={newParentForm.email}
                  onChange={e => setNewParentForm({ ...newParentForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  placeholder="contoh: 081234567890"
                  value={newParentForm.phoneNumber}
                  onChange={e => setNewParentForm({ ...newParentForm, phoneNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Tempat Tinggal
                </label>
                <input
                  type="text"
                  placeholder="contoh: Jl. Raya Wagir No. 45, Malang"
                  value={newParentForm.address}
                  onChange={e => setNewParentForm({ ...newParentForm, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingParent}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  {savingParent ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
