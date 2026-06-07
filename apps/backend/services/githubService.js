export const getGithubRepos = async (token) => {
  if (!token) return [];
  try {
    const response = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) return [];
    const repos = await response.json();
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      language: repo.language,
      description: repo.description,
    }));
  } catch {
    return [];
  }
};
