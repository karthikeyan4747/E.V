"""
Test Suite for 100% On-Premises Local Image and Video Recognition
Tests MediaEngine, Content DNA multimodal ingestion, AI action routing, and streaming execution.
"""

import asyncio
import io
import os
import sys
import base64
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from media_engine import media_engine
from content_dna import content_dna_manager
from autonomous_engine import autonomous_agent, SovereignAction
from workflow_registry import workflow_validator, WORKFLOWS

async def run_media_tests():
    print("===================================================================")
    print("  EV SOVEREIGN LOCAL IMAGE & VIDEO RECOGNITION TEST SUITE")
    print("===================================================================")

    # -------------------------------------------------------------
    # 1. SYNTHETIC IMAGE GENERATION & COMPUTER VISION TESTING
    # -------------------------------------------------------------
    print("\n[TEST M1] Testing Local Computer Vision on Image Payload...")
    img = Image.new("RGB", (640, 480), color=(15, 23, 42)) # Slate-900 background
    img_np = np.array(img)
    # Draw high-contrast shapes
    cv2.rectangle(img_np, (50, 50), (250, 200), (56, 189, 248), -1) # Sky blue rectangle
    cv2.circle(img_np, (450, 240), 90, (244, 63, 94), -1) # Rose circle
    cv2.putText(img_np, "PRESSURE VESSEL V-101", (60, 400), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    buf = io.BytesIO()
    Image.fromarray(img_np).save(buf, format="PNG")
    png_bytes = buf.getvalue()
    b64_data_url = "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")

    img_res = media_engine.analyze_image(b64_data_url, "pressure_vessel_diagram.png")
    assert img_res["success"] is True, f"Image analysis failed: {img_res.get('error')}"
    assert img_res["width"] == 640
    assert img_res["height"] == 480
    assert img_res["contours_count"] > 0
    assert len(img_res["dominant_colors"]) >= 2
    assert "what_is_in_image" in img_res and len(img_res["what_is_in_image"]) > 0
    print(f"  ✓ Semantic Content: {img_res['what_is_in_image'][:80]}...")
    print(f"  ✓ Image decoded: {img_res['width']}x{img_res['height']} px ({img_res['orientation']})")
    print(f"  ✓ Exposure: {img_res['brightness_desc']}, Sharpness: {img_res['sharpness_desc']}")
    print(f"  ✓ Dominant Palette: {[c['hex'] for c in img_res['dominant_colors'][:3]]}")
    print(f"  ✓ Visual Contours: {img_res['contours_count']}")
    print("  -> TEST M1 PASSED: Local OpenCV & Pillow image recognition verified.")

    # -------------------------------------------------------------
    # 2. SYNTHETIC VIDEO GENERATION & LOCAL SCENE TIMELINE TESTING
    # -------------------------------------------------------------
    print("\n[TEST M2] Testing Local Video Frame Sampling & Scene Recognition...")
    w, h, fps = 320, 240, 10
    tmp_vid_path = Path("test_synthetic_pipe_scan.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(tmp_vid_path), fourcc, fps, (w, h))

    # 30 frames = 3 seconds video with dynamic camera motion
    for i in range(30):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        x_pos = int(30 + i * 8)
        cv2.circle(frame, (x_pos, 120), 20, (0, 255, 128), -1)
        cv2.putText(frame, f"PIPE SCAN t={i/fps:.1f}s", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        out.write(frame)
    out.release()

    with open(tmp_vid_path, "rb") as f:
        vid_bytes = f.read()
    if tmp_vid_path.exists():
        tmp_vid_path.unlink()

    vid_res = media_engine.analyze_video(vid_bytes, "synthetic_pipe_scan.mp4", max_keyframes=6)
    assert vid_res["success"] is True, f"Video analysis failed: {vid_res.get('error')}"
    assert vid_res["width"] == 320
    assert vid_res["height"] == 240
    assert vid_res["fps"] == 10.0
    assert vid_res["total_frames"] == 30
    assert len(vid_res["keyframes"]) > 0
    assert "what_is_in_video" in vid_res and len(vid_res["what_is_in_video"]) > 0
    print(f"  ✓ Video decoded: {vid_res['width']}x{vid_res['height']} px @ {vid_res['fps']} FPS")
    print(f"  ✓ Video Events: {vid_res['what_is_in_video'][:80]}...")
    print(f"  ✓ Duration: {vid_res['duration_formatted']} ({vid_res['total_frames']} frames)")
    print(f"  ✓ Motion Dynamics: {vid_res['motion_desc']} (delta: {vid_res['motion_intensity']:.1f})")
    print(f"  ✓ Chronological Keyframes Extracted: {len(vid_res['keyframes'])}")
    for kf in vid_res["keyframes"][:3]:
        print(f"    - [{kf['timestamp']}] {kf['description']}")
    print("  -> TEST M2 PASSED: Local OpenCV VideoCapture decoding & timeline extraction verified.")

    # -------------------------------------------------------------
    # 3. CONTENT DNA MULTIMODAL INGESTION
    # -------------------------------------------------------------
    print("\n[TEST M3] Testing Multimodal Content DNA Ingestion...")
    raw_img_dna = content_dna_manager.extract_raw_content("inspection_schematic.png", b64_data_url)
    assert "IMAGE COMPUTER VISION RECOGNITION" in raw_img_dna
    assert "VISUAL TELEMETRY & FINDINGS" in raw_img_dna
    print("  ✓ Content DNA raw extractor parsed image visual findings cleanly.")

    raw_vid_dna = content_dna_manager.extract_raw_content("corrosion_inspection.mp4", vid_bytes)
    assert "VIDEO COMPUTER VISION & SCENE RECOGNITION" in raw_vid_dna
    assert "CHRONOLOGICAL SCENE TIMELINE" in raw_vid_dna
    print("  ✓ Content DNA raw extractor parsed video timeline and telemetry cleanly.")
    print("  -> TEST M3 PASSED: Content DNA seamlessly integrates multimodal visual data.")

    # -------------------------------------------------------------
    # 4. PREDEFINED WORKFLOW REGISTRY & TOOL SAFETY
    # -------------------------------------------------------------
    print("\n[TEST M4] Testing MULTIMODAL_ANALYSIS Safety Validator...")
    assert "MULTIMODAL_ANALYSIS" in WORKFLOWS
    wf_def = WORKFLOWS["MULTIMODAL_ANALYSIS"]
    assert "image_recognizer" in wf_def.allowed_tools
    assert "video_recognizer" in wf_def.allowed_tools
    assert "media_analyzer" in wf_def.allowed_tools

    # Validate tool safety
    workflow_validator.validate_tool_execution("MULTIMODAL_ANALYSIS", "image_recognizer")
    workflow_validator.validate_tool_execution("MULTIMODAL_ANALYSIS", "video_recognizer")
    workflow_validator.validate_tool_execution("MULTIMODAL_ANALYSIS", "media_analyzer")
    print("  ✓ Tool Safety Validator approved image_recognizer, video_recognizer, and media_analyzer.")

    # Validate fail-closed safety
    blocked = False
    try:
        workflow_validator.validate_tool_execution("MULTIMODAL_ANALYSIS", "code_editor")
    except PermissionError:
        blocked = True
    assert blocked, "Tool safety validator failed to block unapproved tool code_editor in MULTIMODAL_ANALYSIS!"
    print("  ✓ Tool Safety Validator blocked unapproved tool 'code_editor' in MULTIMODAL_ANALYSIS.")
    print("  -> TEST M4 PASSED: Predefined workflow boundaries strictly enforced for media tools.")

    # -------------------------------------------------------------
    # 5. AUTONOMOUS AGENT INTENT CLASSIFICATION & PLAN FORMULATION
    # -------------------------------------------------------------
    print("\n[TEST M5] Testing Autonomous Agent AI Intent Classification for Media...")
    # Test attached image
    attached_img = [{"name": "turbine_blade.jpg", "content": b64_data_url}]
    res_img_ai = await autonomous_agent.classify_action_with_ai("inspect the attached image for damage", attached_files=attached_img)
    assert res_img_ai["action"] == SovereignAction.ANALYZE_IMAGE.value
    assert res_img_ai["workflow"] == "MULTIMODAL_ANALYSIS"
    print(f"  ✓ Image action classified: {res_img_ai['action']} -> {res_img_ai['workflow']}")

    # Test attached video
    attached_vid = [{"name": "pipeline_survey.mp4", "content": vid_bytes}]
    res_vid_ai = await autonomous_agent.classify_action_with_ai("review this inspection video and generate a scene timeline", attached_files=attached_vid)
    assert res_vid_ai["action"] == SovereignAction.ANALYZE_VIDEO.value
    assert res_vid_ai["workflow"] == "MULTIMODAL_ANALYSIS"
    print(f"  ✓ Video action classified: {res_vid_ai['action']} -> {res_vid_ai['workflow']}")

    # Test execution plan formulation for video
    plan = await autonomous_agent.formulate_plan("review inspection video", ".", attached_files=attached_vid)
    assert plan["workflow"] == "MULTIMODAL_ANALYSIS"
    assert len(plan["steps"]) >= 3
    print(f"  ✓ Formulated {len(plan['steps'])} plan steps for video analysis: {[s['title'] for s in plan['steps']]}")
    print("  -> TEST M5 PASSED: Media intent classification and dynamic plan schema verified.")

    # -------------------------------------------------------------
    # 6. END-TO-END STREAMING EXECUTION (IMAGE & VIDEO)
    # -------------------------------------------------------------
    print("\n[TEST M6] Testing End-to-End Multimodal Execution Streaming...")
    # Stream Image Analysis
    img_events = []
    async for ev in autonomous_agent.execute_stream("analyze this image", attached_files=attached_img):
        img_events.append(ev)

    media_ev = next((e for e in img_events if e.get("type") == "media_analyzed"), None)
    assert media_ev is not None, f"Expected media_analyzed event for image, got: {[e.get('type') for e in img_events]}"
    assert media_ev["media_type"] == "image"
    assert media_ev["data"]["width"] == 640
    print("  ✓ Streamed image recognition completed: emitted 'media_analyzed' event with optical telemetry.")

    # Stream Video Analysis
    vid_events = []
    async for ev in autonomous_agent.execute_stream("analyze this video timeline", attached_files=attached_vid):
        vid_events.append(ev)

    vid_media_ev = next((e for e in vid_events if e.get("type") == "media_analyzed"), None)
    assert vid_media_ev is not None, f"Expected media_analyzed event for video, got: {[e.get('type') for e in vid_events]}"
    assert vid_media_ev["media_type"] == "video"
    assert len(vid_media_ev["data"]["keyframes"]) > 0
    print(f"  ✓ Streamed video recognition completed: emitted 'media_analyzed' with {len(vid_media_ev['data']['keyframes'])} scene keyframes.")
    print("  -> TEST M6 PASSED: Multimodal image & video streaming execution verified end-to-end.")

    print("\n===================================================================")
    print("  ALL 6 MEDIA RECOGNITION TESTS PASSED! FULLY LOCAL & AIR-GAPPED.")
    print("===================================================================")

if __name__ == "__main__":
    asyncio.run(run_media_tests())
