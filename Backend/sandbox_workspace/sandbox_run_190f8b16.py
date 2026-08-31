```python
import argparse
import datetime
import random
import threading
import time
import queue
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class StreamTester:
    def __init__(self, num_sensors=5, duration=10, sample_rate=1):
        self.num_sensors = num_sensors
        self.duration = duration
        self.sample_rate = sample_rate
        self.data_queue = queue.Queue()
        self.stop_flag = False
        self.sensor_ids = [f"Sensor_{i}" for i in range(1, num_sensors + 1)]

    def generate_data(self):
        try:
            start_time = datetime.datetime.now()
            while not self.stop_flag:
                current_time = datetime.datetime.now()
                elapsed = (current_time - start_time).