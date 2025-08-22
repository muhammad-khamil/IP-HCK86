const errorHandler = (error, req, res, next) => {
    switch (error.name) {
        case "SequelizeValidationError":
            res.status(400).json({ message: error.errors[0].message })
            return;

        case "SequelizeUniqueConstraintError":
            res.status(400).json({ message: error.errors[0].message })
            return;

        case "JsonWebTokenError":
            res.status(401).json({ message: "Invalid token" })
            return;

        case 'Unauthorized':
            res.status(401).json({ message: error.message });
            return;

        case 'NotFound':
            res.status(404).json({ message: error.message });
            return;

        case 'BadRequest':
        case 'Bad Request':
            res.status(400).json({ message: error.message });
            return;

        case 'Forbidden':
            res.status(403).json({ message: error.message });
            return;

        default:
            res.status(500).json({ message: error.message });
            return;
    }
}

module.exports = {errorHandler}