"""
OODA GitHub Fetcher — Phase 7
Fetches repo activity signals from GitHub's public API.

If no repo configured, skips gracefully.
Falls back to unauthenticated requests if GITHUB_TOKEN is missing.
Never crashes.
"""

import logging
from typing import Optional

import httpx

from backend.config import settings
from backend.ingestion.signal_normalizer import normalize_signal

logger = logging.getLogger("ooda.ingestion.github")

GITHUB_API_BASE = "https://api.github.com"


class GitHubFetcher:
    """Fetch repo activity signals from GitHub API."""

    def __init__(self):
        self._http = httpx.Client(timeout=5.0)

    def fetch(
        self,
        repo: Optional[str],
        competitor_name: str,
        competitor_id: Optional[str] = None,
    ) -> tuple[list[dict], list[str]]:
        """
        Fetch GitHub repo activity for a competitor.

        Parameters
        ----------
        repo : str or None
            GitHub repo in 'owner/repo' format.
        competitor_name : str
            Display name of the competitor.
        competitor_id : str or None
            Competitor DB ID.

        Returns
        -------
        tuple[list[dict], list[str]]
            (list of normalized signal dicts, list of warnings)
        """
        warnings = []

        if not repo:
            return [], warnings

        # Extract owner/repo from URL if needed
        repo_path = self._extract_repo_path(repo)
        if not repo_path:
            warnings.append(f"Invalid GitHub repo format: {repo}")
            return [], warnings

        try:
            headers = {"Accept": "application/vnd.github.v3+json"}
            if settings.GITHUB_TOKEN:
                headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

            # Fetch repo info
            repo_url = f"{GITHUB_API_BASE}/repos/{repo_path}"
            response = self._http.get(repo_url, headers=headers)

            if response.status_code == 404:
                warnings.append(f"GitHub repo not found: {repo_path}")
                return [], warnings

            response.raise_for_status()
            repo_data = response.json()

            signals = []

            # Signal 1: Repo activity summary
            stars = repo_data.get("stargazers_count", 0)
            forks = repo_data.get("forks_count", 0)
            open_issues = repo_data.get("open_issues_count", 0)
            pushed_at = repo_data.get("pushed_at", "")
            description = repo_data.get("description", "")

            sig = normalize_signal(
                source="github",
                signal_type="repo_activity",
                competitor_id=competitor_id,
                competitor_name=competitor_name,
                summary=f"{competitor_name} GitHub: {stars} stars, {forks} forks, last push {pushed_at[:10] if pushed_at else 'unknown'}",
                raw_content=description[:500] if description else "",
                severity="LOW",
                metadata={
                    "repo": repo_path,
                    "stars": stars,
                    "forks": forks,
                    "open_issues": open_issues,
                    "pushed_at": pushed_at,
                },
            )
            signals.append(sig)

            # Fetch recent commits for velocity signal
            commits_signals = self._fetch_recent_commits(
                repo_path, headers, competitor_name, competitor_id
            )
            signals.extend(commits_signals)

            logger.info("GitHub: Found %d signals for '%s'", len(signals), repo_path)
            return signals, warnings

        except httpx.TimeoutException:
            warnings.append("GitHub request timed out")
            logger.warning("GitHub request timed out for '%s'", repo)
            return [], warnings
        except Exception as e:
            warnings.append(f"GitHub error: {str(e)[:100]}")
            logger.warning("GitHub error: %s", str(e))
            return [], warnings

    def _fetch_recent_commits(
        self,
        repo_path: str,
        headers: dict,
        competitor_name: str,
        competitor_id: Optional[str],
    ) -> list[dict]:
        """Fetch recent commits to gauge product velocity."""
        try:
            url = f"{GITHUB_API_BASE}/repos/{repo_path}/commits"
            response = self._http.get(
                url, headers=headers, params={"per_page": 5}
            )
            if response.status_code != 200:
                return []

            commits = response.json()
            if not commits or not isinstance(commits, list):
                return []

            commit_count = len(commits)
            latest_msg = commits[0].get("commit", {}).get("message", "")[:200] if commits else ""

            if commit_count >= 3:
                severity = "MEDIUM"
                summary = f"{competitor_name} shows high product velocity: {commit_count} recent commits"
            else:
                severity = "LOW"
                summary = f"{competitor_name} has {commit_count} recent commits"

            return [normalize_signal(
                source="github",
                signal_type="product_velocity",
                competitor_id=competitor_id,
                competitor_name=competitor_name,
                summary=summary,
                raw_content=f"Latest commit: {latest_msg}",
                severity=severity,
                metadata={
                    "repo": repo_path,
                    "recent_commit_count": commit_count,
                    "latest_message": latest_msg,
                },
            )]
        except Exception:
            return []

    @staticmethod
    def _extract_repo_path(repo: str) -> Optional[str]:
        """Extract 'owner/repo' from various input formats."""
        if not repo:
            return None

        # Already in owner/repo format
        repo = repo.strip().rstrip("/")

        # Remove github.com URL prefix
        for prefix in ["https://github.com/", "http://github.com/", "github.com/"]:
            if repo.lower().startswith(prefix):
                repo = repo[len(prefix):]
                break

        # Remove .git suffix
        if repo.endswith(".git"):
            repo = repo[:-4]

        # Validate format
        parts = repo.split("/")
        if len(parts) >= 2 and parts[0] and parts[1]:
            return f"{parts[0]}/{parts[1]}"

        return None
