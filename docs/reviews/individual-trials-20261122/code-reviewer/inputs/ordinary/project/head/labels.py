def ordered_labels(rows):
    return sorted(rows, key=lambda row: int(row["shelf"]))
