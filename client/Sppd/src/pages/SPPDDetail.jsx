import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'

export default function SPPDDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sppd, setSppd] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSPPDDetail = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) {
        navigate('/login')
        return
      }

      http.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const { data } = await http.get(`/sppd/${id}`)
      setSppd(data)
    } catch (error) {
      console.error("Error fetching SPPD detail:", error)
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token")
        Swal.fire("Error", "Session expired. Please login again.", "error")
        navigate('/login')
      } else if (error.response?.status === 404) {
        Swal.fire("Error", "SPPD tidak ditemukan", "error")
        navigate('/sppd')
      } else {
        Swal.fire("Error", error.response?.data?.message || "Gagal memuat detail SPPD", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    }
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '🕐',
      approved: '✅',
      rejected: '❌'
    }
    return icons[status] || '📋'
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
      'pesawat': '✈️',
      'kereta api': '🚄',
      'bus': '🚌',
      'mobil pribadi': '🚗',
      'mobil dinas': '🚙',
      'motor': '🏍️'
    }
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

  const calculateTotalCost = () => {
    if (!sppd) return 0
    const ticketPrice = parseInt(sppd.hargaTiket) || 0
    const hotelPrice = parseInt(sppd.hargaHotel) || 0
    const duration = calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang)
    return ticketPrice + (hotelPrice * duration)
  }

  const handleDelete = async () => {
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
          navigate('/sppd')
        } catch (error) {
          Swal.fire("Error", error.response?.data?.message || "Gagal menghapus SPPD", "error")
        }
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      return navigate("/login")
    }
    fetchSPPDDetail()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!sppd) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">SPPD tidak ditemukan</h3>
          <Link to="/sppd" className="text-blue-600 hover:text-blue-500">← Kembali ke daftar SPPD</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📄 Detail SPPD #{sppd.id}</h1>
            <p className="text-gray-600">Informasi lengkap Surat Perintah Perjalanan Dinas</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/sppd"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>←</span> Kembali
            </Link>
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              🖨️ Print
            </button>
            {sppd.status === 'pending' || "rejected" && (
              <Link
                to={`/sppd/${id}/edit`}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                ✏️ Edit
              </Link>
            )}
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              🗑️ Hapus
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusBadge(sppd.status)}`}>
            {getStatusIcon(sppd.status)} Status: {sppd.status.toUpperCase()}
          </span>
        </div>

        {/* Main Content - Table Format */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          
          {/* Section 1: Informasi Umum */}
          <div className="border-b border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">📋 Informasi Umum</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/3">
                      ID SPPD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{sppd.id}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Pemohon
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">👤 {sppd.User?.name}</div>
                        <div className="text-gray-500">📧 {sppd.User?.email}</div>
                        <div className="text-gray-500">🏷️ {sppd.User?.role}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Tanggal Dibuat
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      📅 {new Date(sppd.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Status
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(sppd.status)}`}>
                        {getStatusIcon(sppd.status)} {sppd.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Detail Perjalanan */}
          <div className="border-b border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">🎯 Detail Perjalanan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/3">
                      Daerah Tujuan
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      📍 <span className="font-medium">{sppd.daerah_tujuan}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Instansi Dituju
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      🏢 {sppd.instansi_dituju}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">
                      Maksud Perjalanan
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      📝 {sppd.maksud_perjalanan}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Tanggal Keberangkatan
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      🛫 {new Date(sppd.tanggalBerangkat).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Tanggal Kepulangan
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      🛬 {new Date(sppd.tanggalPulang).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Durasi Perjalanan
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ⏱️ <span className="font-medium text-blue-600">{calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang)} hari</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Transportasi */}
          <div className="border-b border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">🚗 Informasi Transportasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/3">
                      Jenis Transportasi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTransportIcon(sppd.jenisTransportasi)} <span className="font-medium">{sppd.jenisTransportasi}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Harga Tiket
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      💰 <span className="font-bold text-blue-600">{formatCurrency(sppd.hargaTiket)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Bukti Tiket
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sppd.imgTiket ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={sppd.imgTiket} 
                            alt="Bukti Tiket" 
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <a 
                            href={sppd.imgTiket} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            🔍 Lihat Full Image
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada gambar</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Akomodasi */}
          <div className="border-b border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">🏨 Informasi Akomodasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/3">
                      Nama Hotel
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      🏨 <span className="font-medium">{sppd.namaHotel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Harga per Malam
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      💰 <span className="font-bold text-green-600">{formatCurrency(sppd.hargaHotel)}</span> / malam
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Total Biaya Hotel
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      💰 <span className="font-bold text-green-600">
                        {formatCurrency(sppd.hargaHotel * calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang))}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        ({formatCurrency(sppd.hargaHotel)} × {calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang)} hari)
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Bukti Bill Hotel
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sppd.imgBill ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={sppd.imgBill} 
                            alt="Bukti Bill Hotel" 
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <a 
                            href={sppd.imgBill} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            🔍 Lihat Full Image
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada gambar</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Ringkasan Biaya */}
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">💰 Ringkasan Biaya</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50 w-1/3">
                      Biaya Transportasi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sppd.hargaTiket)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 bg-gray-50">
                      Biaya Akomodasi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sppd.hargaHotel * calculateDuration(sppd.tanggalBerangkat, sppd.tanggalPulang))}
                    </td>
                  </tr>
                  <tr className="bg-purple-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-800">
                      💎 TOTAL ESTIMASI BIAYA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-purple-600">
                      {formatCurrency(calculateTotalCost())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .print\\:hidden {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    </div>
  )
}