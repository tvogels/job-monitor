from setuptools import setup

setup(
    name="jobmonitor",
    version="0.1",
    description="MLO Job Monitor",
    url="https://github.com/epfml/job-monitor",
    author="Thijs Vogels",
    author_email="thijs.vogels@epfl.ch",
    license="MIT",
    packages=["jobmonitor"],
    install_requires=[
        "pyyaml",
        "pymongo",
        "pytelegraf",
        "jinja2",
        "gitpython",
        "influxdb",
        "kubernetes",
        "schema",
    ],
    entry_points={
        "console_scripts": [
            "jobrun=jobmonitor.run:main",
            "jobdelete=jobmonitor.delete:main",
            "jobkill=jobmonitor.kill:main",
            "jobshow=jobmonitor.show:main",
            "joblist=jobmonitor.list:main",
            "jobstar=jobmonitor.star:main",
            "jobbug=jobmonitor.bug:main",
            "joblogs=jobmonitor.logs:main",
            "jobworkers=jobmonitor.workers:main",
            "jobtimings=jobmonitor.timings:main",
            "kuberun=jobmonitor.kuberun:main",
        ]
    },
    zip_safe=False,
)
