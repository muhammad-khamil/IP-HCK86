const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image buffer directly to cloudinary (MORE EFFICIENT)
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Custom public ID for the image
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, folder = 'sppd', publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: publicId,
                resource_type: 'image',
                format: 'jpg',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' },
                    { width: 1000, crop: 'limit' }
                ]
            },
            (error, uploadResult) => {
                if (error) return reject(error)
                
                resolve({
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                    width: uploadResult.width,
                    height: uploadResult.height
                })
            }
        ).end(buffer)
    })
}

/**
 * Delete image from cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Failed to delete image from Cloudinary: ' + error.message);
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after upload/v{version}/
    const pathParts = parts.slice(uploadIndex + 2);
    const fullPath = pathParts.join('/');
    
    // Remove file extension
    return fullPath.replace(/\.[^/.]+$/, '');
};

module.exports = {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
    extractPublicId
};
