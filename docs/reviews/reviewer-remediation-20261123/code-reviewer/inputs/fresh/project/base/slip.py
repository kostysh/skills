import sys


def format_slip(route, stop):
    return f"{route:<3}/{stop:03d}\r\n".encode("ascii")


if __name__ == "__main__":
    sys.stdout.buffer.write(format_slip(sys.argv[1], int(sys.argv[2])))
