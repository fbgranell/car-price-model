import os
from pathlib import Path
from dotenv import load_dotenv


def list_all_files(directory: str) -> list:
    """
    List all files in a directory.

    Args:
        directory: Path to the directory

    Returns:
        list: List of all files in the directory
    """
    dictory_path = Path(get_pyproject_root()) / Path(directory)
    files = [f for f in os.listdir(dictory_path) if os.path.isfile(os.path.join(dictory_path, f))]
    files_path = [os.path.join(directory, f) for f in files]
    return files_path


def get_pyproject_root() -> str:
    """
    Get the pyproject.toml root directory.

    Returns:
        str: Path to the pyproject.toml root directory
    """
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def load_env():
    """Load environment variables from .env file."""
    path = os.path.dirname(get_pyproject_root()) + "/.env"
    is_env_loaded = load_dotenv(path)
    if not is_env_loaded:
        raise ValueError(f".env file could not be found on path {path}")
    
def file_exists(path):
    return os.path.isfile(f"{get_pyproject_root()}/{path}")