# Dynamic User-Specified Calculation
import math

inputs = [12.4, 18.6, 24.0, 0.2, 0.0, 1.0, 2.0]
print(f"INPUT PARAMETERS: {inputs}")

total_sum = sum(inputs)
avg_val = total_sum / len(inputs)
product = 1.0
for x in inputs:
    product *= x

diff_val = inputs[0] - inputs[1] if len(inputs) >= 2 else 0

print(f"FORMULA EVALUATION:")
print(f"  • Computed Sum: {total_sum:.4f}")
print(f"  • Computed Mean: {avg_val:.4f}")
print(f"  • Computed Difference: {diff_val:.4f}")
print(f"  • Computed Product: {product:.4f}")
print(f"RESULT: Evaluated {len(inputs)} input parameters successfully.")
