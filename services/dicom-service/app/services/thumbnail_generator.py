"""
DICOM Thumbnail Generator
Creates thumbnail images from DICOM instances
"""
import logging
from typing import Optional, Tuple
from io import BytesIO
import pydicom
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


class ThumbnailGenerator:
    """Generate thumbnails from DICOM images"""
    
    def __init__(
        self,
        default_size: Tuple[int, int] = (256, 256),
        quality: int = 85
    ):
        self.default_size = default_size
        self.quality = quality
    
    def generate_from_dicom(
        self,
        dicom_data: bytes,
        size: Optional[Tuple[int, int]] = None,
        quality: Optional[int] = None
    ) -> Optional[bytes]:
        """
        Generate thumbnail from DICOM file
        
        Args:
            dicom_data: DICOM file bytes
            size: Thumbnail size (width, height)
            quality: JPEG quality (1-100)
            
        Returns:
            JPEG thumbnail bytes
        """
        try:
            # Parse DICOM
            dcm = pydicom.dcmread(BytesIO(dicom_data))
            
            # Get pixel array
            if not hasattr(dcm, 'pixel_array'):
                logger.warning("DICOM file has no pixel data")
                return None
            
            pixel_array = dcm.pixel_array
            
            # Handle different image types
            thumbnail = self._process_pixel_array(
                pixel_array,
                dcm.get('PhotometricInterpretation'),
                dcm.get('WindowCenter'),
                dcm.get('WindowWidth')
            )
            
            # Resize
            size = size or self.default_size
            thumbnail = thumbnail.resize(size, Image.Resampling.LANCZOS)
            
            # Convert to JPEG
            output = BytesIO()
            thumbnail.save(
                output,
                format='JPEG',
                quality=quality or self.quality,
                optimize=True
            )
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")
            return None
    
    def _process_pixel_array(
        self,
        pixel_array: np.ndarray,
        photometric: Optional[str],
        window_center: Optional[float],
        window_width: Optional[float]
    ) -> Image.Image:
        """Process pixel array to PIL Image"""
        
        # Handle multi-frame (take first frame)
        if len(pixel_array.shape) > 2:
            if pixel_array.shape[0] > 1:  # Multiple frames
                pixel_array = pixel_array[0]
        
        # Apply windowing for CT/MR images
        if window_center and window_width:
            pixel_array = self._apply_windowing(
                pixel_array,
                window_center,
                window_width
            )
        else:
            # Auto-scale to 0-255
            pixel_array = self._normalize_array(pixel_array)
        
        # Convert to uint8
        pixel_array = pixel_array.astype(np.uint8)
        
        # Handle color spaces
        if photometric == 'RGB':
            return Image.fromarray(pixel_array, mode='RGB')
        elif photometric == 'YBR_FULL':
            # Convert YBR to RGB
            return Image.fromarray(pixel_array, mode='YCbCr').convert('RGB')
        else:
            # Grayscale
            return Image.fromarray(pixel_array, mode='L')
    
    def _apply_windowing(
        self,
        pixel_array: np.ndarray,
        center: float,
        width: float
    ) -> np.ndarray:
        """Apply DICOM windowing"""
        lower = center - (width / 2)
        upper = center + (width / 2)
        
        # Clip and scale to 0-255
        windowed = np.clip(pixel_array, lower, upper)
        windowed = ((windowed - lower) / (upper - lower)) * 255
        
        return windowed
    
    def _normalize_array(self, pixel_array: np.ndarray) -> np.ndarray:
        """Normalize array to 0-255"""
        min_val = pixel_array.min()
        max_val = pixel_array.max()
        
        if max_val > min_val:
            normalized = ((pixel_array - min_val) / (max_val - min_val)) * 255
        else:
            normalized = np.zeros_like(pixel_array)
        
        return normalized
    
    def generate_preview_grid(
        self,
        dicom_files: list,
        grid_size: Tuple[int, int] = (3, 3),
        thumbnail_size: Tuple[int, int] = (128, 128)
    ) -> Optional[bytes]:
        """
        Generate grid of thumbnails from multiple DICOM files
        
        Args:
            dicom_files: List of DICOM file bytes
            grid_size: (rows, cols)
            thumbnail_size: Size of each thumbnail
            
        Returns:
            JPEG grid image bytes
        """
        try:
            rows, cols = grid_size
            total_images = min(len(dicom_files), rows * cols)
            
            # Create blank canvas
            canvas_width = cols * thumbnail_size[0]
            canvas_height = rows * thumbnail_size[1]
            canvas = Image.new('RGB', (canvas_width, canvas_height), 'black')
            
            # Generate and paste thumbnails
            for idx, dicom_data in enumerate(dicom_files[:total_images]):
                row = idx // cols
                col = idx % cols
                
                thumbnail_bytes = self.generate_from_dicom(
                    dicom_data,
                    size=thumbnail_size
                )
                
                if thumbnail_bytes:
                    thumbnail = Image.open(BytesIO(thumbnail_bytes))
                    x = col * thumbnail_size[0]
                    y = row * thumbnail_size[1]
                    canvas.paste(thumbnail, (x, y))
            
            # Save to bytes
            output = BytesIO()
            canvas.save(output, format='JPEG', quality=self.quality)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Failed to generate preview grid: {e}")
            return None


# Global thumbnail generator
thumbnail_generator: Optional[ThumbnailGenerator] = None


def init_thumbnail_generator(size: Tuple[int, int] = (256, 256), quality: int = 85):
    """Initialize thumbnail generator"""
    global thumbnail_generator
    thumbnail_generator = ThumbnailGenerator(size, quality)
    logger.info("Thumbnail generator initialized")


def get_thumbnail_generator() -> ThumbnailGenerator:
    """Get thumbnail generator instance"""
    if thumbnail_generator is None:
        raise RuntimeError("Thumbnail generator not initialized")
    return thumbnail_generator