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
            "%s: %s rows in -> %s rows out (%s | %s)",
            func.__name__,
            format(rows_in, ","),
            format(rows_out, ","),
            format(rows_out - rows_in, "+,"),  # <-- Cleaned up "+text," to just "+,"
            format((rows_out - rows_in) / rows_in * 100, "+.2f") + "%",
        )
        return result

    return wrapper
