from setuptools import setup

setup(name='jobmonitor',
    version='0.1',
    description='MLO Job Monitor',
    url='https://github.com/epfml/job-monitor',
    author='Thijs Vogels',
    author_email='thijs.vogels@epfl.ch',
    license='MIT',
    packages=['jobmonitor'],
    install_requires=[
        'pyyaml',
        'pymongo',
        'pytelegraf',
        'jinja2',
        'gitpython',
        'influxdb',
        'jsonschema',
    ],
    entry_points = {
        'console_scripts': [
            'jobrun=jobmonitor.run:main',
            'jobschedule=jobmonitor.schedule:main',
        ],
    },
    zip_safe=False,
)
