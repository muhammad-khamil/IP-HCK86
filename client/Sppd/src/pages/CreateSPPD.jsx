import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import SPPDForm from '../components/SPPDForm'

export default function CreateSPPD() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      return navigate("/login")
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Buat SPPD Baru</h1>
          <p className="text-gray-600">Isi form di bawah untuk membuat Surat Perintah Perjalanan Dinas</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <SPPDForm mode="create" />
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-800 font-medium">Informasi</p>
              <ul className="text-blue-600 text-sm mt-1 space-y-1">
                <li>• SPPD yang dibuat akan berstatus "Pending" dan menunggu approval</li>
                <li>• Pastikan semua data sudah benar sebelum submit</li>
                <li>• Dokumen pendukung akan membantu proses approval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}