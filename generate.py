#!/usr/bin/env python3
import os
import sys
import yaml
import json
import shutil
import argparse

from jinja2 import Environment, FileSystemLoader


"""
This script generates the configuration files for the Kubernetes pods + services.
The required arguments are loaded from the config.yaml file.
"""


TEMPLATE_DIR = "./kubernetes-templates"
GENERATE_DIR = "./kubernetes"


def generate():
    # load configuration from config.yaml
    with open("config.yaml", "r") as fin:
        config = yaml.load(fin)
    print("Loaded configuration:\n", json.dumps(config, indent=4, sort_keys=True))

    # generating kubernetes configuration files
    print("Generating Kubernetes configuration files...")
    if os.path.exists(GENERATE_DIR):
        print("{} already exists. Should the configuration files be overwritten?".format(GENERATE_DIR))
        answer = None
        while answer not in ['Y', 'y', 'N', 'n', '']:
            answer = input('Please confirm [Y/n]: ')

        if answer.lower() == 'n':
            print("Cancelled...")
            sys.exit(1)
        else:
            shutil.rmtree(GENERATE_DIR)

    # copy the whole template directory
    shutil.copytree(TEMPLATE_DIR, GENERATE_DIR)

    # loop over all files and replace template variables
    for root, _, filenames in os.walk(GENERATE_DIR):
        file_loader = FileSystemLoader(root)
        env = Environment(loader=file_loader)
        for filename in filenames:
            filepath = os.path.join(root, filename)
            outfile_path = os.path.join(root, filename.replace("-template", ""))

            template = env.get_template(filename)
            with open(outfile_path, "w") as fout:
                fout.write(template.render(**config))
                print("Generated {}.".format(outfile_path))
            os.remove(filepath)


def clean():
    if os.path.exists(GENERATE_DIR):
        shutil.rmtree(GENERATE_DIR)
        print("Removed {} folder.".format(GENERATE_DIR))
    else:
        print("Nothing to clean.")


if __name__ == "__main__":
    argparse = argparse.ArgumentParser()
    argparse.add_argument("command", type=str, help="Options=[clean, generate].")
    args = argparse.parse_args()

    if args.command == "generate":
        generate()
    elif args.command == "clean":
        clean()
    else:
        raise RuntimeError("Command '{}' is not known.".format(args.command))
