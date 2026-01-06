import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function FileUpload({ onFileUploaded, uploadType = 'tender', label = 'Upload Document' }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileClassName = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
        return '📃';
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File size exceeds 10MB limit');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadType', uploadType);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(true);

            // Pass file info back to parent
            if (onFileUploaded) {
                onFileUploaded({
                    fileUrl: `${API_URL}/files/download/${uploadType}/${response.data.file.filename}`,
                    fileName: response.data.file.originalName,
                    fileType: response.data.file.mimetype,
                    fileSize: response.data.file.size
                });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setSuccess(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onFileUploaded) {
            onFileUploaded(null);
        }
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {label} (Optional)
            </label>

            {!file ? (
                <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        border: '2px dashed #D1D5DB',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#F9FAFB',
                        transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                >
                    <p style={{ margin: 0, fontSize: '2rem' }}>📎</p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#6B7280' }}>
                        Click to upload a document
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                        PDF, Word, or Images (Max 10MB)
                    </p>
                </div>
            ) : (
                <div style={{
                    padding: '1rem',
                    background: success ? '#ECFDF5' : 'white',
                    border: `1px solid ${success ? '#10B981' : '#E5E7EB'}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>
                            {handleFileClassName(file.name)}
                        </span>
                        <div>
                            <p style={{ margin: 0, fontWeight: '500', fontSize: '0.875rem' }}>
                                {file.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {success ? (
                            <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '500' }}>
                                ✅ Uploaded
                            </span>
                        ) : (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    background: '#3B82F6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        )}

                        <button
                            onClick={handleRemove}
                            style={{
                                padding: '0.25rem 0.5rem',
                                background: 'transparent',
                                color: '#EF4444',
                                border: '1px solid #EF4444',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            />

            {error && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#EF4444' }}>
                    ❌ {error}
                </p>
            )}
        </div>
    );
}

export default FileUpload;
