import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import SPPDForm from '../components/SPPDForm'
import http from '../libraries/http'

export default function EditSPPD() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [sppdStatus, setSppdStatus] = useState(null)

    // Fetch SPPD status untuk info
    useEffect(() => {
        const fetchSppdStatus = async () => {
            try {
                const token = localStorage.getItem("access_token")
                if (!token) {
                    navigate('/login')
                    return
                }

                http.defaults.headers.common['Authorization'] = `Bearer ${token}`
                const { data } = await http.get(`/sppd/${id}`)
                setSppdStatus(data.status)
            } catch (error) {
                console.error("Error fetching SPPD status:", error)
            }
        }

        if (!localStorage.getItem("access_token")) {
            return navigate("/login")
        }

        fetchSppdStatus()
    }, [id])

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit SPPD #{id}</h1>
                    <p className="text-gray-600">Perbarui data Surat Perintah Perjalanan Dinas</p>
                </div>

                {/* Status Info */}
                {sppdStatus && (
                    <div className={`mb-6 rounded-lg p-4 ${sppdStatus === 'rejected'
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}>
                        <div className="flex items-start">
                            <div className={`mr-3 ${sppdStatus === 'rejected' ? 'text-orange-600' : 'text-blue-600'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-medium ${sppdStatus === 'rejected' ? 'text-orange-800' : 'text-blue-800'}`}>
                                    {sppdStatus === 'rejected' ? '🔄 SPPD Revisi' : 'ℹ️ Edit SPPD'}
                                </p>
                                <p className={`text-sm mt-1 ${sppdStatus === 'rejected' ? 'text-orange-600' : 'text-blue-600'}`}>
                                    {sppdStatus === 'rejected'
                                        ? 'SPPD ini sebelumnya ditolak. Setelah direvisi, status akan kembali menjadi "Pending" untuk direview ulang.'
                                        : 'Perubahan akan disimpan dan dapat direview oleh admin.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <SPPDForm
                        mode="edit"
                        sppdId={id}
                    />
                </div>

                {/* Warning Card - Update logic */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="text-yellow-600 mr-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-yellow-800 font-medium">Aturan Edit SPPD</p>
                            <ul className="text-yellow-600 text-sm mt-1 space-y-1">
                                <li>• SPPD yang sudah diapprove tidak dapat diedit</li>
                                <li>• SPPD dengan status "Pending" dan "Rejected" dapat diedit</li>
                                <li>• {sppdStatus === 'rejected'
                                    ? 'SPPD yang rejected akan berubah status jadi "Pending" setelah direvisi'
                                    : 'Perubahan akan langsung tersimpan'
                                }</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}