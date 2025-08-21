const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')
const { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicId } = require('../helpers/cloudinary')
const { User, SPPD } = require('../models/')
const { OAuth2Client } = require('google-auth-library');

// Helper function untuk parse tanggal format Indonesia
function parseIndonesianDate(dateStr) {
    if (!dateStr) return null

    const str = dateStr.trim()

    // Mapping nama bulan Indonesia ke angka
    const bulanIndo = {
        'januari': '01', 'jan': '01',
        'februari': '02', 'feb': '02',
        'maret': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'mei': '05',
        'juni': '06', 'jun': '06',
        'juli': '07', 'jul': '07',
        'agustus': '08', 'agu': '08',
        'september': '09', 'sep': '09',
        'oktober': '10', 'okt': '10',
        'november': '11', 'nov': '11',
        'desember': '12', 'des': '12'
    }

    // Format: "15 Januari 2025" atau "15 Jan 2025"
    const formatIndo = str.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/i)
    if (formatIndo) {
        const [, day, month, year] = formatIndo
        const monthNum = bulanIndo[month.toLowerCase()]
        if (monthNum) {
            return new Date(`${year}-${monthNum}-${day.padStart(2, '0')}`)
        }
    }

    // Format: "DD-MM-YYYY"
    if (str.includes('-') && str.split('-')[0].length <= 2) {
        const parts = str.split('-')
        if (parts.length === 3) {
            const [day, month, year] = parts
            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
        }
    }

    // Format: "YYYY-MM-DD" atau format standar lainnya
    return new Date(str)
}

class Controller {
    static async register(req, res, next) {
        try {
            const user = await User.create(req.body)
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email
            })
        } catch (error) {
            next(error)
        }
    }

    static async googleLogin(req, res, next) {
        try {
            const { googleToken } = req.body
            if (!googleToken) throw { name: "BadRequest", message: "Google Token is required" }


            // Create instance of OAuth2Client
            const client = new OAuth2Client();

            // Verify the token
            // Note: You need to set your Google Client ID in the environment variable GOOGLE_CLIENT_ID
            const ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID
            })

            // Get the user information from the token
            const payload = ticket.getPayload()
            console.log(payload, "<<<");


            // bikin user if not exists karena untuk bikin token kita butuh user id
            const randomPassword = payload.sub + Date.now().toString() + Math.random().toString(36).substring(2, 15) // generate a random password
            const [user, created] = await User.findOrCreate({
                where: { email: payload.email },
                defaults: {
                    email: payload.email,
                    name: payload.name,
                    password: randomPassword,
                    role: 'staff'
                }
            })

            const access_token = signToken({ id: user.id, role: user.role })

            res.status(created ? 201 : 200).json({
                access_token,
                role: user.role,
                name: user.name
            });
        } catch (error) {
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email) {
                throw { name: "Bad Request", message: "Email wajib diisi" }
            }

            if (!password) {
                throw { name: "Bad Request", message: "Password wajib diisi" }
            }

            const user = await User.findOne({ where: { email } })

            if (!user) {
                throw { name: "Unauthorized", message: "Email atau password salah" }
            }

            const checkPassword = comparePassword(password, user.password)

            if (!checkPassword) {
                throw { name: "Unauthorized", message: "Email atau password salah" }
            }

            const access_token = signToken({ id: user.id, role: user.role })
            res.status(200).json({ access_token })
        } catch (error) {
            next(error)
        }
    }

    // SPPD CRUD Operations
    static async createSPPD(req, res, next) {
        try {
            const { id: userId } = req.user
            const {
                daerah_tujuan, maksud_perjalanan, instansi_dituju,
                tanggalBerangkat, tanggalPulang, jenisTransportasi,
                hargaTiket, namaHotel, hargaHotel
            } = req.body

            // Basic validation
            if (!daerah_tujuan || !maksud_perjalanan || !instansi_dituju) {
                throw { name: "Bad Request", message: "Field wajib: daerah_tujuan, maksud_perjalanan, instansi_dituju" }
            }

            if (!tanggalBerangkat || !tanggalPulang) {
                throw { name: "Bad Request", message: "Tanggal berangkat dan tanggal pulang wajib diisi" }
            }

            // Parse tanggal dengan berbagai format Indonesia
            let berangkat, pulang

            try {
                berangkat = parseIndonesianDate(tanggalBerangkat)
                pulang = parseIndonesianDate(tanggalPulang)

                // Check if dates are valid
                if (isNaN(berangkat.getTime())) {
                    throw new Error('Format tanggal berangkat tidak valid')
                }
                if (isNaN(pulang.getTime())) {
                    throw new Error('Format tanggal pulang tidak valid')
                }

            } catch (error) {
                throw {
                    name: "Bad Request",
                    message: "Format tanggal tidak valid. Gunakan format: '15 Januari 2025', '15-01-2025', atau '2025-01-15'"
                }
            }

            if (pulang <= berangkat) {
                throw { name: "Bad Request", message: "Tanggal pulang harus setelah tanggal berangkat" }
            }

            // Upload files to Cloudinary
            let uploadedTiket = null
            let uploadedBill = null

            try {
                // Upload tiket image (direct buffer upload)
                uploadedTiket = await uploadBufferToCloudinary(
                    req.files.imgTiket[0].buffer,
                    'sppd/tiket',
                    `tiket_${userId}_${Date.now()}`
                )

                // Upload bill image (direct buffer upload)
                uploadedBill = await uploadBufferToCloudinary(
                    req.files.imgBill[0].buffer,
                    'sppd/bill',
                    `bill_${userId}_${Date.now()}`
                )

                // Create SPPD with uploaded image URLs
                const sppdData = {
                    daerah_tujuan,
                    maksud_perjalanan,
                    instansi_dituju,
                    tanggalBerangkat,
                    tanggalPulang,
                    jenisTransportasi,
                    hargaTiket: parseInt(hargaTiket),
                    namaHotel,
                    hargaHotel: parseInt(hargaHotel),
                    userId,
                    imgTiket: uploadedTiket.url,
                    imgBill: uploadedBill.url
                }

                const sppd = await SPPD.create(sppdData)
                res.status(201).json(sppd)

            } catch (uploadError) {
                // Clean up uploaded images if SPPD creation fails
                if (uploadedTiket) {
                    await deleteFromCloudinary(uploadedTiket.public_id).catch(() => { })
                }
                if (uploadedBill) {
                    await deleteFromCloudinary(uploadedBill.public_id).catch(() => { })
                }
                throw uploadError
            }

        } catch (error) {
            next(error)
        }
    }

    static async getSPPDs(req, res, next) {
        try {
            const { id: userId, role } = req.user
            const { status, page = 1, limit = 10 } = req.query

            let where = {}

            // Staff hanya bisa melihat SPPD milik sendiri
            if (role === 'staff') {
                where.userId = userId
            }

            // Filter by status if provided
            if (status && ['pending', 'approved', 'rejected'].includes(status)) {
                where.status = status
            }

            const offset = (page - 1) * limit

            const { count, rows: sppds } = await SPPD.findAndCountAll({
                where,
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            })

            res.status(200).json({
                sppds,
                pagination: {
                    totalItems: count,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    itemsPerPage: parseInt(limit)
                }
            })
        } catch (error) {
            next(error)
        }
    }

    static async getSPPDById(req, res, next) {
        try {
            const { id } = req.params
            const { id: userId, role } = req.user

            const sppd = await SPPD.findByPk(id, {
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }]
            })

            if (!sppd) {
                throw { name: "NotFound", message: "SPPD tidak ditemukan" }
            }

            // Staff hanya bisa melihat SPPD milik sendiri
            if (role === 'staff' && sppd.userId !== userId) {
                throw { name: "Forbidden", message: "Akses ditolak" }
            }

            res.status(200).json(sppd)
        } catch (error) {
            next(error)
        }
    }

    static async updateSPPD(req, res, next) {
        try {
            const { id } = req.params
            const { id: userId, role } = req.user

            const sppd = await SPPD.findByPk(id)

            if (!sppd) {
                throw { name: "NotFound", message: "SPPD tidak ditemukan" }
            }

            // Staff hanya bisa edit SPPD milik sendiri dan hanya jika statusnya pending atau rejected
            if (role === 'staff') {
                if (sppd.userId !== userId) {
                    throw { name: "Forbidden", message: "Akses ditolak" }
                }
                // Allow edit untuk pending dan rejected
                if (!['pending', 'rejected'].includes(sppd.status)) {
                    throw { name: "Forbidden", message: "Tidak dapat mengedit SPPD yang sudah approved" }
                }
            }

            let updateData = { ...req.body }
            let oldTiketPublicId = null
            let oldBillPublicId = null

            // RESET STATUS KE PENDING JIKA SPPD REJECTED DI-EDIT
            if (sppd.status === 'rejected') {
                updateData.status = 'pending'
            }

            // Validasi tanggal jika diberikan
            if (updateData.tanggalBerangkat || updateData.tanggalPulang) {
                try {
                    let berangkat, pulang

                    if (updateData.tanggalBerangkat) {
                        berangkat = parseIndonesianDate(updateData.tanggalBerangkat)

                        if (isNaN(berangkat.getTime())) {
                            throw new Error('Format tanggal berangkat tidak valid')
                        }

                        updateData.tanggalBerangkat = berangkat
                    }

                    if (updateData.tanggalPulang) {
                        pulang = parseIndonesianDate(updateData.tanggalPulang)

                        if (isNaN(pulang.getTime())) {
                            throw new Error('Format tanggal pulang tidak valid')
                        }

                        updateData.tanggalPulang = pulang
                    }

                    // Validasi bahwa pulang adalah setelah berangkat
                    const finalBerangkat = berangkat || sppd.tanggalBerangkat
                    const finalPulang = pulang || sppd.tanggalPulang

                    if (finalPulang <= finalBerangkat) {
                        throw { name: "Bad Request", message: "Tanggal pulang harus setelah tanggal berangkat" }
                    }

                } catch (error) {
                    if (error.name === "Bad Request") {
                        throw error
                    }
                    throw {
                        name: "Bad Request",
                        message: "Format tanggal tidak valid. Gunakan format: '15 Januari 2025', '15-01-2025', atau '2025-01-15'"
                    }
                }
            }

            // Handle image updates - File Upload Only
            if (req.files?.imgTiket) {
                try {
                    // Extract old image public ID for cleanup
                    oldTiketPublicId = extractPublicId(sppd.imgTiket)

                    // Upload new tiket image
                    const uploadedTiket = await uploadBufferToCloudinary(
                        req.files.imgTiket[0].buffer,
                        'sppd/tiket',
                        `tiket_${userId}_${Date.now()}`
                    )

                    updateData.imgTiket = uploadedTiket.url
                } catch (error) {
                    throw new Error('Gagal upload gambar tiket baru: ' + error.message)
                }
            }

            if (req.files?.imgBill) {
                try {
                    // Extract old image public ID for cleanup
                    oldBillPublicId = extractPublicId(sppd.imgBill)

                    // Upload new bill image
                    const uploadedBill = await uploadBufferToCloudinary(
                        req.files.imgBill[0].buffer,
                        'sppd/bill',
                        `bill_${userId}_${Date.now()}`
                    )

                    updateData.imgBill = uploadedBill.url
                } catch (error) {
                    throw new Error('Gagal upload gambar bill baru: ' + error.message)
                }
            }

            // Convert string numbers to integers
            if (updateData.hargaTiket) updateData.hargaTiket = parseInt(updateData.hargaTiket)
            if (updateData.hargaHotel) updateData.hargaHotel = parseInt(updateData.hargaHotel)

            // Update SPPD with new data
            await sppd.update(updateData)

            // Clean up old images from Cloudinary if new ones were uploaded
            if (oldTiketPublicId) {
                await deleteFromCloudinary(oldTiketPublicId).catch(() => {
                    console.log('Gagal menghapus gambar tiket lama dari Cloudinary')
                })
            }
            if (oldBillPublicId) {
                await deleteFromCloudinary(oldBillPublicId).catch(() => {
                    console.log('Gagal menghapus gambar bill lama dari Cloudinary')
                })
            }

            const updatedSPPD = await SPPD.findByPk(id, {
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }]
            })

            res.status(200).json(updatedSPPD)
        } catch (error) {
            next(error)
        }
    }

    static async deleteSPPD(req, res, next) {
        try {
            const { id } = req.params
            const { id: userId, role } = req.user

            const sppd = await SPPD.findByPk(id)

            if (!sppd) {
                throw { name: "NotFound", message: "SPPD tidak ditemukan" }
            }

            // Staff hanya bisa delete SPPD milik sendiri dan hanya jika statusnya pending
            if (role === 'staff') {
                if (sppd.userId !== userId) {
                    throw { name: "Forbidden", message: "Akses ditolak" }
                }
                if (sppd.status !== 'pending') {
                    throw { name: "Forbidden", message: "Tidak dapat menghapus SPPD yang statusnya bukan pending" }
                }
            }

            // Delete images from Cloudinary before deleting SPPD
            if (sppd.imgTiket) {
                const tiketPublicId = extractPublicId(sppd.imgTiket)
                if (tiketPublicId) {
                    await deleteFromCloudinary(tiketPublicId).catch(() => {
                        console.log('Gagal menghapus gambar tiket dari Cloudinary')
                    })
                }
            }

            if (sppd.imgBill) {
                const billPublicId = extractPublicId(sppd.imgBill)
                if (billPublicId) {
                    await deleteFromCloudinary(billPublicId).catch(() => {
                        console.log('Gagal menghapus gambar bill dari Cloudinary')
                    })
                }
            }

            await sppd.destroy()
            res.status(200).json({ message: "SPPD berhasil dihapus" })
        } catch (error) {
            next(error)
        }
    }

    // Admin only - Update SPPD Status
    static async updateSPPDStatus(req, res, next) {
        try {
            const { id } = req.params
            const { status } = req.body

            if (!['approved', 'rejected'].includes(status)) {
                throw { name: "Bad Request", message: "Status harus approved atau rejected" }
            }

            const sppd = await SPPD.findByPk(id)

            if (!sppd) {
                throw { name: "NotFound", message: "SPPD tidak ditemukan" }
            }

            await sppd.update({ status })

            const updatedSPPD = await SPPD.findByPk(id, {
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }]
            })

            res.status(200).json(updatedSPPD)
        } catch (error) {
            next(error)
        }
    }

    // Get current user profile
    static async getProfile(req, res, next) {
        try {
            const { id } = req.user
            const user = await User.findByPk(id, {
                attributes: ['id', 'name', 'email', 'role']
            })

            if (!user) {
                throw { name: "NotFound", message: "User tidak ditemukan" }
            }

            res.status(200).json(user)
        } catch (error) {
            next(error)
        }
    }

    // Admin dashboard - Get statistics
    static async getDashboardStats(req, res, next) {
    try {
        const { id: userId, role } = req.user
        
        let whereClause = {}
        
        // Kalau bukan admin, filter by userId
        if (role !== 'admin') {
            whereClause.userId = userId
        }

        // Ambil semua SPPD sesuai role
        const sppds = await SPPD.findAll({
            where: whereClause,
            attributes: ['id', 'status']  // Cuma ambil yang dibutuhin
        })

        const stats = {
            totalSPPD: sppds.length,
            pendingSPPD: sppds.filter(s => s.status === 'pending').length,
            approvedSPPD: sppds.filter(s => s.status === 'approved').length,
            rejectedSPPD: sppds.filter(s => s.status === 'rejected').length
        }

        res.status(200).json(stats)

    } catch (error) {
        console.error('Dashboard stats error:', error)
        next(error)
    }
}

    // Admin only - Get all staff
    static async getAllStaff(req, res, next) {
        try {
            const staff = await User.findAll({
                where: { role: 'staff' },
                attributes: ['id', 'name', 'email', 'createdAt'],
                order: [['name', 'ASC']]
            })

            res.status(200).json(staff)
        } catch (error) {
            next(error)
        }
    }

    // server/controllers/Controller.js
    // Tambah method sederhana

    static async chatWithAI(req, res, next) {
        try {
            const { message } = req.body
            const { id: userId } = req.user

            if (!message || message.trim().length === 0) {
                throw { name: "Bad Request", message: "Pesan tidak boleh kosong" }
            }

            if (message.length > 1000) {
                throw { name: "Bad Request", message: "Pesan terlalu panjang, maksimal 1000 karakter" }
            }

            const geminiChatbot = require('../helpers/gemini')

            const result = await geminiChatbot.generateResponse(userId, message.trim())

            res.status(200).json({
                success: result.success,
                message: result.response,
                chatCount: result.chatCount || 0
            })

        } catch (error) {
            console.error('Chat AI Error:', error)
            next(error)
        }
    }

    static async clearChatHistory(req, res, next) {
        try {
            const { id: userId } = req.user
            const geminiChatbot = require('../helpers/gemini')

            const result = geminiChatbot.clearHistory(userId)

            res.status(200).json({
                success: true,
                message: result
            })

        } catch (error) {
            console.error('Clear Chat Error:', error)
            next(error)
        }
    }
}

module.exports = Controller