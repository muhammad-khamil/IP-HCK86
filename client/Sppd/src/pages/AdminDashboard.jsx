import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [sppds, setSppds] = useState([])
    const [stats, setStats] = useState({
        totalSPPD: 0,
        pendingSPPD: 0,
        approvedSPPD: 0,
        rejectedSPPD: 0,
        totalStaff: 0
    })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending') // Default show pending for admin

    // Update bagian calculate stats di fetchAdminData function:
    const fetchAdminData = async () => {
        try {
            setLoading(true)

            const token = localStorage.getItem("access_token")
            if (!token) {
                navigate('/login')
                return
            }

            // Set authorization header
            http.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // Check user role first (security validation)
            try {
                const { data: userData } = await http.get('/profile')
                if (userData.role !== 'admin') {
                    Swal.fire("Error", "Access denied. Admin only.", "error")
                    navigate('/dashboard')
                    return
                }
            } catch (roleError) {
                console.error("Role check error:", roleError)
            }

            // Get all SPPD (admin can see all)
            const { data } = await http.get('/sppd')
            const sppdData = Array.isArray(data) ? data : data.sppds || data.data || []
            setSppds(sppdData)

            // Get dashboard stats dari backend
            try {
                const { data: statsData } = await http.get('/dashboard/stats')
                // USE BACKEND STATS DIRECTLY - jangan override!
                setStats(statsData)
            } catch (statsError) {
                console.error("Stats fetch error:", statsError)

                // Calculate stats from SPPD data jika stats endpoint gagal
                const calculatedStats = {
                    totalSPPD: sppdData.length,
                    pendingSPPD: sppdData.filter(sppd => sppd.status === 'pending').length,
                    approvedSPPD: sppdData.filter(sppd => sppd.status === 'approved').length,
                    rejectedSPPD: sppdData.filter(sppd => sppd.status === 'rejected').length,
                    // FIX: Pakai User.id bukan userId
                    totalStaff: new Set(sppdData.map(sppd => sppd.User?.id || sppd.userId).filter(id => id)).size
                }
                setStats(calculatedStats)
            }

        } catch (error) {
            console.error("Error fetching admin data:", error)

            // Handle different error types
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token")
                Swal.fire("Error", "Session expired. Please login again.", "error")
                navigate('/login')
            } else if (error.response?.status === 403) {
                Swal.fire("Error", "Access denied. Admin only.", "error")
                navigate('/dashboard')
            } else {
                Swal.fire("Error", "Failed to load admin data. Please try again.", "error")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (sppdId, newStatus) => {
        const statusText = newStatus === 'approved' ? 'menyetujui' : 'menolak'

        Swal.fire({
            title: `${newStatus === 'approved' ? 'Approve' : 'Reject'} SPPD`,
            text: `Apakah Anda yakin ingin ${statusText} SPPD ini?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus === 'approved' ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Ya, ${newStatus === 'approved' ? 'Approve' : 'Reject'}`,
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await http.patch(`/sppd/${sppdId}/status`, { status: newStatus })
                    Swal.fire("Success", `SPPD berhasil di-${newStatus}!`, "success")
                    fetchAdminData() // Refresh data
                } catch (error) {
                    Swal.fire("Error", error.response?.data?.message || `Gagal ${statusText} SPPD`, "error")
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

    const filteredSppds = sppds.filter(sppd => {
        if (filter === 'all') return true
        return sppd.status === filter
    })

    const handleLogout = () => {
        Swal.fire({
            title: 'Logout',
            text: 'Apakah Anda yakin ingin logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("access_token")
                Swal.fire("Success", "Logout berhasil!", "success")
                navigate('/login')
            }
        })
    }

    useEffect(() => {
        if (!localStorage.getItem("access_token")) {
            return navigate("/login")
        }
        fetchAdminData()
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
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
                        <p className="text-gray-600">Kelola semua SPPD dari staff</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/dashboard"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Dashboard Staff
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total SPPD</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.totalSPPD}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pendingSPPD}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approvedSPPD}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejectedSPPD}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Staff</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.totalStaff}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                    <div className="flex flex-wrap gap-2">
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
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📋 Semua ({sppds.length})
                        </button>
                    </div>
                </div>

                {/* SPPD Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Daftar SPPD - {filter === 'all' ? 'Semua' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </h2>
                    </div>

                    {filteredSppds.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada SPPD</h3>
                            <p className="text-gray-500">
                                Tidak ada SPPD dengan status {filter}.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSppds.map((sppd) => (
                                        <tr key={sppd.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{sppd.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{sppd.User?.name}</div>
                                                <div className="text-sm text-gray-500">{sppd.User?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{sppd.daerah_tujuan}</div>
                                                <div className="text-sm text-gray-500">{sppd.instansi_dituju}</div>
                                                <div className="text-xs text-gray-400">{sppd.maksud_perjalanan}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{new Date(sppd.tanggalBerangkat).toLocaleDateString('id-ID')}</div>
                                                <div className="text-gray-500">s/d {new Date(sppd.tanggalPulang).toLocaleDateString('id-ID')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(sppd.status)}`}>
                                                    {sppd.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    {sppd.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(sppd.id, 'approved')}
                                                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                                            >
                                                                ✓ Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(sppd.id, 'rejected')}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                                            >
                                                                ✗ Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <Link
                                                        to={`/sppd/${sppd.id}`}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                                    >
                                                        Detail
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}