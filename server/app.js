if (process.env.NODE_ENV !== "production"){
    require("dotenv").config()
}

const express = require('express')
const app = express()
const cors = require('cors')
const { errorHandler } = require('./middleware/errorHandler')
const { authentication } = require('./middleware/authentication')
const { authorization } = require('./middleware/authorization')
const { uploadSPPDImages } = require('./middleware/multer')
const Controller = require('./controllers/Controller')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/register', Controller.register)
app.post('/login', Controller.login)
app.post('/auth/google-login', Controller.googleLogin)


// SPPD routes - require authentication
app.use(authentication)

// SPPD CRUD - Support both file upload
app.post('/sppd', uploadSPPDImages, Controller.createSPPD)
app.get('/sppd', Controller.getSPPDs)
app.get('/sppd/:id', Controller.getSPPDById)
app.put('/sppd/:id', uploadSPPDImages, Controller.updateSPPD)
app.delete('/sppd/:id', Controller.deleteSPPD)
app.post('/ai/chat', Controller.chatWithAI)
app.delete('/ai/chat/history', Controller.clearChatHistory)

// Admin only - Update SPPD status
app.patch('/sppd/:id/status', authorization(['admin']), Controller.updateSPPDStatus)

// User profile
app.get('/profile', Controller.getProfile)

// Admin dashboard
app.get('/dashboard/stats', authorization(['admin', 'staff']), Controller.getDashboardStats)

// Admin - Get all staff
app.get('/staff', authorization(['admin']), Controller.getAllStaff)

app.use(errorHandler)

module.exports = app