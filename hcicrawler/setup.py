try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(
    name="hcicrawler",
    license="GPLv3",
    description="HCI crawler",
    author="medialab Sciences Po",
    author_email="medialab@sciences-po.fr",
    url="https://github.com/medialab/Hypertext-Corpus-Initiative",
    packages=['hcicrawler', 'hcicrawler.spiders'],
    entry_points = {'scrapy': ['settings = hcicrawler.settings']},
)
