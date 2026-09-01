# Dynamic User-Specified Calculation
import math

inputs = [12.4, 18.6, 24.0, 0.2, 0.0, 1.0, 2.0, 1.0, 0.0, 1.0, 2.0, 0.0, 0.4, 0.4, 0.4, 0.4]
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

# Conditional Check
def check_condition(value: int = 10) -> bool:
    if value > 0:
        print("Status: Positive value processed successfully.")
        return True
    else:
        print("Status: Non-positive value encountered.")
        return False

if __name__ == '__main__':
    check_condition()

# Conditional Check
def check_condition(value: int = 10) -> bool:
    if value > 0:
        print("Status: Positive value processed successfully.")
        return True
    else:
        print("Status: Non-positive value encountered.")
        return False

if __name__ == '__main__':
    check_condition()

# Conditional Check
def check_condition(value: int = 10) -> bool:
    if value > 0:
        print("Status: Positive value processed successfully.")
        return True
    else:
        print("Status: Non-positive value encountered.")
        return False

if __name__ == '__main__':
    check_condition()

# Conditional Check
def check_condition(value: int = 10) -> bool:
    if value > 0:
        print("Status: Positive value processed successfully.")
        return True
    else:
        print("Status: Non-positive value encountered.")
        return False

if __name__ == '__main__':
    check_condition()

# Conditional Check
def check_condition(value: int = 10) -> bool:
    if value > 0:
        print("Status: Positive value processed successfully.")
        return True
    else:
        print("Status: Non-positive value encountered.")
        return False

if __name__ == '__main__':
    check_condition()
