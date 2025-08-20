const authorization = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const { role } = req.user
            
            if (!allowedRoles.includes(role)) {
                throw { name: "Forbidden", message: "Access forbidden" }
            }
            
            next()
        } catch (error) {
            next(error)
        }
    }
}

module.exports = { authorization }
