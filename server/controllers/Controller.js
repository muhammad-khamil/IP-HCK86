const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')
const { User, SPPD } = require('../models/')

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

    static async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email) {
                throw { name: "Bad Request", message: "Email is required" }
            }

            if (!password) {
                throw { name: "Bad Request", message: "Password is required" }
            }

            const user = await User.findOne({ where: { email } })

            if (!user) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            const checkPassword = comparePassword(password, user.password)

            if (!checkPassword) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
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
                hargaTiket, imgTiket, namaHotel, hargaHotel, imgBill
            } = req.body
            
            // Basic validation
            if (!daerah_tujuan || !maksud_perjalanan || !instansi_dituju) {
                throw { name: "Bad Request", message: "Required fields: daerah_tujuan, maksud_perjalanan, instansi_dituju" }
            }
            
            if (!tanggalBerangkat || !tanggalPulang) {
                throw { name: "Bad Request", message: "Tanggal berangkat and tanggal pulang are required" }
            }
            
            // Validate dates
            const berangkat = new Date(tanggalBerangkat)
            const pulang = new Date(tanggalPulang)
            
            if (pulang <= berangkat) {
                throw { name: "Bad Request", message: "Tanggal pulang must be after tanggal berangkat" }
            }
            
            const sppdData = { ...req.body, userId }
            const sppd = await SPPD.create(sppdData)
            
            res.status(201).json(sppd)
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
                throw { name: "NotFound", message: "SPPD not found" }
            }
            
            // Staff hanya bisa melihat SPPD milik sendiri
            if (role === 'staff' && sppd.userId !== userId) {
                throw { name: "Forbidden", message: "Access forbidden" }
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
                throw { name: "NotFound", message: "SPPD not found" }
            }
            
            // Staff hanya bisa edit SPPD milik sendiri dan hanya jika statusnya pending
            if (role === 'staff') {
                if (sppd.userId !== userId) {
                    throw { name: "Forbidden", message: "Access forbidden" }
                }
                if (sppd.status !== 'pending') {
                    throw { name: "Forbidden", message: "Cannot edit SPPD that is not pending" }
                }
            }
            
            await sppd.update(req.body)
            
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
                throw { name: "NotFound", message: "SPPD not found" }
            }
            
            // Staff hanya bisa delete SPPD milik sendiri dan hanya jika statusnya pending
            if (role === 'staff') {
                if (sppd.userId !== userId) {
                    throw { name: "Forbidden", message: "Access forbidden" }
                }
                if (sppd.status !== 'pending') {
                    throw { name: "Forbidden", message: "Cannot delete SPPD that is not pending" }
                }
            }
            
            await sppd.destroy()
            res.status(200).json({ message: "SPPD deleted successfully" })
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
                throw { name: "Bad Request", message: "Status must be approved or rejected" }
            }
            
            const sppd = await SPPD.findByPk(id)
            
            if (!sppd) {
                throw { name: "NotFound", message: "SPPD not found" }
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
                throw { name: "NotFound", message: "User not found" }
            }
            
            res.status(200).json(user)
        } catch (error) {
            next(error)
        }
    }

    // Admin dashboard - Get statistics
    static async getDashboardStats(req, res, next) {
        try {
            const totalSPPD = await SPPD.count()
            const pendingSPPD = await SPPD.count({ where: { status: 'pending' } })
            const approvedSPPD = await SPPD.count({ where: { status: 'approved' } })
            const rejectedSPPD = await SPPD.count({ where: { status: 'rejected' } })
            const totalStaff = await User.count({ where: { role: 'staff' } })
            
            res.status(200).json({
                totalSPPD,
                pendingSPPD,
                approvedSPPD,
                rejectedSPPD,
                totalStaff
            })
        } catch (error) {
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
}

module.exports = Controller