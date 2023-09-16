# Github Pages

The contents of this directory are automatically pushed to the `gh-pages` branch using the [.github/workflows/gh-deploy.yml](../.github/workflows/gh-deploy.yml).

It powers the Github pages site at https://essentialkit.github.io/xtension/.

The [_config.yml](_config.yml) file is generated from data values in the repo's package.json, extension's manifest.json and jekyll's site_config.yml. 
Similarly, the assets directory and README.md are both copied from the repository. Duplicating them here is easier to maintain than doing so in the gh-pages branch.

The theme is [Jekyll Minima](https://github.com/jekyll/minima) and is specified in the [site_config.yml](site_config.yml) file. For alternatives see https://pages.github.com/themes/.

For more information on configuring Github pages deployment see https://github.com/marketplace/actions/push-git-subdirectory-as-branch.

If a domain is pointed to the Github Page, Github would automatically add a CNAME file to this branch.
Check in that CNAME locally to avoid overwrite.
