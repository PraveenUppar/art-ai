import logging
import time


logging.basicConfig(level=logging.INFO)


def main() -> None:
    logging.info("Worker placeholder started. Add queue consumption when jobs are ready.")
    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()