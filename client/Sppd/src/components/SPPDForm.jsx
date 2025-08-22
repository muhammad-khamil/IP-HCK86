import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'

export default function SPPDForm({
    mode = 'create', // 'create' or 'edit'
    sppdId = null,
    initialData = null,
    onSuccess = null
}) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        daerah_tujuan: '',
        instansi_dituju: '',
        maksud_perjalanan: '',
        tanggalBerangkat: '',
        tanggalPulang: '',
        jenisTransportasi: '',
        hargaTiket: '',
        imgTiket: null,
        namaHotel: '',
        hargaHotel: '',
        imgBill: null
    })

    // Load data for edit mode
    useEffect(() => {
        if (mode === 'edit' && sppdId) {
            fetchSPPDData()
        } else if (initialData) {
            setFormData({
                daerah_tujuan: initialData.daerah_tujuan || '',
                instansi_dituju: initialData.instansi_dituju || '',
                maksud_perjalanan: initialData.maksud_perjalanan || '',
                tanggalBerangkat: initialData.tanggalBerangkat ? initialData.tanggalBerangkat.split('T')[0] : '',
                tanggalPulang: initialData.tanggalPulang ? initialData.tanggalPulang.split('T')[0] : '',
                jenisTransportasi: initialData.jenisTransportasi || '',
                hargaTiket: initialData.hargaTiket || '',
                imgTiket: null,
                namaHotel: initialData.namaHotel || '',
                hargaHotel: initialData.hargaHotel || '',
                imgBill: null
            })
        }
    }, [mode, sppdId, initialData])

    const fetchSPPDData = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("access_token")
            if (!token) {
                navigate('/login')
                return
            }

            http.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const { data } = await http.get(`/sppd/${sppdId}`)

            setFormData({
                daerah_tujuan: data.daerah_tujuan || '',
                instansi_dituju: data.instansi_dituju || '',
                maksud_perjalanan: data.maksud_perjalanan || '',
                tanggalBerangkat: data.tanggalBerangkat ? data.tanggalBerangkat.split('T')[0] : '',
                tanggalPulang: data.tanggalPulang ? data.tanggalPulang.split('T')[0] : '',
                jenisTransportasi: data.jenisTransportasi || '',
                hargaTiket: data.hargaTiket || '',
                imgTiket: null,
                namaHotel: data.namaHotel || '',
                hargaHotel: data.hargaHotel || '',
                imgBill: null
            })
        } catch (error) {
            console.error("Error fetching SPPD data:", error)
            Swal.fire("Error", "Gagal memuat data SPPD", "error")
            navigate('/sppd')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target

        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0] || null
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const validateForm = () => {
        const requiredFields = [
            { field: 'daerah_tujuan', label: 'Daerah Tujuan' },
            { field: 'instansi_dituju', label: 'Instansi Dituju' },
            { field: 'maksud_perjalanan', label: 'Maksud Perjalanan' },
            { field: 'tanggalBerangkat', label: 'Tanggal Berangkat' },
            { field: 'tanggalPulang', label: 'Tanggal Pulang' },
            { field: 'jenisTransportasi', label: 'Jenis Transportasi' },
            { field: 'hargaTiket', label: 'Harga Tiket' },
            { field: 'namaHotel', label: 'Nama Hotel' },
            { field: 'hargaHotel', label: 'Harga Hotel' }
        ]

        for (let { field, label } of requiredFields) {
            if (!formData[field] || formData[field].toString().trim() === '') {
                Swal.fire("Error", `${label} wajib diisi!`, "error")
                return false
            }
        }

        // Validate required files for create mode
        if (mode === 'create') {
            if (!formData.imgTiket) {
                Swal.fire("Error", "Gambar tiket wajib diupload!", "error")
                return false
            }
            if (!formData.imgBill) {
                Swal.fire("Error", "Gambar bill hotel wajib diupload!", "error")
                return false
            }
        }

        // Validate dates
        if (new Date(formData.tanggalBerangkat) >= new Date(formData.tanggalPulang)) {
            Swal.fire("Error", "Tanggal pulang harus setelah tanggal berangkat!", "error")
            return false
        }

        // Validate numeric fields
        if (isNaN(formData.hargaTiket) || formData.hargaTiket <= 0) {
            Swal.fire("Error", "Harga tiket harus berupa angka yang valid!", "error")
            return false
        }

        if (isNaN(formData.hargaHotel) || formData.hargaHotel <= 0) {
            Swal.fire("Error", "Harga hotel harus berupa angka yang valid!", "error")
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)

        try {
            const token = localStorage.getItem("access_token")
            if (!token) {
                navigate('/login')
                return
            }

            http.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // Create FormData for file upload
            const submitData = new FormData()

            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'imgTiket' || key === 'imgBill') {
                    // Only add files if they exist
                    if (formData[key]) {
                        submitData.append(key, formData[key])
                    }
                } else {
                    submitData.append(key, formData[key])
                }
            })

            let response
            if (mode === 'create') {
                response = await http.post('/sppd', submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                Swal.fire("Success", "SPPD berhasil dibuat!", "success")
            } else {
                response = await http.put(`/sppd/${sppdId}`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                Swal.fire("Success", "SPPD berhasil diperbarui!", "success")
            }

            // Call onSuccess callback or navigate
            if (onSuccess) {
                onSuccess(response.data)
            } else {
                navigate('/sppd')
            }

        } catch (error) {
            console.error("Error submitting SPPD:", error)
            const errorMessage = error.response?.data?.message || `Gagal ${mode === 'create' ? 'membuat' : 'memperbarui'} SPPD`
            Swal.fire("Error", errorMessage, "error")
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value || 0)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Data Perjalanan */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 Data Perjalanan</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daerah Tujuan */}
                    <div>
                        <label htmlFor="daerah_tujuan" className="block text-sm font-medium text-gray-700 mb-2">
                            Daerah Tujuan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="daerah_tujuan"
                            name="daerah_tujuan"
                            value={formData.daerah_tujuan}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Contoh: Jakarta, Bandung, Surabaya"
                        />
                    </div>

                    {/* Instansi Dituju */}
                    <div>
                        <label htmlFor="instansi_dituju" className="block text-sm font-medium text-gray-700 mb-2">
                            Instansi Dituju <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="instansi_dituju"
                            name="instansi_dituju"
                            value={formData.instansi_dituju}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Nama instansi/perusahaan yang dituju"
                        />
                    </div>
                </div>

                {/* Maksud Perjalanan */}
                <div className="mt-6">
                    <label htmlFor="maksud_perjalanan" className="block text-sm font-medium text-gray-700 mb-2">
                        Maksud Perjalanan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="maksud_perjalanan"
                        name="maksud_perjalanan"
                        value={formData.maksud_perjalanan}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Jelaskan tujuan dan maksud perjalanan dinas"
                    />
                </div>

                {/* Tanggal Berangkat & Pulang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label htmlFor="tanggalBerangkat" className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Berangkat <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="tanggalBerangkat"
                            name="tanggalBerangkat"
                            value={formData.tanggalBerangkat}
                            onChange={handleInputChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="tanggalPulang" className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Pulang <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="tanggalPulang"
                            name="tanggalPulang"
                            value={formData.tanggalPulang}
                            onChange={handleInputChange}
                            required
                            min={formData.tanggalBerangkat || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Data Transportasi */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚗 Data Transportasi</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Jenis Transportasi */}
                    <div>
                        <label htmlFor="jenisTransportasi" className="block text-sm font-medium text-gray-700 mb-2">
                            Jenis Transportasi <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="jenisTransportasi"
                            name="jenisTransportasi"
                            value={formData.jenisTransportasi}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="">Pilih Jenis Transportasi</option>
                            <option value="Pesawat">✈️ Pesawat</option>
                            <option value="Kereta Api">🚄 Kereta Api</option>
                            <option value="Bus">🚌 Bus</option>
                            <option value="Mobil Pribadi">🚗 Mobil Pribadi</option>
                            <option value="Mobil Dinas">🚙 Mobil Dinas</option>
                            <option value="Motor">🏍️ Motor</option>
                        </select>
                    </div>

                    {/* Harga Tiket */}
                    <div>
                        <label htmlFor="hargaTiket" className="block text-sm font-medium text-gray-700 mb-2">
                            Harga Tiket <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                id="hargaTiket"
                                name="hargaTiket"
                                value={formData.hargaTiket}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="0"
                            />
                        </div>
                        {formData.hargaTiket && (
                            <p className="text-sm text-gray-500 mt-1">{formatCurrency(formData.hargaTiket)}</p>
                        )}
                    </div>
                </div>

                {/* Upload Tiket */}
                <div className="mt-6">
                    <label htmlFor="imgTiket" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Foto Tiket/Bukti Transportasi <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        id="imgTiket"
                        name="imgTiket"
                        onChange={handleInputChange}
                        accept="image/*"
                        required={mode === 'create'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        Format: JPG, JPEG, PNG (Max 1MB)
                    </p>
                </div>
            </div>

            {/* Section 3: Data Hotel */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🏨 Data Hotel</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nama Hotel */}
                    <div>
                        <label htmlFor="namaHotel" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Hotel <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="namaHotel"
                            name="namaHotel"
                            value={formData.namaHotel}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Nama hotel tempat menginap"
                        />
                    </div>

                    {/* Harga Hotel */}
                    <div>
                        <label htmlFor="hargaHotel" className="block text-sm font-medium text-gray-700 mb-2">
                            Harga Hotel per Malam <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                id="hargaHotel"
                                name="hargaHotel"
                                value={formData.hargaHotel}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="0"
                            />
                        </div>
                        {formData.hargaHotel && (
                            <p className="text-sm text-gray-500 mt-1">{formatCurrency(formData.hargaHotel)}</p>
                        )}
                    </div>
                </div>

                {/* Upload Bill Hotel */}
                <div className="mt-6">
                    <label htmlFor="imgBill" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Foto Bill/Bukti Hotel <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        id="imgBill"
                        name="imgBill"
                        onChange={handleInputChange}
                        accept="image/*"
                        required={mode === 'create'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        Format: JPG, JPEG, PNG (Max 1MB)
                    </p>
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {mode === 'create' ? 'Membuat...' : 'Memperbarui...'}
                        </div>
                    ) : (
                        mode === 'create' ? '📝 Buat SPPD' : '✏️ Perbarui SPPD'
                    )}
                </button>
            </div>
        </form>
    )
}