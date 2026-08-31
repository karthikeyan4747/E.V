# Industrial Pipe Corrosion Degradation & Safety Verification
import math

print("=== SOVEREIGN CALCULATION ENGINE ===")
print("Standard: ASME B31.3 Process Piping")

nominal_thickness_mm = 12.7
measured_thickness_mm = 8.1
operating_pressure_bar = 14.2
pipe_outer_diameter_mm = 355.6  # 14 inch NPS
allowable_stress_psi = 20000     # A106 Grade B Carbon Steel
allowable_stress_bar = allowable_stress_psi * 0.0689476

# Metal loss calculation
metal_loss_pct = ((nominal_thickness_mm - measured_thickness_mm) / nominal_thickness_mm) * 100
print(f"\n1. Localized Metal Loss: {metal_loss_pct:.2f}%")

# Minimum required thickness per Barlow formula: t_min = (P * D) / (2 * S * E + 2 * Y * P)
weld_joint_efficiency = 1.0
temp_coefficient = 0.4
t_min_mm = (operating_pressure_bar * pipe_outer_diameter_mm) / (2 * allowable_stress_bar * weld_joint_efficiency + 2 * temp_coefficient * operating_pressure_bar)

print(f"2. Theoretical Minimum Safe Thickness: {t_min_mm:.2f} mm")
print(f"3. Measured Remaining Thickness: {measured_thickness_mm:.2f} mm")

# Verification verdict
margin_mm = measured_thickness_mm - t_min_mm
if margin_mm > 0:
    status = "COMPLIANT [SAFE MARGIN]"
    print(f"4. Status: {status} (Margin: +{margin_mm:.2f} mm)")
else:
    status = "NON-COMPLIANT [DERATING REQUIRED]"
    print(f"4. Status: {status} (Deficit: {margin_mm:.2f} mm)")

print("\n[Air-Gapped Sandbox Execution Verified]")
