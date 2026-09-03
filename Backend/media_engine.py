"""
Sovereign Media Recognition & Computer Vision Engine
100% On-Premises, Air-Gapped Image and Video Recognition using OpenCV, Pillow, and Local Vision LLMs (Gemma 3).
"""

import os
import io
import re
import time
import uuid
import base64
import asyncio
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np
from PIL import Image

from sovereign_llm import sovereign_llm

MEDIA_TEMP_DIR = Path(__file__).parent / "sandbox_workspace" / "media"
MEDIA_TEMP_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".flv", ".wmv"}


class MediaEngine:
    """Local, air-gapped Computer Vision and Video Understanding Engine."""

    def __init__(self, temp_dir: Path = MEDIA_TEMP_DIR):
        self.temp_dir = temp_dir

    def is_image(self, filename: str, mime_type: Optional[str] = None) -> bool:
        ext = Path(filename).suffix.lower()
        if ext in IMAGE_EXTENSIONS:
            return True
        if mime_type and mime_type.startswith("image/"):
            return True
        return False

    def is_video(self, filename: str, mime_type: Optional[str] = None) -> bool:
        ext = Path(filename).suffix.lower()
        if ext in VIDEO_EXTENSIONS:
            return True
        if mime_type and mime_type.startswith("video/"):
            return True
        return False

    def decode_media_bytes(self, content: str | bytes) -> bytes:
        """Decodes raw bytes or Base64 / Data URL string into binary bytes."""
        if isinstance(content, bytes):
            return content
        if not isinstance(content, str):
            return b""
        
        # Strip Data URL header if present (e.g. data:image/png;base64,...)
        if content.startswith("data:") and ";base64," in content:
            content = content.split(";base64,", 1)[1]
        
        # Clean whitespace/newlines
        clean_b64 = re.sub(r"\s+", "", content)
        try:
            return base64.b64decode(clean_b64)
        except Exception:
            # Fallback to UTF-8 encode if not base64
            return content.encode("utf-8", errors="ignore")

    # -------------------------------------------------------------------------
    # IMAGE RECOGNITION & LOCAL COMPUTER VISION
    # -------------------------------------------------------------------------
    async def analyze_image_async(
        self,
        image_content: str | bytes,
        filename: str = "image.png",
        user_query: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Full on-premises image analysis:
        1. Fast OpenCV & Pillow technical metrics (dimensions, exposure, contrast, sharpness, dominant colors, contours).
        2. Local Vision LLM (Gemma 3) deep semantic understanding: answers what is in the image, identifies objects,
           scene, environment, people, text, and activities.
        """
        start_time = time.time()
        image_bytes = self.decode_media_bytes(image_content)
        if not image_bytes:
            return {
                "success": False,
                "error": "Empty or undecodable image payload",
                "filename": filename
            }

        # 1. Load via PIL for format & geometry
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            format_name = pil_img.format or "JPEG"
            width, height = pil_img.size
            pil_rgb = pil_img.convert("RGB")
        except Exception as e:
            return {
                "success": False,
                "error": f"Pillow image decode failed: {str(e)}",
                "filename": filename
            }

        # 2. Convert to OpenCV NumPy Array (BGR)
        np_arr = np.array(pil_rgb)
        cv_bgr = cv2.cvtColor(np_arr, cv2.COLOR_RGB2BGR)
        cv_gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)

        # 3. Brightness & RMS Contrast
        mean_brightness = float(np.mean(cv_gray))
        rms_contrast = float(np.std(cv_gray))
        brightness_desc = (
            "Dark / Low Light" if mean_brightness < 60
            else "Bright / High Key" if mean_brightness > 195
            else "Well-Balanced Exposure"
        )

        # 4. Sharpness / Blur Detection (Laplacian variance)
        laplacian_var = float(cv2.Laplacian(cv_gray, cv2.CV_64F).var())
        sharpness_desc = (
            "Crisp / In-Focus" if laplacian_var > 120.0
            else "Moderate Sharpness" if laplacian_var > 40.0
            else "Soft Focus / Motion Blurred"
        )

        # 5. Edge & Contour Detection (Canny)
        edges = cv2.Canny(cv_gray, 50, 150)
        edge_pixel_ratio = float(np.count_nonzero(edges)) / float(max(width * height, 1))
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours_count = len(contours)
        
        complexity_desc = (
            "High Detail / Text / Dense Geometry" if edge_pixel_ratio > 0.08
            else "Moderate Structural Detail" if edge_pixel_ratio > 0.02
            else "Minimal / Flat / Graphic"
        )

        # 6. Dominant Color Palette Extraction
        small_rgb = cv2.resize(np_arr, (64, 64), interpolation=cv2.INTER_AREA)
        pixels = small_rgb.reshape(-1, 3).astype(np.float32)
        dominant_colors = []
        try:
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            k = 4
            _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 3, cv2.KMEANS_RANDOM_CENTERS)
            counts = np.bincount(labels.flatten())
            total_pts = len(labels)
            
            for idx in np.argsort(-counts):
                rgb = centers[idx].astype(int)
                hex_code = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
                pct = round(float(counts[idx]) / total_pts * 100, 1)
                dominant_colors.append({
                    "hex": hex_code,
                    "rgb": rgb.tolist(),
                    "percentage": pct
                })
        except Exception:
            avg_c = np.mean(pixels, axis=0).astype(int)
            dominant_colors = [{
                "hex": f"#{avg_c[0]:02x}{avg_c[1]:02x}{avg_c[2]:02x}",
                "rgb": avg_c.tolist(),
                "percentage": 100.0
            }]

        # 7. Aspect Ratio Calculation
        aspect_ratio = round(float(width) / float(height), 2) if height > 0 else 1.0
        orientation = (
            "Landscape (16:9 / Wide)" if aspect_ratio >= 1.5
            else "Landscape (Standard 4:3)" if aspect_ratio > 1.1
            else "Portrait (Tall)" if aspect_ratio < 0.9
            else "Square (1:1)"
        )

        # 8. Encode optimized thumbnail for UI and model input
        thumb_img = pil_rgb.copy()
        thumb_img.thumbnail((768, 768), Image.Resampling.LANCZOS)
        thumb_buffer = io.BytesIO()
        thumb_img.save(thumb_buffer, format="JPEG", quality=85)
        thumb_b64 = base64.b64encode(thumb_buffer.getvalue()).decode("utf-8")
        thumb_data_url = f"data:image/jpeg;base64,{thumb_b64}"

        # 9. Deep Semantic Vision Recognition via Local Model (Gemma 3)
        vision_prompt = user_query.strip() if user_query and len(user_query.strip()) > 3 else (
            "Examine this image carefully. Describe what is in this image: "
            "what objects, people, environment, activities, text, or notable features are shown? "
            "Provide a direct, clear, and comprehensive description."
        )

        what_is_in_image = ""
        try:
            v_res = await sovereign_llm.generate(
                prompt=vision_prompt,
                task_type="vision",
                model="gemma3:4b",
                images=[thumb_b64],
                timeout=35.0
            )
            what_is_in_image = v_res.get("text", "").strip()
        except Exception as e:
            # Fallback if local vision model is unavailable
            palette_desc = ", ".join([c["hex"] for c in dominant_colors[:2]])
            what_is_in_image = (
                f"Visual asset `{filename}` showing a {orientation.lower()} scene with {brightness_desc.lower()}, "
                f"{complexity_desc.lower()}, dominant {palette_desc} hues, and {contours_count} structural features."
            )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # 10. Synthesize Detailed Natural Language Visual Findings
        findings = [
            f"Content: {what_is_in_image}",
            f"Dimensions: {width} x {height} px ({orientation}, {aspect_ratio}:1 aspect ratio)",
            f"Exposure: {brightness_desc} (Mean Luminance: {mean_brightness:.1f}/255)",
            f"Focus & Sharpness: {sharpness_desc} (Laplacian variance: {laplacian_var:.1f})",
            f"Visual Complexity: {complexity_desc} ({contours_count} salient contour segments)",
            f"Primary Palette: {', '.join(c['hex'] + ' (' + str(c['percentage']) + '%)' for c in dominant_colors[:3])}"
        ]

        summary_text = (
            f"{what_is_in_image}\n\n"
            f"**Optical Telemetry:** Verified {format_name} image (`{filename}`, {width}x{height} px, {orientation}) "
            f"with {brightness_desc.lower()} and {sharpness_desc.lower()}."
        )

        return {
            "success": True,
            "media_type": "image",
            "filename": filename,
            "format": format_name,
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "orientation": orientation,
            "what_is_in_image": what_is_in_image,
            "mean_brightness": round(mean_brightness, 1),
            "brightness_desc": brightness_desc,
            "rms_contrast": round(rms_contrast, 1),
            "laplacian_var": round(laplacian_var, 1),
            "sharpness_desc": sharpness_desc,
            "contours_count": contours_count,
            "edge_density_pct": round(edge_pixel_ratio * 100, 2),
            "complexity_desc": complexity_desc,
            "dominant_colors": dominant_colors,
            "thumbnail_url": thumb_data_url,
            "findings": findings,
            "summary": summary_text,
            "duration_ms": duration_ms
        }

    def analyze_image(
        self,
        image_content: str | bytes,
        filename: str = "image.png",
        user_query: Optional[str] = None
    ) -> dict[str, Any]:
        """Synchronous wrapper for analyze_image_async."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Run inside existing loop
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self.analyze_image_async(image_content, filename, user_query)).result()
            else:
                return loop.run_until_complete(self.analyze_image_async(image_content, filename, user_query))
        except Exception:
            return asyncio.run(self.analyze_image_async(image_content, filename, user_query))

    # -------------------------------------------------------------------------
    # VIDEO RECOGNITION & LOCAL SCENE TIMELINE EXTRACTION
    # -------------------------------------------------------------------------
    async def analyze_video_async(
        self,
        video_content: str | bytes,
        filename: str = "video.mp4",
        user_query: Optional[str] = None,
        max_keyframes: int = 6
    ) -> dict[str, Any]:
        """
        Analyzes a video file on-premises:
        1. OpenCV VideoCapture extracts FPS, duration, resolution, total frames.
        2. Samples chronological keyframes and calculates frame-to-frame motion delta.
        3. Local Vision LLM (Gemma 3) analyzes sampled keyframes to describe what happens across the video timeline.
        """
        start_time = time.time()
        video_bytes = self.decode_media_bytes(video_content)
        if not video_bytes:
            return {
                "success": False,
                "error": "Empty or undecodable video payload",
                "filename": filename
            }

        ext = Path(filename).suffix.lower() or ".mp4"
        run_id = uuid.uuid4().hex[:8]
        tmp_video_path = self.temp_dir / f"video_stream_{run_id}{ext}"
        
        with open(tmp_video_path, "wb") as f:
            f.write(video_bytes)

        cap = cv2.VideoCapture(str(tmp_video_path))
        if not cap.isOpened():
            if tmp_video_path.exists():
                try:
                    tmp_video_path.unlink()
                except Exception:
                    pass
            return {
                "success": False,
                "error": f"Could not decode video file {filename} via local OpenCV codecs",
                "filename": filename
            }

        # 1. Read Video Properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 24.0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration_sec = total_frames / fps if (fps > 0 and total_frames > 0) else 0.0

        aspect_ratio = round(float(width) / float(height), 2) if height > 0 else 1.0
        orientation = (
            "Landscape (16:9 / Widescreen)" if aspect_ratio >= 1.5
            else "Landscape (4:3)" if aspect_ratio > 1.1
            else "Portrait / Vertical Video (9:16)" if aspect_ratio < 0.9
            else "Square (1:1)"
        )

        # 2. Determine Keyframe Sampling Indices
        sample_count = min(max_keyframes, max(1, total_frames))
        if total_frames > 1:
            frame_indices = np.linspace(0, total_frames - 1, sample_count, dtype=int).tolist()
        else:
            frame_indices = [0]

        keyframes = []
        keyframe_b64_list = []
        motion_deltas = []
        prev_gray = None
        current_frame_idx = 0

        # 3. Process video frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Motion evaluation (sample every 8 frames)
            if current_frame_idx % 8 == 0:
                gray_small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (160, 120))
                if prev_gray is not None:
                    diff = cv2.absdiff(gray_small, prev_gray)
                    motion_deltas.append(float(np.mean(diff)))
                prev_gray = gray_small

            # Extract keyframe if current frame matches target index
            if current_frame_idx in frame_indices:
                timestamp_sec = current_frame_idx / fps if fps > 0 else 0.0
                minutes = int(timestamp_sec // 60)
                seconds = int(timestamp_sec % 60)
                timestamp_label = f"{minutes:02d}:{seconds:02d}"

                thumb_h, thumb_w = frame.shape[:2]
                scale = 480.0 / max(thumb_w, 1)
                thumb_dim = (int(thumb_w * scale), int(thumb_h * scale))
                thumb_cv = cv2.resize(frame, thumb_dim, interpolation=cv2.INTER_AREA)

                _, enc_buf = cv2.imencode(".jpg", thumb_cv, [cv2.IMWRITE_JPEG_QUALITY, 80])
                thumb_b64 = base64.b64encode(enc_buf).decode("utf-8")
                keyframe_thumb_url = f"data:image/jpeg;base64,{thumb_b64}"
                keyframe_b64_list.append(thumb_b64)

                gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                lum = float(np.mean(gray_frame))
                edges = cv2.Canny(gray_frame, 50, 150)
                contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                keyframes.append({
                    "frame_index": current_frame_idx,
                    "timestamp": timestamp_label,
                    "timestamp_sec": round(timestamp_sec, 2),
                    "thumbnail_url": keyframe_thumb_url,
                    "luminance": round(lum, 1),
                    "contours": len(contours),
                    "description": f"Scene at {timestamp_label}: {len(contours)} contours, {'brightly lit' if lum > 130 else 'shadowed'}"
                })

            current_frame_idx += 1
            if current_frame_idx > total_frames and total_frames > 0:
                break

        cap.release()

        # Clean up temporary video file
        if tmp_video_path.exists():
            try:
                tmp_video_path.unlink()
            except Exception:
                pass

        # 4. Motion Dynamics Assessment
        avg_motion = float(np.mean(motion_deltas)) if motion_deltas else 0.0
        motion_desc = (
            "Dynamic / Rapid Movement or Action" if avg_motion > 15.0
            else "Moderate Motion Dynamics" if avg_motion > 5.0
            else "Stable / Steady Scene Camera"
        )

        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        duration_formatted = f"{mins:02d}:{secs:02d}"

        # 5. Deep Semantic Video Recognition via Local Vision Model
        what_is_in_video = ""
        sample_subset = keyframe_b64_list[:4] # Pass up to 4 keyframes for fast reasoning
        if sample_subset:
            v_prompt = user_query.strip() if user_query and len(user_query.strip()) > 3 else (
                f"Here are {len(sample_subset)} chronological keyframes from a {duration_formatted} video asset. "
                "Describe what happens in this video. What are the subjects, actions, environment, and events shown?"
            )
            try:
                v_res = await sovereign_llm.generate(
                    prompt=v_prompt,
                    task_type="vision",
                    model="gemma3:4b",
                    images=sample_subset,
                    timeout=45.0
                )
                what_is_in_video = v_res.get("text", "").strip()
            except Exception as e:
                what_is_in_video = (
                    f"Video asset `{filename}` ({duration_formatted}, {width}x{height} px) showing a sequence with "
                    f"{motion_desc.lower()} and {len(keyframes)} scene transitions."
                )
        else:
            what_is_in_video = f"Video asset `{filename}` ({duration_formatted}, {width}x{height} px)."

        duration_ms = round((time.time() - start_time) * 1000, 2)

        summary_text = (
            f"{what_is_in_video}\n\n"
            f"**Temporal Telemetry:** Verified video asset `{filename}` ({duration_formatted}, {width}x{height} px, {fps:.1f} FPS, {total_frames} frames). "
            f"Motion dynamics: **{motion_desc.lower()}** (delta: {avg_motion:.1f})."
        )

        findings = [
            f"Content & Events: {what_is_in_video}",
            f"Video Stream: {width} x {height} px @ {fps:.1f} FPS ({orientation})",
            f"Duration: {duration_formatted} ({duration_sec:.2f} seconds, {total_frames} frames)",
            f"Motion Intensity: {motion_desc} (index: {avg_motion:.1f})",
            f"Scene Keyframes: Extracted {len(keyframes)} chronological timeline keyframes",
            f"Format / Codec: {ext.upper().strip('.')} Local OpenCV Decoding"
        ]

        return {
            "success": True,
            "media_type": "video",
            "filename": filename,
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "duration_sec": round(duration_sec, 2),
            "duration_formatted": duration_formatted,
            "aspect_ratio": aspect_ratio,
            "orientation": orientation,
            "what_is_in_video": what_is_in_video,
            "motion_intensity": avg_motion,
            "motion_desc": motion_desc,
            "keyframes": keyframes,
            "findings": findings,
            "summary": summary_text,
            "duration_ms": duration_ms
        }

    def analyze_video(
        self,
        video_content: str | bytes,
        filename: str = "video.mp4",
        user_query: Optional[str] = None,
        max_keyframes: int = 6
    ) -> dict[str, Any]:
        """Synchronous wrapper for analyze_video_async."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self.analyze_video_async(video_content, filename, user_query, max_keyframes)).result()
            else:
                return loop.run_until_complete(self.analyze_video_async(video_content, filename, user_query, max_keyframes))
        except Exception:
            return asyncio.run(self.analyze_video_async(video_content, filename, user_query, max_keyframes))


media_engine = MediaEngine()
