from labels import ordered_labels

assert ordered_labels([]) == []
rows = [
    {"shelf": "10", "job": "A"},
    {"shelf": "02", "job": "B"},
    {"shelf": "2", "job": "C"},
    {"shelf": "0", "job": "D"},
]
expected_order = [rows[3], rows[1], rows[2], rows[0]]
assert ordered_labels(rows) == expected_order
assert [row["job"] for row in rows] == ["A", "B", "C", "D"]
