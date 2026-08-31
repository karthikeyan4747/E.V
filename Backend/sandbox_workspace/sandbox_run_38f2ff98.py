# File cleared on demand by user

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
