import unittest

class TestFunctions(unittest.TestCase):
    def test_addition(self):
        self.assertEqual(2 + 2, 4)
    
    def test_string_concat(self):
        self.assertEqual("hello" + " " + "world", "hello world")
    
    def test_list_append(self):
        lst = [1, 2, 3]
        lst.append(4)
        self.assertEqual(lst, [1, 2, 3, 4])
    
    def test_divide_by_zero(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

if __name__ == '__main__':
    unittest.main(verbosity=2)