# Module with process_data
def process_data():
    metrics = [10.2, 20.4, 30.6]
    mean_val = sum(metrics) / len(metrics)
    print(f"[process_data] Mean: {mean_val:.2f}")
    return mean_val

if __name__ == '__main__':
    process_data()
