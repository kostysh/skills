import sys


def main():
    tags = {"yard": "Y", "bay": "B", "gate": "G"}
    print(tags[sys.argv[1]])


if __name__ == "__main__":
    main()
