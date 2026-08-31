
# Industrial Calculation & Safety Verification
import math

pressure_bar = 18.5
nominal_thickness_mm = 12.7
measured_thickness_mm = 6.8
corrosion_rate_mm_year = 1.2

# Remaining safe operating life
min_allowable_thickness = 4.5
remaining_life_years = (measured_thickness_mm - min_allowable_thickness) / corrosion_rate_mm_year
derated_pressure_bar = pressure_bar * (measured_thickness_mm / nominal_thickness_mm)

print(f"INPUT: Operating Pressure = {pressure_bar} bar")
print(f"INPUT: Measured Minimum Thickness = {measured_thickness_mm} mm")
print(f"FORMULA: Derated Pressure = P_nom * (t_actual / t_nom)")
print(f"CALCULATION: Derated Pressure = {derated_pressure_bar:.2f} bar")
print(f"RESULT: Remaining Life = {remaining_life_years:.1f} years")
