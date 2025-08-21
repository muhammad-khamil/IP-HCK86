import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'

export default function SPPDList() {
    const navigate = useNavigate()
    const [sppds, setSppds] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, pending, approved, rejected

    const fetchSPPDs = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("access_token")
            if (!token) {
                navigate('/login')
                return
            }

            http.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const { data } = await http.get('/sppd')
            const sppdData = Array.isArray(data) ? data : data.sppds || data.data || []
            setSppds(sppdData)
        } catch (error) {
            console.error("Error fetching SPPDs:", error)
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token")
                Swal.fire("Error", "Session expired. Please login again.", "error")
                navigate('/login')
            } else {
                Swal.fire("Error", error.response?.data?.message || "Gagal memuat data SPPD", "error")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Hapus SPPD',
            text: 'Apakah Anda yakin ingin menghapus SPPD ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await http.delete(`/sppd/${id}`)
                    Swal.fire("Success", "SPPD berhasil dihapus!", "success")
                    fetchSPPDs() // Refresh data
                } catch (error) {
                    Swal.fire("Error", error.response?.data?.message || "Gagal menghapus SPPD", "error")
                }
            }
        })
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        }
        return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const formatCurrency = (amount) => {
        if (!amount) return 'Rp 0'
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getTransportIcon = (transport) => {
        const icons = {
            pesawat: '✈️',
            'kereta api': '🚄',
            bus: '🚌',
            'mobil pribadi': '🚗',
            'mobil dinas': '🚙',
            motor: '🏍️'
        }

        // Bikin transport jadi lowercase dan hapus spasi depan-belakang
        const normalized = transport?.toLowerCase().trim()

        return icons[normalized] || '🚗'
    }

    const calculateDuration = (start, end) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffTime = Math.abs(endDate - startDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const calculateTotalCost = (sppd) => {
        const ticketPrice = parseInt(sppd.hargaTiket) || 0
        const hotelPrice = parseInt(sppd.hargaHotel) || 0
        const duration = calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang)
        return ticketPrice + (hotelPrice * duration)
    }

    const filteredSppds = sppds.filter(sppd => {
        if (filter === 'all') return true
        return sppd.status === filter
    })

    useEffect(() => {
        if (!localStorage.getItem("access_token")) {
            return navigate("/login")
        }
        fetchSPPDs()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Daftar SPPD</h1>
                        <p className="text-gray-600">Kelola semua Surat Perintah Perjalanan Dinas</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/dashboard"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span>←</span> Kembali
                        </Link>
                        <Link
                            to="/sppd/create"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span>+</span> Buat SPPD Baru
                        </Link>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-2xl font-bold text-blue-600">{sppds.length}</div>
                        <div className="text-sm text-gray-600">Total SPPD</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-2xl font-bold text-yellow-600">{sppds.filter(s => s.status === 'pending').length}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-2xl font-bold text-green-600">{sppds.filter(s => s.status === 'approved').length}</div>
                        <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="text-2xl font-bold text-red-600">{sppds.filter(s => s.status === 'rejected').length}</div>
                        <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📋 Semua ({sppds.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🕐 Pending ({sppds.filter(s => s.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'approved'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ✅ Approved ({sppds.filter(s => s.status === 'approved').length})
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ❌ Rejected ({sppds.filter(s => s.status === 'rejected').length})
                        </button>
                    </div>
                </div>

                {/* SPPD Cards */}
                {filteredSppds.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada SPPD</h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all' ? 'Belum ada SPPD yang dibuat.' : `Tidak ada SPPD dengan status ${filter}.`}
                        </p>
                        <Link
                            to="/sppd/create"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Buat SPPD Pertama
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredSppds.map((sppd) => (
                            <div key={sppd.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Header Card */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(sppd.status)} text-gray-800 bg-white`}>
                                            {sppd.status.toUpperCase()}
                                        </span>
                                        <div className="text-xs opacity-75">
                                            #{sppd.id}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">
                                        📍 {sppd.daerah_tujuan}
                                    </h3>
                                    <p className="text-sm opacity-90">{sppd.instansi_dituju}</p>
                                </div>

                                <div className="p-6">
                                    {/* Main Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-600 text-sm mb-3">
                                            <strong>Maksud:</strong> {sppd.maksud_perjalanan}
                                        </p>

                                        {/* Date Info */}
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">📅 Berangkat:</span>
                                                <span className="font-medium">{new Date(sppd.tanggalBerangkat).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mt-1">
                                                <span className="text-gray-600">🏁 Pulang:</span>
                                                <span className="font-medium">{new Date(sppd.tanggalPulang).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mt-1">
                                                <span className="text-gray-600">⏱️ Durasi:</span>
                                                <span className="font-medium text-blue-600">{calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang)} hari</span>
                                            </div>
                                        </div>

                                        {/* Transport & Hotel Info */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <div className="text-xs text-gray-600 mb-1">Transportasi</div>
                                                <div className="text-sm font-medium">
                                                    {getTransportIcon(sppd.jenisTransportasi)} {sppd.jenisTransportasi}
                                                </div>
                                                <div className="text-xs text-blue-600">{formatCurrency(sppd.hargaTiket)}</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="text-xs text-gray-600 mb-1">Hotel</div>
                                                <div className="text-sm font-medium">🏨 {sppd.namaHotel}</div>
                                                <div className="text-xs text-green-600">{formatCurrency(sppd.hargaHotel)}/malam</div>
                                            </div>
                                        </div>

                                        {/* Total Cost */}
                                        <div className="bg-purple-50 rounded-lg p-3 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-purple-800">💰 Estimasi Total Biaya:</span>
                                                <span className="text-lg font-bold text-purple-600">{formatCurrency(calculateTotalCost(sppd))}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    {sppd.User && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600">
                                                <strong>👤 Pemohon:</strong> {sppd.User.name}
                                            </p>
                                            <p className="text-sm text-gray-500">📧 {sppd.User.email}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/sppd/${sppd.id}`}
                                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors"
                                        >
                                            👁️ Detail
                                        </Link>
                                        {/* ALLOW EDIT UNTUK PENDING DAN REJECTED */}
                                        {(sppd.status === 'pending' || sppd.status === 'rejected') && (
                                            <Link
                                                to={`/sppd/${sppd.id}/edit`}
                                                className={`flex-1 py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors ${sppd.status === 'rejected'
                                                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                                                        : 'bg-green-50 hover:bg-green-100 text-green-600'
                                                    }`}
                                            >
                                                {sppd.status === 'rejected' ? '🔄 Revisi' : '✏️ Edit'}
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleDelete(sppd.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}