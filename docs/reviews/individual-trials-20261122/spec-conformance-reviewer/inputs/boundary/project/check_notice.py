from notice import make_record, submit


class DeskArchive:
    def __init__(self):
        self.items = {}

    def save(self, key, value):
        self.items[key] = value


saved = make_record("lot-07", None)
assert saved["job"] == "lot-07"
assert saved["mass"] == "0"
desk = DeskArchive()
result = submit(desk, "lot-07", None)
assert desk.items["lot-07"] == result
