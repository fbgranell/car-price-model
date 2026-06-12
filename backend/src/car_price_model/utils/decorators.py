import functools
import logging


def log_row_count(func):
    @functools.wraps(func)
    def wrapper(df, *args, **kwargs):
        logger = logging.getLogger(func.__module__)
        rows_in = len(df)
        result = func(df, *args, **kwargs)
        rows_out = len(result) if result is not None else 0
        logger.info(
            "%s: %d rows in -> %d rows out (%+d)",
            func.__name__,
            rows_in,
            rows_out,
            rows_out - rows_in,
        )
        return result

    return wrapper
