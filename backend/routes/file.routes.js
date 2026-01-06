const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const upload = require('../middleware/upload');

module.exports = (blockchain) => {
    // Upload file
    router.post('/upload', upload.single('file'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileInfo = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                uploadType: req.body.uploadType || 'tender',
                uploadedBy: req.user.email,
                uploadedAt: new Date().toISOString()
            };

            res.status(201).json({
                message: 'File uploaded successfully',
                file: fileInfo
            });
        } catch (error) {
            console.error('File upload error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Download file
    router.get('/download/:type/:filename', (req, res) => {
        try {
            const { type, filename } = req.params;

            // Validate type
            if (type !== 'tender' && type !== 'bid') {
                return res.status(400).json({ error: 'Invalid file type' });
            }

            const uploadsDir = path.join(__dirname, '..', 'uploads');
            const filePath = path.join(uploadsDir, type + 's', filename);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Send file
            res.download(filePath);
        } catch (error) {
            console.error('File download error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get file info
    router.get('/info/:type/:filename', (req, res) => {
        try {
            const { type, filename } = req.params;

            if (type !== 'tender' && type !== 'bid') {
                return res.status(400).json({ error: 'Invalid file type' });
            }

            const uploadsDir = path.join(__dirname, '..', 'uploads');
            const filePath = path.join(uploadsDir, type + 's', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            const stats = fs.statSync(filePath);
            const ext = path.extname(filename);

            res.json({
                filename,
                size: stats.size,
                extension: ext,
                created: stats.birthtime,
                modified: stats.mtime
            });
        } catch (error) {
            console.error('File info error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Delete file (government/auditor only)
    router.delete('/:type/:filename', (req, res) => {
        try {
            // Only government and auditor can delete files
            if (req.user.role !== 'government' && req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { type, filename } = req.params;

            if (type !== 'tender' && type !== 'bid') {
                return res.status(400).json({ error: 'Invalid file type' });
            }

            const uploadsDir = path.join(__dirname, '..', 'uploads');
            const filePath = path.join(uploadsDir, type + 's', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Delete file
            fs.unlinkSync(filePath);

            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            console.error('File delete error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
