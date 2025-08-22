import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'
import ChatBot from './ChatBot'

export default function Dashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalSPPD: 0,
        pendingSPPD: 0,
        approvedSPPD: 0,
        rejectedSPPD: 0
    })
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    
    // State untuk ChatBot
    const [isChatBotOpen, setIsChatBotOpen] = useState(false)

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("access_token")
            if (!token) {
                navigate('/login')
                return
            }

            // Set authorization header
            http.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // Get user profile first to check role
            try {
                const { data: userData } = await http.get('/profile')
                setUser(userData)
            } catch (error) {
                console.log('Profile error:', error)
            }

            // Try to get dashboard stats (for admin) or SPPD data (for staff)
            try {
                const { data } = await http.get('/dashboard/stats')
                setStats(data)
            } catch (error) {
                // If dashboard/stats fails, try to get SPPD data directly
                const { data } = await http.get('/sppd')
                const sppds = data.sppds || data

                const statsData = {
                    totalSPPD: sppds.length,
                    pendingSPPD: sppds.filter(sppd => sppd.status === 'pending').length,
                    approvedSPPD: sppds.filter(sppd => sppd.status === 'approved').length,
                    rejectedSPPD: sppds.filter(sppd => sppd.status === 'rejected').length
                }
                setStats(statsData)
            }
        } catch (error) {
            console.log(error, "<<<")
            if (error.response?.status === 401) {
                localStorage.removeItem("access_token")
                Swal.fire("Error", "Session expired. Please login again.", "error")
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

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

    // Function untuk buka ChatBot
    const handleOpenChatBot = () => {
        setIsChatBotOpen(true)
        Swal.fire({
            title: 'AI Assistant Activated! 🤖',
            text: 'ChatBot SPPD siap membantu Anda!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        })
    }

    useEffect(() => {
        if (!localStorage.getItem("access_token")) {
            return navigate("/login")
        }
        fetchDashboardData()
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
                        <p className="text-gray-600">
                            Selamat datang, {user?.name} 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                user?.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                                {user?.role === 'admin' ? '👨‍💼 Admin' : '👤 Staff'}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total SPPD</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.totalSPPD}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pendingSPPD}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Approved</p>
                                <p className="text-3xl font-bold text-green-600">{stats.approvedSPPD}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Rejected</p>
                                <p className="text-3xl font-bold text-red-600">{stats.rejectedSPPD}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                        <Link to="/sppd/create" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
                            <div className="text-blue-600 mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <p className="font-medium text-blue-800">Buat SPPD</p>
                        </Link>

                        <Link to="/sppd" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors">
                            <div className="text-green-600 mb-2">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="font-medium text-green-800">Lihat SPPD</p>
                        </Link>

                        {/* TOMBOL CHAT BOT - GANTI DARI LAPORAN */}
                        <button 
                            onClick={handleOpenChatBot}
                            className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors group"
                        >
                            <div className="text-purple-600 mb-2 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="font-medium text-purple-800">
                                🤖 AI Assistant
                                {isChatBotOpen && (
                                    <span className="block text-xs text-purple-600 mt-1">Active</span>
                                )}
                            </p>
                        </button>

                        {/* HANYA SHOW ADMIN PANEL KALAU ROLE ADMIN */}
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg text-center transition-colors">
                                <div className="text-orange-600 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <p className="font-medium text-orange-800">Admin Panel</p>
                            </Link>
                        )}
                    </div>
                </div>

                {/* ChatBot Status Info */}
                {isChatBotOpen && (
                    <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-purple-600 mr-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-purple-800 font-medium">🤖 AI Assistant Active</p>
                                    <p className="text-purple-600 text-sm">ChatBot SPPD siap membantu analisis perjalanan dinas Anda!</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-600 text-sm font-medium">Online</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Notice (kalau user adalah admin) */}
                {user?.role === 'admin' && (
                    <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="text-purple-600 mr-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-800 font-medium">Admin Access</p>
                                <p className="text-purple-600 text-sm">Anda memiliki akses admin untuk approve/reject SPPD staff.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* ChatBot Component - Hanya render kalau diaktifkan */}
            {isChatBotOpen && <ChatBot onClose={() => setIsChatBotOpen(false)} />}
        </div>
    )
}