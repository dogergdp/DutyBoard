import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ImageCropperProps {
    open: boolean;
    onClose: () => void;
    onCrop: (croppedFile: File) => void;
    imageFile: File | null;
}

export default function ImageCropper({ open, onClose, onCrop, imageFile }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!imageFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                drawImage(img, scale, position.x, position.y);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imageFile);
    }, [imageFile]);

    const drawImage = (img: HTMLImageElement, scale: number, offsetX: number, offsetY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300;
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // Draw circle overlay
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.stroke();
    };

    useEffect(() => {
        if (imageRef.current) {
            drawImage(imageRef.current, scale, position.x, position.y);
        }
    }, [scale, position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !imageRef.current) return;

        setPosition((prev) => ({
            x: prev.x + e.movementX,
            y: prev.y + e.movementY,
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300;
        const circleCanvas = document.createElement('canvas');
        circleCanvas.width = size;
        circleCanvas.height = size;

        const circleCtx = circleCanvas.getContext('2d');
        if (!circleCtx) return;

        // Copy the image
        const imageData = ctx.getImageData(0, 0, size, size);
        circleCtx.putImageData(imageData, 0, 0);

        // Create circular mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        maskCtx.fillStyle = 'black';
        maskCtx.beginPath();
        maskCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        maskCtx.fill();

        // Apply mask
        circleCtx.globalCompositeOperation = 'destination-in';
        circleCtx.drawImage(maskCanvas, 0, 0);

        // Convert to file
        circleCanvas.toBlob((blob) => {
            if (blob && imageFile) {
                const croppedFile = new File([blob], imageFile.name, { type: 'image/png' });
                onCrop(croppedFile);
                onClose();
            }
        }, 'image/png');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                    <DialogDescription>
                        Drag to reposition the image. Adjust the zoom level below.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <canvas
                            ref={canvasRef}
                            className="w-full h-auto"
                            style={{ maxHeight: '400px' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zoom">Zoom</Label>
                        <input
                            id="zoom"
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500 text-right">
                            {Math.round(scale * 100)}%
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCrop}>
                        Crop & Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
