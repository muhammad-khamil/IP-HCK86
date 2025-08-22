const { verifyToken } = require("../helpers/jwt")
const { User } = require('../models/')

async function authentication(req, res, next) {
    try {
        const { authorization } = req.headers
        if (!authorization) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }

        const rawToken = authorization.split(' ')
        const typeToken = rawToken[0]
        const valueToken = rawToken[1]

        if (typeToken !== "Bearer" || !valueToken) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }

        const result = verifyToken(valueToken)

        const user = await User.findByPk(result.id)
        if (!user) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }

        req.user = { id: user.id, role: user.role }

        next()

    } catch (error) {
        next(error);
    }
}

module.exports = { authentication }