import os
import re
from pathlib import Path
from typing import Any, Optional

DEFAULT_WORKSPACE = str(Path(__file__).parent.parent)

class ProjectWorkspaceManager:
    def __init__(self, default_path: str = DEFAULT_WORKSPACE):
        self.current_workspace: str = os.path.abspath(default_path)

    def normalize_path(self, raw_path: str) -> str:
        """Clean and normalize Windows/POSIX path strings."""
        path_str = str(raw_path or "").strip().strip('"\'')
        if path_str.startswith("file:///"):
            path_str = path_str[8:]
        elif path_str.startswith("file://"):
            path_str = path_str[7:]
        
        # Replace doubled quotes or escaped slashes
        path_str = os.path.expanduser(os.path.expandvars(path_str))
        
        # If relative path, resolve against current workspace
        if not os.path.isabs(path_str):
            candidate = os.path.join(self.current_workspace, path_str)
            if os.path.exists(candidate):
                path_str = candidate
                
        return os.path.abspath(path_str)

    def set_workspace(self, folder_path: str) -> dict[str, Any]:
        target = self.normalize_path(folder_path)
        if not os.path.exists(target):
            raise ValueError(f"Directory '{target}' does not exist on disk.")
        if not os.path.isdir(target):
            raise ValueError(f"Path '{target}' is a file, not a directory.")
        self.current_workspace = target
        return {
            "workspace_path": self.current_workspace,
            "name": os.path.basename(self.current_workspace) or self.current_workspace,
            "status": "LOADED"
        }

    def get_workspace_tree(self, max_depth: int = 4) -> dict[str, Any]:
        """Return hierarchical directory tree of current workspace, excluding git/venv/node_modules."""
        ignored_names = {
            ".git", ".venv", "venv", "node_modules", "__pycache__", 
            ".oxlintrc.json", "dist", ".gemini", ".vscode", "output", "build"
        }
        
        def build_tree(current_dir: Path, depth: int) -> dict[str, Any]:
            node = {
                "name": current_dir.name,
                "path": str(current_dir),
                "is_dir": True,
                "children": []
            }
            if depth >= max_depth:
                return node
            try:
                for entry in sorted(current_dir.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
                    if entry.name in ignored_names or entry.name.startswith("."):
                        continue
                    if entry.is_dir():
                        node["children"].append(build_tree(entry, depth + 1))
                    else:
                        node["children"].append({
                            "name": entry.name,
                            "path": str(entry),
                            "is_dir": False,
                            "size_bytes": entry.stat().st_size if entry.exists() else 0,
                            "extension": entry.suffix.lower()
                        })
            except PermissionError:
                pass
            return node

        root_path = Path(self.current_workspace)
        return {
            "root_path": str(root_path),
            "name": root_path.name or str(root_path),
            "tree": build_tree(root_path, depth=0)
        }

    def read_file(self, file_path: str) -> dict[str, Any]:
        clean_p = self.normalize_path(file_path)
        full_path = Path(clean_p)

        if not full_path.exists():
            raise FileNotFoundError(f"File '{full_path}' not found.")
        if full_path.is_dir():
            raise IsADirectoryError(f"'{full_path}' is a directory.")

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(full_path, "r", encoding="latin-1", errors="replace") as f:
                content = f.read()

        return {
            "path": str(full_path),
            "filename": full_path.name,
            "content": content,
            "extension": full_path.suffix.lower(),
            "size_bytes": len(content)
        }

    def write_file(self, file_path: str, content: str) -> dict[str, Any]:
        clean_p = self.normalize_path(file_path)
        full_path = Path(clean_p)

        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "path": str(full_path),
            "filename": full_path.name,
            "size_bytes": len(content),
            "status": "SAVED"
        }

    def search_workspace(self, query: str, max_results: int = 30) -> list[dict[str, Any]]:
        query_lower = query.lower().strip()
        if not query_lower:
            return []
        
        ignored_names = {
            ".git", ".venv", "venv", "node_modules", "__pycache__", 
            "dist", ".gemini", ".vscode", "output", "build"
        }
        allowed_extensions = {
            ".py", ".jsx", ".js", ".html", ".css", ".json", ".md", 
            ".txt", ".yaml", ".yml", ".toml", ".sql", ".sh", ".env"
        }

        results = []
        root_path = Path(self.current_workspace)

        for root, dirs, files in os.walk(root_path):
            dirs[:] = [d for d in dirs if d not in ignored_names and not d.startswith(".")]
            for f in files:
                ext = Path(f).suffix.lower()
                if ext not in allowed_extensions:
                    continue
                file_full = Path(root) / f
                try:
                    with open(file_full, "r", encoding="utf-8", errors="ignore") as f_obj:
                        lines = f_obj.readlines()
                    for line_idx, line in enumerate(lines, start=1):
                        if query_lower in line.lower():
                            rel_p = str(file_full.relative_to(root_path))
                            results.append({
                                "file": rel_p,
                                "full_path": str(file_full),
                                "line_number": line_idx,
                                "content": line.strip()[:200]
                            })
                            if len(results) >= max_results:
                                return results
                except Exception:
                    continue
        return results

project_workspace = ProjectWorkspaceManager()
