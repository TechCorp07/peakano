"""
File Encryption Service
AES-256-GCM encryption for files at rest
"""
import logging
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import base64

logger = logging.getLogger(__name__)


class FileEncryption:
    """File encryption using AES-256-GCM"""
    
    def __init__(self, master_key: str):
        """
        Initialize encryption with master key
        
        Args:
            master_key: Base64-encoded 256-bit key or passphrase
        """
        # Derive encryption key from master key
        if len(master_key) == 44:  # Base64 encoded 32 bytes
            self.key = base64.b64decode(master_key)
        else:
            # Derive key from passphrase
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'medical-imaging-salt',  # Should be unique per deployment
                iterations=100000
            )
            self.key = kdf.derive(master_key.encode())
        
        self.aesgcm = AESGCM(self.key)
    
    def encrypt_file(self, plaintext: bytes) -> bytes:
        """
        Encrypt file content
        
        Returns:
            Encrypted content: nonce (12 bytes) + ciphertext + tag (16 bytes)
        """
        try:
            # Generate random nonce (12 bytes for GCM)
            nonce = os.urandom(12)
            
            # Encrypt data
            ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)
            
            # Return nonce + ciphertext (ciphertext includes auth tag)
            return nonce + ciphertext
            
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt_file(self, encrypted_data: bytes) -> bytes:
        """
        Decrypt file content
        
        Args:
            encrypted_data: nonce (12 bytes) + ciphertext + tag
        """
        try:
            # Extract nonce and ciphertext
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            # Decrypt data
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
            
            return plaintext
            
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def encrypt_stream(self, input_file, output_file, chunk_size: int = 1024*1024):
        """
        Encrypt large file in streaming mode
        
        Args:
            input_file: File-like object to read from
            output_file: File-like object to write to
            chunk_size: Size of chunks to process (1MB default)
        """
        nonce = os.urandom(12)
        output_file.write(nonce)
        
        while True:
            chunk = input_file.read(chunk_size)
            if not chunk:
                break
            
            encrypted_chunk = self.aesgcm.encrypt(nonce, chunk, None)
            output_file.write(encrypted_chunk)
            
            # Increment nonce for next chunk
            nonce = int.from_bytes(nonce, 'big') + 1
            nonce = nonce.to_bytes(12, 'big')
    
    def decrypt_stream(self, input_file, output_file, chunk_size: int = 1024*1024):
        """Decrypt large file in streaming mode"""
        # Read initial nonce
        nonce = input_file.read(12)
        
        while True:
            # Read chunk (includes auth tag)
            encrypted_chunk = input_file.read(chunk_size + 16)
            if not encrypted_chunk:
                break
            
            decrypted_chunk = self.aesgcm.decrypt(nonce, encrypted_chunk, None)
            output_file.write(decrypted_chunk)
            
            # Increment nonce
            nonce = int.from_bytes(nonce, 'big') + 1
            nonce = nonce.to_bytes(12, 'big')


# Global encryption instance
file_encryption: Optional[FileEncryption] = None


def init_file_encryption(master_key: str):
    """Initialize file encryption service"""
    global file_encryption
    file_encryption = FileEncryption(master_key)
    logger.info("File encryption initialized")


def get_file_encryption() -> FileEncryption:
    """Get file encryption instance"""
    if file_encryption is None:
        raise RuntimeError("File encryption not initialized")
    return file_encryption