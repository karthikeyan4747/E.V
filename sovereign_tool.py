import argparse

def calculate_cdu_mass_flow(inlets: list[float], outlets: list[float]) -> float:
    """
    Calculate the net mass flow rate across Crude Distillation Unit (CDU).
    """
    return sum(inlets) - sum(outlets)

if __name__ == "__main__":
    print("Net Mass Flow:", calculate_cdu_mass_flow([100.0, 50.0], [80.0, 60.0]))