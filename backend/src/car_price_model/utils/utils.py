import os
from pathlib import Path


def list_all_files(directory: str) -> list:
    """
    List all files in a directory.

    Args:
        directory: Path to the directory

    Returns:
        list: List of all files in the directory
    """
    dictory_path = Path(get_pyproject_root()) / Path(directory)
    files = [
        f
        for f in os.listdir(dictory_path)
        if os.path.isfile(os.path.join(dictory_path, f))
    ]
    files_path = [os.path.join(directory, f) for f in files]
    return files_path


def get_pyproject_root() -> str:
    """
    Get the pyproject.toml root directory.

    Returns:
        str: Path to the pyproject.toml root directory
    """
    return os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )
