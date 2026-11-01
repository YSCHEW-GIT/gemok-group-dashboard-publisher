# GEMOK Group Sales Dashboard Publisher

The GEMOK Collector updates dist/dashboard-data.json from its local cache after a successful collection.
The Collector must publish data files only. It must not replace the dashboard HTML, assets, or GitHub Actions workflow.

GitHub Pages uses site/canonical-index.html and site/assets/** as the canonical UI. The deployment workflow copies these files into dist before publishing.

For every UI, Collector, or deployment change, follow [the regression-prevention rules](REGRESSION_PREVENTION.md).
